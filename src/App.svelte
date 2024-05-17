<!-- App.svelte -->
<script>
  import ForceDirectedGraph from './components/ForceDirectedGraph.svelte';
  import Analytics from './components/Analytics.svelte';
  import { isDarkMode } from './stores.js';

  // Subscribe to the store to get the current value
  let darkMode = false;
  $: darkMode = $isDarkMode;
</script>

<Analytics />

<div class={$isDarkMode ? 'dark-mode' : 'light-mode'}>
  <button on:click={() => isDarkMode.update(n => !n)} style="position: absolute; top: 10px; right: 10px;">
    {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
  </button>
  <main>
    <ForceDirectedGraph />
  </main>
</div>

<style>
  .light-mode {
    background-color: white;
    color: black;
  }

  .dark-mode {
    background-color: black;
    color: white;
  }

  main {
    text-align: center;
    padding: 0;
    width: 100%;
    margin: 0;
  }

  button {
    z-index: 2;
  }
</style>
