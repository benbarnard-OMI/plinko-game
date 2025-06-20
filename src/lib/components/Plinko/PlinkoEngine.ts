import { DEFAULT_PRIZE_BINS } from '$lib/constants/game';
import {
  columnCount,
  prizeRecords,
  prizeBins,
} from '$lib/stores/game';
import type { ColumnCount, PrizeBin, PrizeRecord } from '$lib/types';
import { getRandomBetween } from '$lib/utils/numbers';
import Matter, { type IBodyDefinition } from 'matter-js';
import { get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

type TokenFrictionsByColumnCount = {
  friction: NonNullable<IBodyDefinition['friction']>;
  frictionAirByColumnCount: Record<ColumnCount, NonNullable<IBodyDefinition['frictionAir']>>;
};

/**
 * Engine for rendering the TV-style Plinko game using [matter-js](https://brm.io/matter-js/).
 * 
 * Creates a uniform-width rectangular grid of pegs with equal-sized drop slots at the top
 * and prize bins at the bottom, just like the classic TV show.
 *
 * The engine will read/write data to Svelte stores during game state changes.
 */
class PlinkoEngine {
  /**
   * The canvas element to render the game to.
   */
  private canvas: HTMLCanvasElement;

  /**
   * A cache value of the {@link columnCount} store for faster access.
   */
  private columnCount: ColumnCount;

  private engine: Matter.Engine;
  private render: Matter.Render;
  private runner: Matter.Runner;

  /**
   * Every pin of the game in the rectangular grid.
   */
  private pins: Matter.Body[] = [];
  /**
   * Walls are invisible barriers at the left and right sides of the
   * game area to keep tokens within the play field.
   */
  private walls: Matter.Body[] = [];
  /**
   * "Sensor" is an invisible body at the bottom of the canvas. It detects whether
   * a token arrives at the bottom and enters a prize bin.
   */
  private sensor: Matter.Body;

  /**
   * The x-coordinates of each prize bin boundary. Used for calculating
   * which bin a token falls into.
   */
  private binBoundaries: number[] = [];

  static WIDTH = 760;
  static HEIGHT = 570;

  private static PADDING_X = 52;
  private static PADDING_TOP = 36;
  private static PADDING_BOTTOM = 28;

  private static PIN_CATEGORY = 0x0001;
  private static TOKEN_CATEGORY = 0x0002;

  /**
   * Friction parameters to be applied to the token body.
   * These values create realistic bouncing and movement.
   */
  private static tokenFrictions: TokenFrictionsByColumnCount = {
    friction: 0.5,
    frictionAirByColumnCount: {
      7: 0.041,
      9: 0.0395,
      11: 0.038,
    },
  };

  /**
   * Creates the engine and the game's layout.
   *
   * @param canvas The canvas element to render the game to.
   *
   * @remarks This constructor does NOT start the rendering and physics engine.
   * Call the `start` method to start the engine.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.columnCount = get(columnCount);
    columnCount.subscribe((value) => this.updateColumnCount(value));

    this.engine = Matter.Engine.create({
      timing: {
        timeScale: 1,
      },
    });
    this.render = Matter.Render.create({
      engine: this.engine,
      canvas: this.canvas,
      options: {
        width: PlinkoEngine.WIDTH,
        height: PlinkoEngine.HEIGHT,
        background: '#0f1728',
        wireframes: false,
      },
    });
    this.runner = Matter.Runner.create();

    this.createUniformBoard();

    this.sensor = Matter.Bodies.rectangle(
      this.canvas.width / 2,
      this.canvas.height,
      this.canvas.width,
      10,
      {
        isSensor: true,
        isStatic: true,
        render: {
          visible: false,
        },
      },
    );
    Matter.Composite.add(this.engine.world, [this.sensor]);
    Matter.Events.on(this.engine, 'collisionStart', ({ pairs }) => {
      pairs.forEach(({ bodyA, bodyB }) => {
        if (bodyA === this.sensor) {
          this.handleTokenEnterBin(bodyB);
        } else if (bodyB === this.sensor) {
          this.handleTokenEnterBin(bodyA);
        }
      });
    });
  }

  /**
   * Renders the game and starts the physics engine.
   */
  start() {
    Matter.Render.run(this.render); // Renders the scene to canvas
    Matter.Runner.run(this.runner, this.engine); // Starts the simulation in physics engine
  }

  /**
   * Stops (pauses) the rendering and physics engine.
   */
  stop() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
  }

  /**
   * Drops a new token from one of the top drop slots.
   */
  dropToken() {
    const slotWidth = this.gameWidth / this.columnCount;
    const randomSlot = Math.floor(Math.random() * this.columnCount);
    const dropX = PlinkoEngine.PADDING_X + slotWidth * randomSlot + slotWidth / 2;
    const tokenRadius = this.pinRadius * 2;
    const { friction, frictionAirByColumnCount } = PlinkoEngine.tokenFrictions;

    const token = Matter.Bodies.circle(
      dropX + getRandomBetween(-slotWidth * 0.2, slotWidth * 0.2), // Small random offset within slot
      0,
      tokenRadius,
      {
        restitution: 0.8, // Bounciness
        friction,
        frictionAir: frictionAirByColumnCount[this.columnCount],
        collisionFilter: {
          category: PlinkoEngine.TOKEN_CATEGORY,
          mask: PlinkoEngine.PIN_CATEGORY, // Collide with pins only, but not other tokens
        },
        render: {
          fillStyle: '#ff0000',
        },
      },
    );
    Matter.Composite.add(this.engine.world, token);
  }

  /**
   * Total width of all bins as percentage of the canvas width.
   */
  get binsWidthPercentage(): number {
    return this.gameWidth / PlinkoEngine.WIDTH;
  }

  /**
   * Gets the game area width (excluding padding).
   */
  private get gameWidth(): number {
    return this.canvas.width - PlinkoEngine.PADDING_X * 2;
  }

  /**
   * Gets the horizontal distance between each pin's center point.
   */
  private get pinDistanceX(): number {
    return this.gameWidth / (this.columnCount - 1);
  }

  /**
   * Gets the vertical distance between each pin row.
   */
  private get pinDistanceY(): number {
    const gameHeight = this.canvas.height - PlinkoEngine.PADDING_TOP - PlinkoEngine.PADDING_BOTTOM;
    const rowCount = 12; // Fixed number of rows for TV-style board
    return gameHeight / (rowCount - 1);
  }

  private get pinRadius(): number {
    return Math.min(8, (24 - this.columnCount) / 2);
  }

  /**
   * Refreshes the game with a new number of columns.
   *
   * Does nothing if the new column count equals the current count.
   */
  private updateColumnCount(newColumnCount: ColumnCount) {
    if (newColumnCount === this.columnCount) {
      return;
    }

    this.removeAllTokens();
    this.columnCount = newColumnCount;
    this.createUniformBoard();
  }

  /**
   * Called when a token hits the invisible sensor at the bottom.
   */
  private handleTokenEnterBin(token: Matter.Body) {
    const tokenX = token.position.x;
    const binIndex = this.calculateBinIndex(tokenX);
    
    if (binIndex >= 0 && binIndex < this.columnCount) {
      const currentPrizeBins = get(prizeBins);
      const prize = currentPrizeBins[binIndex] || { id: 'unknown', name: 'Unknown Prize', tier: 'small' };
      
      const record: PrizeRecord = {
        id: uuidv4(),
        binIndex,
        prize,
        timestamp: Date.now(),
        columnCount: this.columnCount,
      };

      prizeRecords.update((records) => [...records, record]);
    }

    Matter.Composite.remove(this.engine.world, token);
  }

  /**
   * Calculate which bin a token fell into based on its x-position.
   */
  private calculateBinIndex(x: number): number {
    const relativeX = x - PlinkoEngine.PADDING_X;
    const binWidth = this.gameWidth / this.columnCount;
    const binIndex = Math.floor(relativeX / binWidth);
    return Math.max(0, Math.min(this.columnCount - 1, binIndex));
  }

  /**
   * Creates a uniform rectangular grid of pins (TV show style).
   * Previous pins and walls are removed before creating new ones.
   */
  private createUniformBoard() {
    const { PADDING_X, PADDING_TOP, PADDING_BOTTOM, PIN_CATEGORY, TOKEN_CATEGORY } = PlinkoEngine;

    // Remove existing pins and walls
    if (this.pins.length > 0) {
      Matter.Composite.remove(this.engine.world, this.pins);
      this.pins = [];
    }
    if (this.walls.length > 0) {
      Matter.Composite.remove(this.engine.world, this.walls);
      this.walls = [];
    }

    const rowCount = 12; // Fixed number of rows for TV-style board
    const pinDistanceX = this.pinDistanceX;
    const pinDistanceY = this.pinDistanceY;

    // Create uniform rectangular grid of pins
    for (let row = 0; row < rowCount; row++) {
      const rowY = PADDING_TOP + pinDistanceY * row;
      
      // Offset every other row to create the pin pattern
      const xOffset = (row % 2) * (pinDistanceX / 2);
      
      for (let col = 0; col < this.columnCount; col++) {
        const colX = PADDING_X + pinDistanceX * col + xOffset;
        
        // Skip pins that would be outside the game area
        if (colX < PADDING_X || colX > this.canvas.width - PADDING_X) {
          continue;
        }
        
        const pin = Matter.Bodies.circle(colX, rowY, this.pinRadius, {
          isStatic: true,
          render: {
            fillStyle: '#ffffff',
          },
          collisionFilter: {
            category: PIN_CATEGORY,
            mask: TOKEN_CATEGORY, // Collide with tokens
          },
        });
        this.pins.push(pin);
      }
    }
    Matter.Composite.add(this.engine.world, this.pins);

    // Create side walls
    const leftWall = Matter.Bodies.rectangle(
      PADDING_X / 2,
      this.canvas.height / 2,
      10,
      this.canvas.height,
      {
        isStatic: true,
        render: { visible: false },
      },
    );
    const rightWall = Matter.Bodies.rectangle(
      this.canvas.width - PADDING_X / 2,
      this.canvas.height / 2,
      10,
      this.canvas.height,
      {
        isStatic: true,
        render: { visible: false },
      },
    );
    this.walls.push(leftWall, rightWall);
    Matter.Composite.add(this.engine.world, this.walls);

    // Update bin boundaries for prize calculation
    this.updateBinBoundaries();
  }

  /**
   * Update bin boundaries for calculating which bin a token lands in.
   */
  private updateBinBoundaries() {
    this.binBoundaries = [];
    const binWidth = this.gameWidth / this.columnCount;
    
    for (let i = 0; i <= this.columnCount; i++) {
      this.binBoundaries.push(PlinkoEngine.PADDING_X + binWidth * i);
    }
  }

  private removeAllTokens() {
    Matter.Composite.allBodies(this.engine.world).forEach((body) => {
      if (body.collisionFilter.category === PlinkoEngine.TOKEN_CATEGORY) {
        Matter.Composite.remove(this.engine.world, body);
      }
    });
  }
}

export default PlinkoEngine;
