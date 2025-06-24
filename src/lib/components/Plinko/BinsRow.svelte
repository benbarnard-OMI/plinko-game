<script lang="ts">
  import { binColorsByColumnCount } from '$lib/constants/game';
  import { plinkoEngine, columnCount, prizeRecords, prizeBins } from '$lib/stores/game';
  import { isAnimationOn } from '$lib/stores/settings';
  import type { Action } from 'svelte/action';
  import { fireworkSmall, fireworkJackpot } from '$lib/utils/fireworks';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  /**
   * Bounce animations for each bin, which is played when a token falls into the bin.
   */
  let binAnimations: Animation[] = $state([]);

  // NOTE: Not using $effect because it'll play animation if we toggle on animation in settings
  prizeRecords.subscribe((value) => {
    if (value.length) {
      const lastPrizeBinIndex = value[value.length - 1].binIndex;
      playAnimation(lastPrizeBinIndex);
    }
  });

  const initAnimation: Action<HTMLDivElement> = (node) => {
    const bounceAnimation = node.animate(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(30%)' },
        { transform: 'translateY(0)' },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      },
    );
    bounceAnimation.pause(); // Don't run the animation immediately
    binAnimations.push(bounceAnimation);
  };

  function playAnimation(binIndex: number) {
    if (!$isAnimationOn) {
      return;
    }

    const animation = binAnimations[binIndex];

    // Always reset animation before playing. Safari has a weird behavior where
    // the animation will not play the second time if it's not cancelled.
    animation.cancel();

    animation.play();
  }

  // Allow clicking a bin to drop a token in that slot
  function handleBinClick(binIndex: number) {
    console.log('Clicked bin', binIndex, 'plinkoEngine:', $plinkoEngine);
    if ($plinkoEngine) {
      $plinkoEngine.dropToken(binIndex);
    }
  }

  // Store for showing jackpot overlay
  let showJackpot = $state(false);
  let jackpotTimeout: ReturnType<typeof setTimeout> | null = null;

  // Listen for new prize records and trigger effects
  prizeRecords.subscribe((value) => {
    if (value.length) {
      const lastPrize = value[value.length - 1];
      if (lastPrize.prize.tier === 'jackpot') {
        fireworkJackpot(document.body);
        showJackpot = true;
        if (jackpotTimeout) clearTimeout(jackpotTimeout);
        jackpotTimeout = setTimeout(() => (showJackpot = false), 3500);
      } else {
        fireworkSmall(document.body);
      }
    }
  });
</script>

<!-- Remove Pepe Sad GIF background from bins row area -->

<!-- Height clamping in mobile: From 10px at 370px viewport width to 16px at 600px viewport width -->
<div class="flex h-[clamp(10px,0.352px+2.609vw,16px)] w-full justify-center lg:h-7 relative z-10">
  {#if showJackpot}
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60">
      <div class="relative z-10 flex flex-col items-center justify-center">
        <div class="text-6xl font-extrabold text-yellow-400 drop-shadow-lg animate-bounce mb-8">JACKPOT!</div>
        <div class="flex gap-4">
          <span class="text-5xl">🎈</span>
          <span class="text-5xl">🎈</span>
          <span class="text-5xl">🎈</span>
          <span class="text-5xl">🎈</span>
        </div>
      </div>
    </div>
  {/if}
  {#if $plinkoEngine}
    <div class="flex gap-[1%]" style:width={`${($plinkoEngine.binsWidthPercentage ?? 0) * 100}%`}>
      {#each $prizeBins.slice(0, $columnCount) as prize, binIndex}
        <!-- Font-size clamping:
              - Mobile (< 1024px): From 6px at 370px viewport width to 8px at 600px viewport width
              - Desktop (>= 1024px): From 10px at 1024px viewport width to 12px at 1100px viewport width
         -->
        <div
          use:initAnimation
          class="flex min-w-0 flex-1 items-center justify-center rounded-xs text-[clamp(6px,2.784px+0.87vw,8px)] font-bold text-gray-950 shadow-[0_2px_var(--shadow-color)] lg:rounded-md lg:text-[clamp(10px,-16.944px+2.632vw,12px)] lg:shadow-[0_3px_var(--shadow-color)]"
          style:background-color={binColorsByColumnCount[$columnCount].background[binIndex]}
          style:--shadow-color={binColorsByColumnCount[$columnCount].shadow[binIndex]}
          title={prize.name}
          on:click={() => handleBinClick(binIndex)}
          style="cursor: pointer;"
        >
          {prize.name.length > 8 ? prize.name.slice(0, 8) + '...' : prize.name}
        </div>
      {/each}
    </div>
  {/if}
</div>
