<script>
  import SearchInput from './SearchInput.svelte';
  import ResultList from './ResultList.svelte';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import debounce from 'lodash.debounce';
  import { isDarkMode } from '../stores.js';

  let searchResultsMap = new Map(); 
  let searchTerms = [];
  let isLoading = false;
  let hasResults = true;
  let currentMode = 'light-mode';

  const searchQuery = writable('');

  onMount(() => {
    const unsubscribe = isDarkMode.subscribe((value) => {
      currentMode = value ? 'dark-mode' : 'light-mode';
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  });

  async function fetchRecommendations(flavor) {
    try {
      const response = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`);
      const data = await response.json();
      searchResultsMap.set(flavor, data.recommendations.map(result => result.name).sort());
      hasResults = true;
    } catch (error) {
      console.error('Error fetching data:', error);
      hasResults = false;
    }
  }

  const debouncedFetch = debounce(async (flavor) => {
    if (flavor.length < 2) {
      searchResultsMap.clear();
      searchTerms = [];
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
    if (!searchTerms.includes(flavor)) {
      searchTerms.push(flavor);
    }
    debouncedFetch(flavor);
  }

  function clearSearch() {
    searchResultsMap.clear();
    searchResultsMap = new Map();
    searchTerms = [];
    $searchQuery = '';
    isLoading = false;
    hasResults = false;
    setTimeout(() => {
      hasResults = true;
    }, 0);
  }

  function getCommonAndUniqueSets() {
    const powerSet = [];
    const total = Math.pow(2, searchTerms.length);
    for (let i = 1; i < total; i++) {
      const subset = [];
      for (let j = 0; j < searchTerms.length; j++) {
        if (i & (1 << j)) {
          subset.push(searchTerms[j]);
        }
      }
      powerSet.push(subset);
    }

    let results = [];
    powerSet.sort((a, b) => b.length - a.length || a.join(', ').localeCompare(b.join(', ')));
    
    powerSet.forEach(set => {
      let commonNodes = null;
      set.forEach(term => {
        const nodes = new Set(searchResultsMap.get(term) || []);
        if (commonNodes === null) {
          commonNodes = nodes;
        } else {
          commonNodes = new Set([...commonNodes].filter(node => nodes.has(node)));
        }
      });

      const uniqueNodes = Array.from(commonNodes);
      if (uniqueNodes.length > 0) {
        results.push({
          set,
          nodes: uniqueNodes.sort()
        });
      }
    });

    return results;
  }
</script>

<div class="{currentMode}">
  <div id="search-container">
    <SearchInput bind:value={$searchQuery} on:search={handleSearch} on:clear={clearSearch} />
  </div>
  <div class="results-wrapper">
    {#if isLoading}
      <p>Loading...</p>
    {:else if !hasResults}
      <p>No results found.</p>
    {:else}
      <ResultList {searchTerms} {searchResultsMap} />
    {/if}
  </div>
</div>

<style>
  :global(body),
  :global(#search-container),
  :global(.results-wrapper),
  :global(.results-container),
  :global(.search-input) {
    margin: 0;
    padding: 0;
    transition: background-color 0.3s, color 0.3s;
  }

  :global(body.light-mode) {
    background-color: #f6f7fb;
    color: #000;
  }

  :global(body.dark-mode) {
    background-color: #333;
    color: #fff;
  }

  /* Ensure the entire content area respects the current mode */
  #search-container {
    position: relative;
    margin-bottom: 0; /* Remove bottom margin to avoid gaps */
    text-align: left; 
    padding: 20px 20px 10px 20px; /* Adjust padding */
    background-color: var(--background-color);
    color: var(--text-color);
  }

  .results-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start; 
    padding: 10px 20px; /* Adjust padding to align with search container */
    background-color: var(--background-color);
    color: var(--text-color);
    min-height: 100vh; /* Ensure it covers the full viewport height */
  }

  .results-container {
    margin: 0;
    text-align: left;
    width: 100%;
    background-color: var(--background-color);
    color: var(--text-color);
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    font-family: monospace;
  }

  li {
    padding: 5px 0;
    cursor: pointer;
  }

  strong {
    font-size: 1.5em;
    display: block;
    margin-bottom: 10px;
  }

  .light-mode {
    --background-color: #f6f7fb;
    --text-color: #000;
  }

  .dark-mode {
    --background-color: #333;
    --text-color: #fff;
  }

  .search-input, .search-button {
    background-color: var(--background-color);
    color: var(--text-color);
    border: 1px solid var(--text-color);
    transition: background-color 0.3s, color 0.3s;
  }

  .search-input::placeholder {
    color: var(--text-color);
    opacity: 0.7;
  }
</style>
