<script>
  import { searchQuery, autoCompleteResults, fetchAutoCompleteResults } from '../stores.js';
  import { onMount } from 'svelte';

  let flavor = '';
  let selectedIndex = -1;
  let searchInput;

  // Fetch autocomplete results when flavor changes
  $: if (flavor) {
    fetchAutoCompleteResults(flavor);
  }

  function selectAutoCompleteResult(result) {
    searchQuery.set(result);  // Update the searchQuery store
    autoCompleteResults.set([]);
  }

  function handleKeyUp(event) {
    if (event.key === 'Enter') {
      if (selectedIndex !== -1) {
        selectAutoCompleteResult($autoCompleteResults[selectedIndex]);
      } else {
        searchQuery.set(flavor);  // Set the search query directly when Enter is pressed
      }
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && selectedIndex < $autoCompleteResults.length - 1) {
      event.preventDefault();
      selectedIndex++;
    } else if (event.key === 'ArrowUp' && selectedIndex > 0) {
      event.preventDefault();
      selectedIndex--;
    }
  }
</script>


<div id="search-container">
  <input
    type="text"
    bind:value={flavor}
    placeholder="Enter flavor"
    on:keyup={handleKeyUp}
    on:keydown={handleKeyDown}
    bind:this={searchInput}
  />
  <button on:click={() => searchQuery.set('')}>Clear</button>
  {#if $autoCompleteResults.length}
    <ul>
      {#each $autoCompleteResults as result, index}
        <li class:selected={index === selectedIndex}>
          <button
            class="autocomplete-button"
            on:click={() => selectAutoCompleteResult(result)}
            on:keyup={(event) =>
              event.key === 'Enter' ? selectAutoCompleteResult(result) : null}
          >
            {result}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  /* Basic styling for search bar and autocomplete */
  #search-container {
    position: relative;
    margin-bottom: 20px;
  }

  input {
    width: 100%;
    padding: 10px;
    font-size: 1em;
  }

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    background: white;
    border: 1px solid #ddd;
    max-height: 200px;
    overflow-y: auto;
    position: absolute;
    width: 100%;
    z-index: 1000;
  }

  li {
    padding: 8px 12px;
    cursor: pointer;
  }

  li.selected {
    background-color: #ddd;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
    text-align: left;
  }

  .autocomplete-button {
    background: none;
    border: none;
    padding: 8px 12px;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }
</style>
