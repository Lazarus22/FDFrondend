<script>
  import SearchInput from './SearchInput.svelte';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import debounce from 'lodash.debounce';
  import { isDarkMode } from '../stores.js';

  let searchResultsMap = new Map(); 
  let searchTerms = [];
  let isLoading = false;
  let hasResults = true;
  let omitSet = new Set(); 
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
    omitSet.clear();
    $searchQuery = '';
    isLoading = false;
    hasResults = false;
    setTimeout(() => {
      hasResults = true;
    }, 0);
  }

  function handleItemClick(node) {
    if (!searchTerms.includes(node)) {
      searchTerms.push(node);
      debouncedFetch(node);
    }
  }

  function getPowerSet(arr) {
    const powerSet = [];
    const total = Math.pow(2, arr.length);
    for (let i = 1; i < total; i++) {
      const subset = [];
      for (let j = 0; j < arr.length; j++) {
        if (i & (1 << j)) {
          subset.push(arr[j]);
        }
      }
      powerSet.push(subset);
    }
    return powerSet;
  }

  function getCommonAndUniqueSets() {
    const powerSet = getPowerSet(searchTerms);
    powerSet.sort((a, b) => b.length - a.length || a.join(', ').localeCompare(b.join(', ')));
    let results = [];
    omitSet.clear();
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
      const uniqueNodes = new Set([...commonNodes].filter(node => !omitSet.has(node)));
      if (uniqueNodes.size > 0) {
        results.push({
          set,
          nodes: Array.from(uniqueNodes).sort()
        });
        omitSet = new Set([...omitSet, ...uniqueNodes]);
      }
    });
    return results;
  }
</script>

<!-- Apply the currentMode class to the entire content container -->
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
      {#each getCommonAndUniqueSets() as {set, nodes}}
        {#if nodes.length}
          <div class="results-container">
            <strong>{"{"}{set.join(', ')}{"}"}</strong>
            <ul>
              {#each nodes as node, i}
                <li on:click={() => handleItemClick(node)} style="cursor: pointer;">
                  {i < nodes.length - 1 ? '├── ' : '└── '}{node}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {/each}
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
