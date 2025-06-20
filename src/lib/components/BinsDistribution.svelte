<!-- BinsDistribution component not needed for prize game -->
<!-- Component disabled for prize game refactor -->
<!--
  import Chart from 'chart.js/auto';
  import type { Action } from 'svelte/action';

  let binIndexes = $derived(Object.keys($binProbabilities));
  let binProbabilitiesInPercent = $derived(
    Object.values($binProbabilities).map((prob) => prob * 100),
  );
  let expectedProbabilitiesInPercent = $derived(
    binProbabilitiesByRowCount[$rowCount].map((prob) => prob * 100),
  );

  (rest of component commented out for prize game)
-->
