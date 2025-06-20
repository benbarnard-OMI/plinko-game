/**
 * Range of column counts the game supports for TV-style uniform boards.
 */
export const columnCountOptions = [7, 9, 11] as const;

/**
 * Number of columns for the uniform width board.
 */
export type ColumnCount = (typeof columnCountOptions)[number];

/**
 * Board layout style for different Plinko variants.
 */
export enum BoardStyle {
  TV = 'TV', // Uniform width rectangular grid (TV show style)
}

/**
 * Configuration for a prize bin.
 */
export type PrizeBin = {
  /**
   * Unique identifier for the prize.
   */
  id: string;
  /**
   * Display name of the prize.
   */
  name: string;
  /**
   * Optional description of the prize.
   */
  description?: string;
  /**
   * Optional image URL for the prize.
   */
  imageUrl?: string;
  /**
   * Prize tier or category (e.g., 'small', 'medium', 'large', 'jackpot').
   */
  tier: string;
};

/**
 * A record when a token lands in a prize bin.
 */
export type PrizeRecord = {
  /**
   * UUID of the prize record.
   */
  id: string;
  /**
   * Timestamp when the token landed.
   */
  timestamp: number;
  /**
   * Zero-based index of which bin the token fell into (leftmost bin is 0).
   */
  binIndex: number;
  /**
   * The prize that was won.
   */
  prize: PrizeBin;
  /**
   * Number of columns the board had when this was recorded.
   */
  columnCount: ColumnCount;
};
