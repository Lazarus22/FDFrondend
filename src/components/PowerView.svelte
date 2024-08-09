<script>
  import SearchInput from './SearchInput.svelte';
  import { writable } from 'svelte/store';
  import debounce from 'lodash.debounce';

  let searchResultsMap = new Map(); // Store results for each search term
  let searchTerms = [];
  let isLoading = false;
  let hasResults = true;
  let omitSet = new Set(); // Store nodes that should be omitted in lower levels

  const searchQuery = writable('');

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

    // Sort power set by length (largest sets first), then alphabetically within the same length
    powerSet.sort((a, b) => b.length - a.length || a.join(', ').localeCompare(b.join(', ')));

    let results = [];
    omitSet.clear(); // Clear omit set before processing the new search

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
        results.push({ set, nodes: Array.from(uniqueNodes).sort() });
        omitSet = new Set([...omitSet, ...uniqueNodes]); // Add these nodes to omit set
      }
    });

    return results;
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

<style>
  #search-container {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1;
  }
  
  .results-container {
    margin: 0 auto;
    text-align: left;
    width: fit-content;
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
</style>
