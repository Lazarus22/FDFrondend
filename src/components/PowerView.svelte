<script>
  import { onMount } from 'svelte';
  import { searchQuery, searchResultsMap, searchTerms } from '../stores.js';

  let isLoading = false;
  let hasResults = true;

  // Synchronize local state with global state on mount
  onMount(() => {
    const unsubscribe = searchQuery.subscribe(async (flavor) => {
      if (flavor) {
        await fetchRecommendations(flavor);
      }
    });

    return () => {
      unsubscribe();
    };
  });

  async function fetchRecommendations(flavor) {
    isLoading = true;
    try {
      const response = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`);
      const data = await response.json();

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
    } catch (error) {
      console.error('Error fetching data:', error);
      hasResults = false;
    } finally {
      isLoading = false;
    }
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
    console.log(`Item clicked: ${node}`);
  }
</script>

<div>
  <div class="results-wrapper">
    {#if isLoading}
      <p>Loading...</p>
    {:else if !hasResults}
      <p>No results found.</p>
    {:else}
      {#if getCommonAndUniqueSets() && getCommonAndUniqueSets().length > 0}
        {#each getCommonAndUniqueSets() as {set, nodes} (set.join(', '))}
          <div class="results-container">
            <strong>{"{"}{set.join(', ')}{"}"}</strong>
            <ul>
              {#each nodes as node, i (node)}
                <li tabindex="0" on:click={() => handleItemClick(node)} on:keydown={(e) => e.key === 'Enter' && handleItemClick(node)} style="cursor: pointer;">
                  {i < nodes.length - 1 ? '├── ' : '└── '}{node}
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
    padding: 5px 0;
    cursor: pointer;
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
