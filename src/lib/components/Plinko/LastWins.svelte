<script lang="ts">
  import { binColorsByColumnCount } from '$lib/constants/game';
  import { prizeRecords, columnCount } from '$lib/stores/game';

  type Props = {
    /**
     * Number of last prize records to display.
     */
    recordCount?: number;
  };

  let { recordCount = 4 }: Props = $props();

  let lastRecords = $derived($prizeRecords.slice(-recordCount).toReversed());
</script>

<!-- Clamps in mobile:
      - Width: From 1.5rem at 340px viewport width to 2rem at 620px viewport width
      - Font size: From 8px at 340px viewport width to 10px at 620px viewport width
 -->
<div
  class="flex w-[clamp(1.5rem,0.893rem+2.857vw,2rem)] flex-col overflow-hidden rounded-xs text-[clamp(8px,5.568px+0.714vw,10px)] md:rounded-md lg:w-12 lg:text-sm"
  style:aspect-ratio={`1 / ${recordCount}`}
>
  {#each lastRecords as record}
    <div
      class="flex aspect-square items-center justify-center font-bold text-gray-950"
      style:background-color={binColorsByColumnCount[$columnCount].background[record.binIndex]}
      title={`Won: ${record.prize.name}`}
    >
      {record.prize.name.slice(0, 2)}
    </div>
  {/each}
</div>
