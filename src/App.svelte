<script>
  import ForceDirectedGraph from './components/ForceDirectedGraph.svelte';
  import { flavors } from './stores';
  
  let searchInput = '';

  function handleSearch() {
    flavors.set([searchInput]);
    console.log(`Set flavor in store: ${searchInput}`);
  }
</script>

<div>
  <input type="text" bind:value={searchInput} placeholder="Search for a flavor..." />
  <button on:click={handleSearch}>Search</button>
</div>

<ForceDirectedGraph />
