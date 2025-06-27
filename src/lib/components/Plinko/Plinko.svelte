<script lang="ts">
  import { plinkoEngine } from '$lib/stores/game';
  import CircleNotch from 'phosphor-svelte/lib/CircleNotch';
  import type { Action } from 'svelte/action';
  import BinsRow from './BinsRow.svelte';
  import LastWins from './LastWins.svelte';
  import PlinkoEngine from './PlinkoEngine';
  import PrizeSidebar from '../Sidebar/PrizeSidebar.svelte';

  const { WIDTH, HEIGHT } = PlinkoEngine;

  const initPlinko: Action<HTMLCanvasElement> = (node) => {
    $plinkoEngine = new PlinkoEngine(node);
    $plinkoEngine.start();

    return {
      destroy: () => {
        $plinkoEngine?.stop();
      },
    };
  };

  function handleCanvasClick(event: MouseEvent) {
    if (!$plinkoEngine) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    // Map x to slot index
    const slotWidth = WIDTH / $plinkoEngine.columnCount;
    const slotIndex = Math.floor(x / slotWidth);
    $plinkoEngine.dropToken(slotIndex);
  }
</script>

<div class="bg-gray-900 flex flex-col items-center justify-center">
  <div class="relative w-full h-full">
    {#if $plinkoEngine === null}
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <CircleNotch class="size-20 animate-spin text-slate-600" weight="bold" />
      </div>
    {/if}
    <canvas use:initPlinko width={WIDTH} height={HEIGHT} class="block mx-auto" on:click={handleCanvasClick}></canvas>
  </div>
  <BinsRow />
</div>
