<script>
  import { createEventDispatcher } from 'svelte';
  export let value = '';  // Accept value as a prop
  const dispatch = createEventDispatcher();

  function handleSearch() {
    console.log(`Search query: ${value}`); // Debugging line
    dispatch('search', value);
    value = '';
  }

  function handleClear() {
    dispatch('clear');
  }

  function handleKeyUp(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }
</script>

<input type="text" bind:value={value} placeholder="Search ingredients..." on:keyup={handleKeyUp} />
<button on:click={handleSearch}>Search</button>
<button on:click={handleClear}>Clear</button>

<style>
  input {
    margin-right: 5px;
  }

  button {
    margin-right: 5px;
  }
</style>
