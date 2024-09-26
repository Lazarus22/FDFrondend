<script lang="ts">
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { activeTab, searchQuery, searchResultsMap, searchTerms, chipToRemove } from '../stores';
	import ResultList from './ResultsList.svelte';
	import type { Readable } from 'svelte/store';

	let isLoading = false;
	let hasResults = false;
	let hasSearched = false;

	// Derive results from searchTerms and searchResultsMap
	const results: Readable<Array<{ set: string[]; nodes: string[] }>> = derived(
		[searchTerms, searchResultsMap],
		([$searchTerms, $searchResultsMap]: [string[], Map<string, string[]>]) => {
			return computeResults($searchTerms, $searchResultsMap);
		}
	);

	onMount(() => {
		// Initialize PowerView logic when the component is mounted
		initializePowerView();
		initializeFromGlobalState();

		// Listen to the search query store
		const unsubscribeSearch = searchQuery.subscribe(async (flavor) => {
			if (flavor) {
				await fetchRecommendations(flavor);
			}
		});

		// Listen to the active tab and re-initialize when switching to the PowerView tab
		const unsubscribeTab = activeTab.subscribe((tab) => {
			if (tab === 1) {
				// Assuming 1 is the index for the PowerView (List) tab
				initializePowerView(); // Re-initialize PowerView
				initializeFromGlobalState(); // Re-fetch data if necessary
			}
		});

		return () => {
			// Unsubscribe from all subscriptions
			unsubscribeSearch();
			unsubscribeTab();
		};
	});

	// Example functions to initialize PowerView and fetch data
	function initializePowerView() {
		// Any setup specific to PowerView goes here
	}

	async function initializeFromGlobalState() {
		const terms = get(searchTerms); // Get search terms from store
		for (const term of terms) {
			await fetchRecommendations(term);
		}
	}

	async function fetchRecommendations(flavor: string) {
		isLoading = true;
		hasSearched = true; // Set to true when a search is initiated
		try {
			const response = await fetch(
				`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${encodeURIComponent(flavor)}`
			);
			const data = await response.json();

			if (data.recommendations && data.recommendations.length > 0) {
				searchTerms.update((terms) => {
					if (!terms.includes(flavor)) terms.push(flavor);
					return terms;
				});

				searchResultsMap.update((map) => {
					const newResults = data.recommendations
						.map((result: { name: string }) => result.name)
						.sort();
					map.set(flavor, newResults);
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

	function computeResults(
  terms: string[],
  resultsMap: Map<string, string[]>
): Array<{ set: string[]; nodes: string[] }> {
  const results: Array<{ set: string[]; nodes: string[] }> = [];

  function getAllSubsets(arr: string[]): string[][] {
    return arr
      .reduce<string[][]>(
        (subsets, value) => subsets.concat(subsets.map((set) => [value, ...set])),
        [[]]
      )
      .filter((subset) => subset.length > 0); // Remove empty set
  }

  const subsets = getAllSubsets(terms);

  // Sort subsets by length in descending order, and then lexicographically within equal lengths
  subsets.sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length; // Sort by length (descending)
    }
    return a.join('').localeCompare(b.join('')); // Sort lexicographically (ascending)
  });

  // To keep track of assigned nodes
  const assignedNodes = new Set<string>();

  subsets.forEach((subset) => {
    let commonNodes: Set<string> | null = null;

    // Find common nodes for the current subset
    subset.forEach((term) => {
      const nodes = new Set<string>(resultsMap.get(term) || []);
      if (commonNodes === null) {
        commonNodes = nodes;
      } else {
        commonNodes = new Set([...commonNodes].filter((node) => nodes.has(node)));
      }
    });

    // Remove already assigned nodes from commonNodes
    if (commonNodes) {
      commonNodes = new Set([...commonNodes].filter((node) => !assignedNodes.has(node)));
    }

    // If there are nodes left after removing assigned ones, add to results
    if (commonNodes && commonNodes.size > 0) {
      const sortedSubset = [...subset].sort(); // Sort within the subset
      results.push({
        set: sortedSubset,
        nodes: Array.from(commonNodes) as string[] // Cast to string[]
      });

      // Mark nodes as assigned
      commonNodes.forEach((node) => assignedNodes.add(node));
    }
  });

  return results;
}


	function handleNodeClick(node: string) {
		searchTerms.update((terms) => {
			if (!terms.includes(node)) {
				return [...terms, node];
			}
			return terms;
		});

		// Trigger a search with the clicked node
		searchQuery.set(node);
	}
</script>

<div class="results-wrapper">
  {#if isLoading}
    <p>Loading...</p>
  {:else if hasSearched && !hasResults}
    <p>No results found.</p>
  {:else if hasResults}
    <ResultList results={$results} onItemClick={handleNodeClick} />
  {/if}
</div>

<style>
  .results-wrapper {
    flex: 1 1 auto;
    overflow-y: auto; /* Ensure content can overflow and scroll */
    display: flex;
    flex-direction: column;
    max-height: 100%; /* Ensure it can grow and shrink with its parent */
  }

  p {
    font-size: 1.2em;
    text-align: center;
  }

  /* Ensure the parent containers fill available height */
  :global(html, body) {
    height: 100%; /* Set height to 100% to make sure all parents grow */
  }

  :global(#app) {
    height: 100%; /* Set the main app container height to full screen */
  }
</style>



