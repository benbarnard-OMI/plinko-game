<script lang="ts">
  import { plinkoEngine } from '$lib/stores/game';
  import CircleNotch from 'phosphor-svelte/lib/CircleNotch';
  import type { Action } from 'svelte/action';
  import BinsRow from './BinsRow.svelte';
  import LastWins from './LastWins.svelte';
  import PlinkoEngine from './PlinkoEngine';
  import PrizeSidebar from '../Sidebar/PrizeSidebar.svelte';
  import { onDestroy, onMount } from 'svelte';

  const { WIDTH, HEIGHT } = PlinkoEngine;

  const initPlinko: Action<HTMLCanvasElement> = (node) => {
    const engine = new PlinkoEngine(node);
    engine.start();
    plinkoEngine.set(engine);

    return {
      destroy: () => {
        engine.stop();
        plinkoEngine.set(null);
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

  let canvasEl: HTMLCanvasElement;

  // --- Sensor polling logic ---
  let pollInterval: number;
  let lastTriggered = false;

  function pollSensor() {
    // Only poll if $plinkoEngine is initialized
    if (!$plinkoEngine) return;
    fetch('http://localhost:3002/sensor')
      .then((res) => res.json())
      .then((data) => {
        if (data.triggered && !lastTriggered) {
          $plinkoEngine.dropToken();
          lastTriggered = true;
        } else if (!data.triggered) {
          lastTriggered = false;
        }
      })
      .catch(() => {});
  }

  onMount(() => {
    pollInterval = setInterval(pollSensor, 100);
  });

  onDestroy(() => {
    clearInterval(pollInterval);
  });
</script>

<div class="bg-gray-900 flex flex-col items-center justify-center">
  <div class="relative w-full h-full" style="background: #bfa77a;">
    {#if $plinkoEngine === null}
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <CircleNotch class="size-20 animate-spin text-slate-600" weight="bold" />
      </div>
    {/if}
    <canvas
      bind:this={canvasEl}
      use:initPlinko
      width={WIDTH}
      height={HEIGHT}
      class="block mx-auto"
      on:click={handleCanvasClick}
    ></canvas>
  </div>
  <BinsRow />
</div>

<style>
.plinko-wood-bg {
  background-image: url('/src/lib/assets/wood-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* fallback color if image fails */
  background-color: #bfa77a;
}
</style>
