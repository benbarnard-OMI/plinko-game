import PlinkoEngine from '$lib/components/Plinko/PlinkoEngine';
import { binColorsByColumnCount, DEFAULT_PRIZE_BINS } from '$lib/constants/game';
import {
  type ColumnCount,
  type PrizeBin,
  type PrizeRecord,
} from '$lib/types';
import { derived, writable } from 'svelte/store';

export const plinkoEngine = writable<PlinkoEngine | null>(null);

/**
 * Number of columns in the board (which determines number of prize bins).
 * In TV show Plinko, this creates a uniform-width rectangular grid.
 */
export const columnCount = writable<ColumnCount>(7);

/**
 * Configuration for prize bins - what prize each bin contains.
 */
export const prizeBins = writable<PrizeBin[]>(DEFAULT_PRIZE_BINS);

/**
 * Records of tokens dropped and prizes won.
 */
export const prizeRecords = writable<PrizeRecord[]>([]);

/**
 * RGB colors for every bin. The length of the array is the number of bins.
 */
export const binColors = derived<typeof columnCount, { background: string[]; shadow: string[] }>(
  columnCount,
  ($columnCount: ColumnCount) => {
    return binColorsByColumnCount[$columnCount];
  },
);

/**
 * Statistics about which bins tokens have fallen into.
 */
export const binStatistics = derived<
  [typeof prizeRecords, typeof columnCount],
  { [binIndex: number]: number }
>([prizeRecords, columnCount], ([$prizeRecords, $columnCount]: [PrizeRecord[], ColumnCount]) => {
  const occurrences: Record<number, number> = {};
  
  // Initialize all bins to 0
  for (let i = 0; i < $columnCount; ++i) {
    occurrences[i] = 0;
  }
  
  // Count occurrences
  $prizeRecords.forEach(({ binIndex }: PrizeRecord) => {
    if (binIndex >= 0 && binIndex < $columnCount) {
      occurrences[binIndex]++;
    }
  });
  
  return occurrences;
});
