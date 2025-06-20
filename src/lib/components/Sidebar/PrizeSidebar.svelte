<script lang="ts">
  import { columnCountOptions } from '$lib/types';
  import {
    columnCount,
    plinkoEngine,
    prizeRecords,
    prizeBins,
  } from '$lib/stores/game';
  import { isGameSettingsOpen, isLiveStatsOpen } from '$lib/stores/layout';
  import ChartLine from 'phosphor-svelte/lib/ChartLine';
  import GearSix from 'phosphor-svelte/lib/GearSix';

  let isDropTokenDisabled = $derived($plinkoEngine === null);

  // New: Track selected drop slot
  let selectedSlot: number = 0;

  // Fix: Use $derived for maxSlot in runes mode
  let maxSlot = $derived($columnCount);

  function handleDropToken() {
    if ($plinkoEngine && !isDropTokenDisabled) {
      $plinkoEngine.dropToken(selectedSlot);
    }
  }
</script>

<div class="flex w-full flex-col gap-4 bg-gray-600 p-5 lg:w-80">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-white">Game Controls</h2>
    <div class="flex gap-2">
      <button
        onclick={() => isLiveStatsOpen.update((val) => !val)}
        class="rounded p-2 text-white transition hover:bg-gray-500"
        aria-label="Toggle Live Stats"
      >
        <ChartLine class="size-5" weight="bold" />
      </button>
      <button
        onclick={() => isGameSettingsOpen.update((val) => !val)}
        class="rounded p-2 text-white transition hover:bg-gray-500"
        aria-label="Game Settings"
      >
        <GearSix class="size-5" weight="bold" />
      </button>
    </div>
  </div>

  <!-- Column Count Selection -->
  <div class="space-y-2">
    <label for="column-select" class="text-sm font-medium text-gray-300">Board Size</label>
    <select
      id="column-select"
      bind:value={$columnCount}
      class="w-full rounded bg-gray-700 px-3 py-2 text-white"
    >
      {#each columnCountOptions as option}
        <option value={option}>{option} Columns</option>
      {/each}
    </select>
  </div>

  <!-- New: Drop Slot Selection -->
  <div class="space-y-2">
    <label for="slot-select" class="text-sm font-medium text-gray-300">Drop Slot</label>
    <select
      id="slot-select"
      bind:value={selectedSlot}
      class="w-full rounded bg-gray-700 px-3 py-2 text-white"
    >
      {#each Array(maxSlot).fill(0).map((_, i) => i) as slot}
        <option value={slot}>Slot {slot + 1}</option>
      {/each}
    </select>
  </div>

  <!-- Drop Token Button -->
  <button
    onclick={handleDropToken}
    disabled={isDropTokenDisabled}
    class="w-full rounded-lg bg-blue-600 py-3 px-4 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
  >
    Drop Token
  </button>

  <!-- Prize Records Summary -->
  <div class="space-y-2">
    <h3 class="text-sm font-medium text-gray-300">Recent Activity</h3>
    <div class="rounded bg-gray-700 p-3">
      <div class="text-sm text-gray-400">
        Tokens Dropped: {$prizeRecords.length}
      </div>
      {#if $prizeRecords.length > 0}
        <div class="mt-2 text-sm text-gray-400">
          Last Prize: {$prizeRecords[$prizeRecords.length - 1].prize.name}
        </div>
      {/if}
    </div>
  </div>

  <!-- Current Prizes Display -->
  <div class="space-y-2">
    <h3 class="text-sm font-medium text-gray-300">Current Prizes</h3>
    <div class="grid gap-1 text-xs">
      {#each $prizeBins.slice(0, $columnCount) as prize, index}
        <div class="flex justify-between rounded bg-gray-700 p-2">
          <span class="text-gray-300">Bin {index + 1}:</span>
          <span class="text-white">{prize.name}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
