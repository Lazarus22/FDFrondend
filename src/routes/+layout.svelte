<script lang="ts">
  import '../app.postcss'; // Ensure this path is correct for your project
  import { LightSwitch, TabGroup, Tab } from '@skeletonlabs/skeleton';
  import Graph from '../components/Graph.svelte';
  import PowerView from '../components/PowerView.svelte';
  import SearchBar from '../components/SearchBar.svelte';
  import Analytics from '../components/Analytics.svelte'; // Import the Analytics component

  let tabSet: number = 0;  // Tracks the currently active tab
</script>

<!-- LightSwitch in a fixed position -->
<div class="fixed top-5 right-5 z-50">
  <LightSwitch />
</div>

<!-- Include the Analytics component -->
<Analytics />

<div class="container mx-auto mt-5 h-screen overflow-y-auto">
  <SearchBar />

  <TabGroup>
    <!-- Tabs -->
    <Tab bind:group={tabSet} name="graph" value={0}>Graph</Tab>
    <Tab bind:group={tabSet} name="list" value={1}>List</Tab>
    
    <!-- Tab Panels -->
    <svelte:fragment slot="panel">
      {#if tabSet === 0}
        <Graph />
      {:else if tabSet === 1}
        <PowerView />
      {/if}
    </svelte:fragment>
  </TabGroup>

  <slot />
</div>
