<script lang="ts">
	import '../app.postcss'; 
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { LightSwitch, SlideToggle, TabGroup, Tab } from '@skeletonlabs/skeleton';
	import Graph from '../components/Graph.svelte';
	import PowerView from '../components/PowerView.svelte';
	import SearchBar from '../components/SearchBar.svelte';
	import SplitPane from '../components/SplitPane.svelte';
	import Analytics from '../components/Analytics.svelte';
	import SplashGraph from '../components/SplashGraph.svelte';

	let tabSet: number = 0; 
	let splitPaneEnabled = false;
	let hasSearched = false;

	// Set up Floating UI for popup functionality
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	// This function will be called when the search is performed
	function onSearch() {
		hasSearched = true;
	}
</script>

{#if !hasSearched}
	<!-- Splash Page with Search Bar at Google-like height -->
	<div class="relative w-full h-screen flex items-center justify-center">
		<SplashGraph /> <!-- Background graph component -->
		<div class="absolute inset-0 flex flex-col items-center" style="top: 30%;"> <!-- Adjust top to position search bar one-third down the screen -->
			<h1 class="text-5xl font-bold mb-8">Flavor Database</h1> <!-- Large text above the search bar -->
			<SearchBar on:search={onSearch} />
		</div>
	</div>
{:else}
	<!-- Main Page Content -->
	<div class="fixed top-5 right-5 z-50 flex flex-col items-end space-y-4">
		<LightSwitch />
		<SlideToggle bind:checked={splitPaneEnabled} name="splitPaneToggle" id="splitPaneToggle" size="sm" />
	</div>

	<Analytics />

	<div class="w-full h-screen overflow-hidden">
		<div class="p-4 flex flex-col sm:flex-row sm:justify-between items-center space-y-4 sm:space-y-0">
			<div class="flex-1">
				<SearchBar />
			</div>
			{#if !splitPaneEnabled}
				<div class="flex-1 flex justify-center">
					<TabGroup>
						<Tab bind:group={tabSet} name="graph" value={0}>Graph</Tab>
						<Tab bind:group={tabSet} name="list" value={1}>List</Tab>
					</TabGroup>
				</div>
			{/if}
			<div class="flex-1"></div>
		</div>

		<div class="h-full">
			{#if splitPaneEnabled}
				<SplitPane leftInitialSize="75%">
					<div slot="left">
						<Graph />
					</div>
					<div slot="right" class="overflow-y-auto">
						<PowerView />
					</div>
				</SplitPane>
			{:else}
				{#if tabSet === 0}
					<Graph />
				{:else if tabSet === 1}
					<div class="overflow-y-auto h-full">
						<PowerView />
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
