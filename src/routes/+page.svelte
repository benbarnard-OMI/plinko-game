<script lang="ts">
  import logo from '$lib/assets/logo.svg';
  // import LiveStatsWindow from '$lib/components/LiveStatsWindow/LiveStatsWindow.svelte';
  import Plinko from '$lib/components/Plinko';
  import LastWins from '$lib/components/Plinko/LastWins.svelte';
  // import SettingsWindow from '$lib/components/SettingsWindow';
  import PrizeSidebar from '$lib/components/Sidebar/PrizeSidebar.svelte';
  import { prizeRecords } from '$lib/stores/game';
</script>

<div class="relative flex min-h-dvh w-full flex-col">
  <nav class="sticky top-0 z-10 w-full bg-gray-700 px-5 drop-shadow-lg">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between">
      <img src={logo} alt="logo" class="h-6 sm:h-7" />
      <div class="mx-auto">
        <h1 class="text-lg font-semibold text-white">Prize Plinko</h1>
      </div>
    </div>
  </nav>

  <div class="flex-1 px-5">
    <!-- Game Controls - Outside the presentation area -->
    <div class="mx-auto max-w-[1600px] mb-6">
      <div class="max-w-md mx-auto">
        <PrizeSidebar />
      </div>
    </div>

    <!-- Wide-screen TV presentation layout with side branding rectangles -->
    <div class="mx-auto max-w-[1600px] min-w-[300px]">
      <div class="flex items-stretch justify-center min-h-[600px] gap-6">
        
        <!-- Left Branding Rectangle -->
        <div class="hidden lg:block w-80 bg-gray-700 rounded-lg border-2 border-gray-600 mr-6 flex-shrink-0">
          <div class="h-full flex items-center justify-center">
            <!-- Branding/Left Content Area for sponsors/Peepo Sad GIF -->
            <iframe
              src="https://tenor.com/embed/17156460915069022561"
              allowtransparency="true"
              frameborder="0"
              scrolling="no"
              width="120"
              height="120"
              style="background: none; border: none;"
              title="Peepo Sad Sticker GIF"
            ></iframe>
          </div>
        </div>

        <!-- Main Game Presentation Area (4:3 aspect ratio) -->
        <div class="flex-shrink-0">
          <div class="bg-gray-800 rounded-lg border-2 border-gray-600 overflow-hidden" style="aspect-ratio: 4/3; width: 800px;">
            <!-- Pure Plinko board - no controls -->
            <div class="h-full w-full">
              <Plinko />
            </div>
          </div>
        </div>

        <!-- Right Branding Rectangle -->
        <div class="hidden lg:block w-80 bg-gray-700 rounded-lg border-2 border-gray-600">
          <div class="h-full flex items-center justify-center">
            <div class="text-center text-gray-400">
              <div class="text-xl font-bold mb-2">BRANDING</div>
              <div class="text-sm">Right Content Area</div>
              <div class="text-xs mt-2 opacity-60">Future sponsor content</div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- Last Prize Won - Outside the presentation area -->
      <div class="mt-6 flex justify-center">
        <LastWins recordCount={1} />
      </div>
      
      <!-- Debug: Show prize records count -->
      <div class="mt-2 text-center text-white text-sm">
        Debug: Prize records count: {$prizeRecords.length}
      </div>
    </div>
  </div>

  <!-- Temporarily commented out until refactored -->
  <!-- <SettingsWindow />
  <LiveStatsWindow /> -->
</div>

<style lang="postcss">
  @reference "../app.css";

  :global(body) {
    @apply bg-gray-800;
  }
</style>
