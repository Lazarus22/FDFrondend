<script>
  import { onMount } from 'svelte';
  import { searchQuery, searchResultsMap, searchTerms } from '../stores.js';

  let isLoading = false;
  let hasResults = true;
  let computedResults = [];

  // Synchronize local state with global state on mount
  onMount(() => {
    const unsubscribeSearch = searchQuery.subscribe(async (flavor) => {
      if (flavor && flavor.trim() !== '') {
        await fetchRecommendations(flavor);
      }
    });

    const unsubscribeResultsMap = searchResultsMap.subscribe(map => {
      if (map.size === 0) {
        clearResults();
      } else {
        computeResults(); // Recompute results whenever the map is updated
      }
    });

    const unsubscribeSearchTerms = searchTerms.subscribe(terms => {
      if (terms.length === 0) {
        clearResults();
      } else {
        computeResults(); // Recompute results whenever the terms are updated
      }
    });

    return () => {
      unsubscribeSearch();
      unsubscribeResultsMap();
      unsubscribeSearchTerms();
    };
  });

  async function fetchRecommendations(flavor) {
    isLoading = true;
    try {
      const response = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${encodeURIComponent(flavor)}`);
      const data = await response.json();

      if (data.recommendations && data.recommendations.length > 0) {
        searchTerms.update(terms => {
          if (!terms.includes(flavor)) terms.push(flavor);
          return terms;
        });

        searchResultsMap.update(map => {
          const existingResults = map.get(flavor) || [];
          const newResults = data.recommendations.map(result => result.name).sort();
          const mergedResults = [...new Set([...existingResults, ...newResults])];
          map.set(flavor, mergedResults);
          return map;
        });

        hasResults = true;
      } else {
        hasResults = false;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      hasResults = false;
    } finally {
      isLoading = false;
    }
  }

  function clearResults() {
    hasResults = false;
    isLoading = false;
    computedResults = []; // Ensure computedResults is cleared
  }

  function computeResults() {
    computedResults = getCommonAndUniqueSets();
  }

  function getCommonAndUniqueSets() {
    const powerSet = [];
    const terms = $searchTerms;
    const resultsMap = $searchResultsMap;
    const total = Math.pow(2, terms.length);

    for (let i = 1; i < total; i++) {
      const subset = [];
      for (let j = 0; j < terms.length; j++) {
        if (i & (1 << j)) {
          subset.push(terms[j]);
        }
      }
      powerSet.push(subset);
    }

    let results = [];
    powerSet.sort((a, b) => b.length - a.length || a.join(', ').localeCompare(b.join(', ')));

    powerSet.forEach(set => {
      let commonNodes = null;
      set.forEach(term => {
        const nodes = new Set(resultsMap.get(term) || []);
        if (commonNodes === null) {
          commonNodes = nodes;
        } else {
          commonNodes = new Set([...commonNodes].filter(node => nodes.has(node)));
        }
      });

      const uniqueNodes = Array.from(commonNodes || []);

      if (uniqueNodes.length > 0) {
        results.push({
          set,
          nodes: uniqueNodes.sort()
        });
      }
    });

    return results || [];
  }

  function handleItemClick(node) {
    searchQuery.set(node); // Treat the clicked word as a new search query
  }
</script>

<div>
  <div class="results-wrapper">
    {#if isLoading}
      <p>Loading...</p>
    {:else if !hasResults}
      <p>No results found.</p>
    {:else}
      {#if computedResults.length > 0}
        {#each computedResults as {set, nodes} (set.join(', '))}
          <div class="results-container">
            <strong>{"{"}{set.join(', ')}{"}"}</strong>
            <ul>
              {#each nodes as node, i (node)}
                <li>
                  <button 
                    on:click|preventDefault={() => handleItemClick(node)} 
                    on:keydown|preventDefault={(e) => e.key === 'Enter' && handleItemClick(node)} 
                    style="cursor: pointer; background: none; border: none; padding: 5px 0; text-align: left; width: 100%;"
                  >
                    {i < nodes.length - 1 ? '├── ' : '└── '}{node}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      {:else}
        <p>No matching results found.</p>
      {/if}
    {/if}
  </div>
</div>
<style>
  .results-wrapper {
    padding: 20px;
  }

  .results-container {
    margin-bottom: 20px;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    font-family: monospace;
  }
  li {
    padding: 0;
  }
  button {
    cursor: pointer;
    background: none;
    border: none;
    padding: 5px 0;
    text-align: left;
    width: 100%;
    font-family: inherit;
    font-size: inherit;
  }
  strong {
    font-size: 1.5em;
    display: block;
    margin-bottom: 10px;
  }

  .results-container ul {
    margin-left: 20px;
  }
</style>
