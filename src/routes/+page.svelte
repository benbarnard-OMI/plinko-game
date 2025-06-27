<script lang="ts">
  import logo from '$lib/assets/logo.svg';
  // import LiveStatsWindow from '$lib/components/LiveStatsWindow/LiveStatsWindow.svelte';
  import Plinko from '$lib/components/Plinko';
  import LastWins from '$lib/components/Plinko/LastWins.svelte';
  // import SettingsWindow from '$lib/components/SettingsWindow';
  import PrizeSidebar from '$lib/components/Sidebar/PrizeSidebar.svelte';
  import { prizeRecords } from '$lib/stores/game';

  // Dynamically inject the Tenor embed script for the rainbow GIF background
  if (typeof window !== 'undefined') {
    const scriptId = 'tenor-embed-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://tenor.com/embed.js';
      document.body.appendChild(script);
    }
  }
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
    <div class="mx-auto w-full max-w-[1920px] min-w-[320px]">
      <div class="flex items-stretch justify-center min-h-[600px] gap-6">
        
        <!-- Left Branding Rectangle -->
        <div class="block w-80 bg-gray-700 rounded-lg border-2 border-gray-600 mr-6 flex-shrink-0 overflow-hidden">
          <div class="h-full w-full flex items-center justify-center">
            <!-- Branding/Left Content Area for sponsors/Peepo Sad GIF -->
            <iframe
              src="https://tenor.com/embed/17156460915069022561"
              allowtransparency="true"
              frameborder="0"
              scrolling="no"
              width="100%"
              height="100%"
              style="background: none; border: none; min-width:100%; min-height:100%; display:block;"
              title="Peepo Sad Sticker GIF"
            ></iframe>
          </div>
        </div>

        <!-- Main Game Presentation Area (4:3 aspect ratio) -->
        <div class="flex-shrink-0">
          <div class="bg-gray-800 rounded-lg border-2 border-gray-600 overflow-hidden" style="aspect-ratio: 4/3; width: 800px;">
            <div class="h-full w-full">
              <Plinko />
            </div>
          </div>
        </div>

        <!-- Right Branding Rectangle -->
        <div class="block w-80 bg-gray-700 rounded-lg border-2 border-gray-600 flex-shrink-0 overflow-hidden">
          <div class="h-full w-full flex items-center justify-center">
            <!-- Branding/Right Content Area for sponsors/Shut Your Mouth GIF -->
            <iframe
              src="https://tenor.com/embed/21496313"
              allowtransparency="true"
              frameborder="0"
              scrolling="no"
              width="100%"
              height="100%"
              style="background: none; border: none; min-width:100%; min-height:100%; display:block; aspect-ratio: 1/1;"
              title="Shut Your Mouth GIF"
            ></iframe>
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
    /* Remove the static background color */
    /* @apply bg-gray-800; */
    background: none !important;
  }
  
  :global(.rainbow-bg) {
    position: fixed;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    overflow: hidden;
  }
</style>

<!-- Pride Rainbow GIF background -->
<div class="rainbow-bg">
  <div class="tenor-gif-embed" data-postid="26074068" data-share-method="host" data-aspect-ratio="1.34454" data-width="100%"><a href="https://tenor.com/view/pride-rainbow-gif-26074068">Pride Rainbow GIF</a>from <a href="https://tenor.com/search/pride-gifs">Pride GIFs</a></div>
</div>
