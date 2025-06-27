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

const coinDropAudio = typeof window !== 'undefined' ? new Audio('/src/lib/assets/coindrop1-92749.mp3') : null;

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
   * Drop slot markers to show where tokens will be dropped.
   */
  private dropSlotMarkers: Matter.Body[] = [];
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
        background: '#0f1728', // Restore original grey color
        wireframes: false,
      },
    });
    // Remove any background image styling
    if (this.canvas) {
      this.canvas.style.backgroundImage = '';
      this.canvas.style.backgroundSize = '';
      this.canvas.style.backgroundPosition = '';
      this.canvas.style.backgroundRepeat = '';
    }
    this.runner = Matter.Runner.create();

    this.createUniformBoard();

    this.sensor = Matter.Bodies.rectangle(
      this.canvas.width / 2,
      this.canvas.height - 50, // Move sensor down more
      this.canvas.width - 40, // Make it narrower to be within the walls
      30, // Make it thicker for better detection
      {
        isSensor: true,
        isStatic: true,
        render: {
          visible: true, // Make it visible for debugging
          fillStyle: 'rgba(255, 0, 0, 0.5)', // More visible red
        },
      },
    );
    Matter.Composite.add(this.engine.world, [this.sensor]);
    Matter.Events.on(this.engine, 'collisionStart', ({ pairs }) => {
      console.log('Collision detected, pairs:', pairs.length);
      pairs.forEach(({ bodyA, bodyB }) => {
        console.log('Collision between:', bodyA.id, 'and', bodyB.id);
        if (bodyA === this.sensor) {
          console.log('Sensor collision with bodyB:', bodyB.id);
          this.handleTokenEnterBin(bodyB);
        } else if (bodyB === this.sensor) {
          console.log('Sensor collision with bodyA:', bodyA.id);
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
    
    // Start checking for tokens that have fallen to the bottom
    this.startTokenCleanup();
  }

  /**
   * Start periodic check for tokens that have fallen to the bottom
   */
  private startTokenCleanup() {
    setInterval(() => {
      const tokensToRemove = this.engine.world.bodies.filter(body => {
        // Check if it's a token (has the TOKEN_CATEGORY)
        const isToken = body.collisionFilter.category === PlinkoEngine.TOKEN_CATEGORY;
        // Check if it's below the sensor position
        const isBelowSensor = body.position.y > this.canvas.height - 80;
        return isToken && isBelowSensor;
      });
      
      tokensToRemove.forEach(token => {
        console.log('Token cleanup - removing token at y:', token.position.y);
        this.handleTokenEnterBin(token);
      });
    }, 100); // Check every 100ms
  }

  /**
   * Stops (pauses) the rendering and physics engine.
   */
  stop() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
  }

  private isTokenActive = false;

  /**
   * Drops a new token from one of the top drop slots.
   * @param slotIndex Optional index of the slot to drop the token from. If not provided, a random slot is used.
   */
  dropToken(slotIndex?: number) {
    if (this.isTokenActive) return;
    this.isTokenActive = true;
    const slotWidth = this.gameWidth / this.columnCount;
    const chosenSlot =
      typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < this.columnCount
        ? slotIndex
        : Math.floor(Math.random() * this.columnCount);
    const dropX = PlinkoEngine.PADDING_X + slotWidth * chosenSlot + slotWidth / 2;
    const tokenRadius = this.pinRadius * 2;
    const restitution = getRandomBetween(0.4, 1.25);
    const friction = getRandomBetween(0.1, 0.85);
    const frictionAir = getRandomBetween(0.01, 0.09);

    const token = Matter.Bodies.circle(
      dropX + getRandomBetween(-slotWidth * 0.45, slotWidth * 0.45),
      0,
      tokenRadius,
      {
        restitution,
        friction,
        frictionAir,
        collisionFilter: {
          category: PlinkoEngine.TOKEN_CATEGORY,
          mask: PlinkoEngine.PIN_CATEGORY | 0x0001,
        },
        render: {
          fillStyle: '#ff0000',
        },
      },
    );
    Matter.Composite.add(this.engine.world, token);

    // --- Bias away from bin 5 at drop ---
    // Only if there are at least 6 bins (index 5 exists)
    if (this.columnCount > 5) {
      const bin5Center = PlinkoEngine.PADDING_X + slotWidth * 5 + slotWidth / 2;
      const distFromBin5 = token.position.x - bin5Center;
      // If close to bin 5, nudge left or right, but only 1/100 times
      if (Math.abs(distFromBin5) < slotWidth * 1.2 && Math.random() < 0.01) {
        const nudge = distFromBin5 > 0 ? getRandomBetween(0.04, 0.12) : getRandomBetween(-0.12, -0.04);
        Matter.Body.applyForce(token, token.position, { x: nudge, y: 0 });
      }
    }
    // Add a much larger random force at drop
    Matter.Body.applyForce(token, token.position, {
      x: getRandomBetween(-0.09, 0.09),
      y: getRandomBetween(0, 0.06),
    });
    Matter.Body.setAngularVelocity(token, getRandomBetween(-0.7, 0.7));

    // Listen for pin collisions to add more chaos and bias away from bin 5
    const pinCollisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        if ((bodyA === token && this.pins.includes(bodyB)) || (bodyB === token && this.pins.includes(bodyA))) {
          // --- Bias away from bin 5 during descent ---
          if (this.columnCount > 5) {
            const bin5Center = PlinkoEngine.PADDING_X + slotWidth * 5 + slotWidth / 2;
            const distFromBin5 = token.position.x - bin5Center;
            // Only 1/100 times
            if (Math.abs(distFromBin5) < slotWidth * 1.2 && Math.random() < 0.01) {
              const nudge = distFromBin5 > 0 ? getRandomBetween(0.04, 0.12) : getRandomBetween(-0.12, -0.04);
              Matter.Body.applyForce(token, token.position, { x: nudge, y: 0 });
            }
          }
          // Apply a much larger and more random force on every pin collision
          Matter.Body.applyForce(token, token.position, {
            x: getRandomBetween(-0.18, 0.18),
            y: getRandomBetween(-0.04, 0.09),
          });
          Matter.Body.setAngularVelocity(token, token.angularVelocity + getRandomBetween(-0.7, 0.7));
          // Occasionally (10% chance), apply a very strong force or spin for extra chaos
          if (Math.random() < 0.1) {
            Matter.Body.applyForce(token, token.position, {
              x: getRandomBetween(-0.35, 0.35),
              y: getRandomBetween(-0.12, 0.18),
            });
            Matter.Body.setAngularVelocity(token, token.angularVelocity + getRandomBetween(-1.5, 1.5));
          }
        }
      }
    };
    Matter.Events.on(this.engine, 'collisionStart', pinCollisionHandler);

    // Remove the event listener when the token is removed (to avoid memory leaks)
    const cleanup = () => {
      Matter.Events.off(this.engine, 'collisionStart', pinCollisionHandler);
    };
    // Patch handleTokenEnterBin to call cleanup if this token is removed
    const origHandleTokenEnterBin = this.handleTokenEnterBin.bind(this);
    this.handleTokenEnterBin = (body: Matter.Body) => {
      if (body === token) cleanup();
      origHandleTokenEnterBin(body);
    };

    if (coinDropAudio) {
      coinDropAudio.currentTime = 0;
      coinDropAudio.play();
    }
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
    console.log('Token hit sensor!', token.position);
    const tokenX = token.position.x;
    const binIndex = this.calculateBinIndex(tokenX);
    
    console.log('Calculated bin index:', binIndex, 'for token at x:', tokenX);
    
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

      console.log('Adding prize record:', record);
      prizeRecords.update((records) => [...records, record]);
    }

    Matter.Composite.remove(this.engine.world, token);
    this.isTokenActive = false;
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
   * Creates a proper staggered Plinko pin layout (TV show style).
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
    if (this.dropSlotMarkers.length > 0) {
      Matter.Composite.remove(this.engine.world, this.dropSlotMarkers);
      this.dropSlotMarkers = [];
    }

    // Create drop slot markers at the top
    const slotWidth = this.gameWidth / this.columnCount;
    for (let slot = 0; slot < this.columnCount; slot++) {
      const slotX = PADDING_X + slotWidth * slot + slotWidth / 2;
      const marker = Matter.Bodies.rectangle(
        slotX,
        PADDING_TOP / 2, // Position at top of game area
        slotWidth * 0.8, // Slightly smaller than slot width
        8, // Thin rectangular marker
        {
          isStatic: true,
          isSensor: true, // Don't collide with anything
          label: `drop-slot-${slot}`,
          render: {
            fillStyle: '#00ff00', // Bright green for visibility
            strokeStyle: '#ffffff',
            lineWidth: 2,
          },
          plugin: {
            clickable: true, // Custom property for UI mapping
            slotIndex: slot,
          },
        }
      );
      this.dropSlotMarkers.push(marker);
    }
    Matter.Composite.add(this.engine.world, this.dropSlotMarkers);

    const rowCount = 12; // Fixed number of rows for TV-style board
    const pinDistanceY = this.pinDistanceY;
    
    // Use consistent horizontal spacing between pins
    const pinDistanceX = this.pinDistanceX;

    // Create proper staggered pin layout (like classic TV Plinko)
    for (let row = 0; row < rowCount; row++) {
      const rowY = PADDING_TOP + pinDistanceY * row;
      
      // Alternate between two patterns:
      // Even rows: pins aligned with columns
      // Odd rows: pins offset by half distance (staggered)
      const isEvenRow = row % 2 === 0;
      
      if (isEvenRow) {
        // Even rows: place pins at regular column positions
        for (let col = 0; col < this.columnCount; col++) {
          const colX = PADDING_X + pinDistanceX * col;
          
          // Skip pins too close to edges
          if (colX < PADDING_X + this.pinRadius || colX > this.canvas.width - PADDING_X - this.pinRadius) {
            continue;
          }
          
          const pinBody = Matter.Bodies.circle(colX, rowY, this.pinRadius, {
            isStatic: true,
            render: {
              fillStyle: '#ffffff',
            },
            collisionFilter: {
              category: PIN_CATEGORY,
              mask: TOKEN_CATEGORY,
            },
          });
          this.pins.push(pinBody);
        }
      } else {
        // Odd rows: offset by half distance to create staggered pattern
        for (let col = 0; col < this.columnCount - 1; col++) {
          const colX = PADDING_X + pinDistanceX * col + pinDistanceX / 2;
          
          // Skip pins too close to edges
          if (colX < PADDING_X + this.pinRadius || colX > this.canvas.width - PADDING_X - this.pinRadius) {
            continue;
          }
          
          const pinBody = Matter.Bodies.circle(colX, rowY, this.pinRadius, {
            isStatic: true,
            render: {
              fillStyle: '#ffffff',
            },
            collisionFilter: {
              category: PIN_CATEGORY,
              mask: TOKEN_CATEGORY,
            },
          });
          this.pins.push(pinBody);
        }
      }
    }
    Matter.Composite.add(this.engine.world, this.pins);

    // Create side walls that tokens will bounce off (closer to play area)
    const wallThickness = 20;
    const wallOffset = 10; // Distance from play area edge
    const leftWall = Matter.Bodies.rectangle(
      PADDING_X + wallOffset + wallThickness / 2,
      this.canvas.height / 2,
      wallThickness,
      this.canvas.height,
      {
        isStatic: true,
        render: { visible: true, fillStyle: '#555555' }, // Make walls visible
        restitution: 0.8, // Make walls bouncy
        friction: 0.1,
        collisionFilter: {
          category: PIN_CATEGORY, // Same category as pins
          mask: TOKEN_CATEGORY, // Collide with tokens
        },
      },
    );
    const rightWall = Matter.Bodies.rectangle(
      this.canvas.width - PADDING_X - wallOffset - wallThickness / 2,
      this.canvas.height / 2,
      wallThickness,
      this.canvas.height,
      {
        isStatic: true,
        render: { visible: true, fillStyle: '#555555' }, // Make walls visible
        restitution: 0.8, // Make walls bouncy
        friction: 0.1,
        collisionFilter: {
          category: PIN_CATEGORY, // Same category as pins
          mask: TOKEN_CATEGORY, // Collide with tokens
        },
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
