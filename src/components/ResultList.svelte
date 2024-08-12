<script>
  import { flip } from 'svelte/animate';

  export let searchTerms;
  export let searchResultsMap;
  export let onItemClick; // Allow a function to be passed in for handling item clicks

  function handleItemClick(node) {
    if (typeof onItemClick === 'function') {
      onItemClick(node);
    }
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

<div>
  {#each getCommonAndUniqueSets() as {set, nodes} (set.join(', '))}
    <div class="results-container" animate:flip>
      <strong>{"{"}{set.join(', ')}{"}"}</strong>
      <ul>
        {#each nodes as node, i (node)}
          <li>
            <button 
              on:click={() => handleItemClick(node)} 
              on:keydown={(e) => e.key === 'Enter' && handleItemClick(node)} 
              style="cursor: pointer; background: none; border: none; padding: 5px 0; text-align: left; width: 100%;"
            >
              {i < nodes.length - 1 ? '├── ' : '└── '}{node}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .results-container {
    margin: 0;
    padding: 10px 0;
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
</style>