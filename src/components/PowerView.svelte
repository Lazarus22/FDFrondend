<script>
  import SearchInput from './SearchInput.svelte';
  import { writable } from 'svelte/store';
  import debounce from 'lodash.debounce';

  let searchResults = [];
  let isLoading = false;
  let hasResults = true;

  const searchQuery = writable('');

  async function fetchRecommendations(flavor) {
    try {
      console.log(`Fetching recommendations for: ${flavor}`);
      const response = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`);
      const data = await response.json();
      console.log(`API Response:`, data);
      searchResults = data.recommendations;
      hasResults = searchResults.length > 0;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const debouncedFetch = debounce(async (flavor) => {
    if (flavor.length < 2) {
      searchResults = [];
      isLoading = false;
      hasResults = true;
      return;
    }
    isLoading = true;
    await fetchRecommendations(flavor);
    isLoading = false;
  }, 300);

  function handleSearch(event) {
    const flavor = event.detail;
    debouncedFetch(flavor);
  }

  function clearSearch() {
    searchResults = [];
    hasResults = true;
    $searchQuery = '';
  }
</script>

<div id="search-container">
  <SearchInput bind:value={$searchQuery} on:search={handleSearch} on:clear={clearSearch} />
</div>
{#if isLoading}
  <p>Loading...</p>
{:else if !hasResults}
  <p>No results found.</p>
{:else}
  <ul>
    {#each searchResults as result}
      <li>
        <strong>{result.name}</strong>
        <p>Strength: {result.strength}</p>
        <p>Type: {result.relationshipType}</p>
        <p>Node Type: {result.nodeType}</p>
      </li>
    {/each}
  </ul>
{/if}

<style>
  #search-container {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1;
  }
  
  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }

  li p {
    margin: 0;
    font-size: 0.9em;
    color: #666;
  }

  li strong {
    display: block;
    font-size: 1.2em;
  }
</style>
