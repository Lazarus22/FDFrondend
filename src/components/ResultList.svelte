<script>
  import { flip } from 'svelte/animate';

  export let searchTerms;
  export let searchResultsMap;

  function handleItemClick(node) {
    // Handle item click (e.g., refetch, update results)
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
          <li on:click={() => handleItemClick(node)} style="cursor: pointer;">
            {i < nodes.length - 1 ? '├── ' : '└── '}{node}
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  /* Add relevant styles */
</style>
