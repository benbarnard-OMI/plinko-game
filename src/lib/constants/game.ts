import { BoardStyle, type PrizeBin, type ColumnCount, columnCountOptions } from '$lib/types';
import { getBinColors } from '$lib/utils/colors';

/**
 * Default board configuration.
 */
export const DEFAULT_BOARD = {
  style: BoardStyle.TV,
  columns: 9 as ColumnCount,
  rows: 12,
} as const;

/**
 * For each column count, the background and shadow colors of each bin.
 */
export const binColorsByColumnCount = columnCountOptions.reduce(
  (acc: Record<ColumnCount, ReturnType<typeof getBinColors>>, columnCount: ColumnCount) => {
    acc[columnCount] = getBinColors(columnCount);
    return acc;
  },
  {} as Record<ColumnCount, ReturnType<typeof getBinColors>>,
);

/**
 * Default prize bins configuration.
 */
export const DEFAULT_PRIZE_BINS: PrizeBin[] = [
  { id: 'small-1', name: 'Sticker', tier: 'small' },
  { id: 'small-2', name: 'Candy', tier: 'small' },
  { id: 'medium-1', name: 'Toy Car', tier: 'medium' },
  { id: 'large-1', name: 'Stuffed Animal', tier: 'large' },
  { id: 'jackpot', name: 'JACKPOT!', tier: 'jackpot' },
  { id: 'large-2', name: 'Puzzle', tier: 'large' },
  { id: 'medium-2', name: 'Bouncy Ball', tier: 'medium' },
  { id: 'small-3', name: 'Eraser', tier: 'small' },
  { id: 'small-4', name: 'Pencil', tier: 'small' },
];

export const binColor = {
  background: {
    red: { r: 255, g: 0, b: 63 }, // rgb(255, 0, 63)
    yellow: { r: 255, g: 192, b: 0 }, // rgb(255, 192, 0)
  },
  shadow: {
    red: { r: 166, g: 0, b: 4 }, // rgb(166, 0, 4)
    yellow: { r: 171, g: 121, b: 0 }, // rgb(171, 121, 0)
  },
} as const;

/**
 * Local storage keys for persisted settings.
 */
export const LOCAL_STORAGE_KEY = {
  BALANCE: 'balance',
  SETTINGS: {
    ANIMATION: 'animation',
  },
} as const;
