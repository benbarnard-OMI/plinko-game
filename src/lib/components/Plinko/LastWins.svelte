<script lang="ts">
  import { binColorsByColumnCount } from '$lib/constants/game';
  import { prizeRecords, columnCount } from '$lib/stores/game';
  import { fireworkSmall, fireworkJackpot } from '$lib/utils/fireworks';
  import { onMount } from 'svelte';

  type Props = {
    /**
     * Number of last prize records to display.
     */
    recordCount?: number;
  };

  let { recordCount = 4 }: Props = $props();

  let lastRecords = $derived($prizeRecords.slice(-recordCount).toReversed());

  let container: HTMLDivElement;
  let lastPrizeId: string | null = null;

  $effect(() => {
    if (lastRecords.length > 0) {
      const record = lastRecords[0];
      if (record && record.id !== lastPrizeId) {
        lastPrizeId = record.id;
        if (record.prize.tier === 'jackpot') {
          fireworkJackpot(document.body);
        } else {
          fireworkSmall(document.body);
        }
      }
    }
  });
</script>

<!-- Display for single last win below the board -->
<div bind:this={container} class="flex flex-col items-center space-y-3 bg-gray-800 rounded-lg p-4 border border-gray-600">
  {#if lastRecords.length > 0}
    {@const record = lastRecords[0]}
    <div class="text-lg text-white font-semibold">Last Prize Won:</div>
    <div
      class="flex items-center justify-center px-6 py-3 rounded-lg font-bold text-gray-950 min-w-[150px] text-lg shadow-lg border-2 border-white"
      style:background-color={binColorsByColumnCount[$columnCount].background[record.binIndex]}
      title={`Won: ${record.prize.name} from Bin ${record.binIndex + 1}`}
    >
      {record.prize.name}
    </div>
  {:else}
    <div class="text-lg text-gray-400 font-medium">No prizes won yet</div>
  {/if}
</div>
