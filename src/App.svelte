<script>
  import ForceDirectedGraph from './components/Graph.svelte';
  import PowerView from './components/PowerView.svelte';
  import SearchBar from './components/SearchBar.svelte';
  import Analytics from './components/Analytics.svelte';
  import { isDarkMode, mode, searchQuery } from './stores.js';
  import { onMount } from 'svelte';

  let darkMode = false;
  $: darkMode = $isDarkMode;
  let currentMode = 'graph';
  $: currentMode = $mode;

  function toggleMode() {
    mode.update(m => (m === 'graph' ? 'power' : 'graph'));
  }

  onMount(() => {
    const unsubscribe = isDarkMode.subscribe(value => {
      darkMode = value;
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<Analytics />

<div class={$isDarkMode ? 'dark-mode' : 'light-mode'}>
  <button on:click={() => isDarkMode.update(n => !n)} class="dark-mode-toggle">
    {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
  </button>
  <button on:click={toggleMode} class="mode-toggle">
    {currentMode === 'graph' ? 'Switch to Power Mode' : 'Switch to Graph Mode'}
  </button>
  
  <!-- Insert the SearchBar component -->
  <SearchBar />

  <main>
    {#if currentMode === 'graph'}
      <ForceDirectedGraph />
    {:else}
      <PowerView />
    {/if}
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
    position: absolute;
    top: 10px;
    padding: 5px 10px;
  }

  .dark-mode-toggle {
    right: 200px; /* Adjusted for visibility */
  }

  .mode-toggle {
    right: 10px;
  }

  @media (max-width: 600px) {
    /* Adjustments for mobile screens */
    .dark-mode-toggle, .mode-toggle {
      right: 20px; /* Reduce spacing for smaller screens */
    }
  }
</style>
