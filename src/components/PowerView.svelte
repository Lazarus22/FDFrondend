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
				.reduce<
					string[][]
				>((subsets, value) => subsets.concat(subsets.map((set) => [value, ...set])), [[]])
				.filter((subset) => subset.length > 0);
		}

		const subsets = getAllSubsets(terms);

		subsets.forEach((subset) => {
			let commonNodes: Set<string> | null = null;

			subset.forEach((term) => {
				const nodes = new Set<string>(resultsMap.get(term) || []);
				if (commonNodes === null) {
					commonNodes = nodes;
				} else {
					commonNodes = new Set([...commonNodes].filter((node) => nodes.has(node)));
				}
			});

			// Type assertion to ensure commonNodes is treated as Set<string>
			if (commonNodes && (commonNodes as Set<string>).size > 0) {
				results.push({
					set: [...subset].sort(),
					nodes: Array.from(commonNodes) as string[] // Explicitly cast to string[]
				});
			}
		});

		results.sort((a, b) => b.set.length - a.set.length);

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
		<!-- Pass the results and onItemClick prop -->
		<ResultList results={$results} onItemClick={handleNodeClick} />
	{/if}
</div>

<style>
	.results-wrapper {
		padding: 20px;
	}

	p {
		font-size: 1.2em;
		text-align: center;
	}
</style>
