<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup, setModeUserPrefers, modeUserPrefers, setModeCurrent, modeCurrent } from '@skeletonlabs/skeleton';
	import { LightSwitch, SlideToggle, TabGroup, Tab } from '@skeletonlabs/skeleton';
	import Graph from '../components/Graph.svelte';
	import PowerView from '../components/PowerView.svelte';
	import SearchBar from '../components/SearchBar.svelte';
	import SplitPane from '../components/SplitPane.svelte';
	import Analytics from '../components/Analytics.svelte';
	import SplashGraph from '../components/SplashGraph.svelte';

	let tabSet: number = 0;
	let splitPaneEnabled = true; // Set to true for default split view
	let hasSearched = false;

	// Set up Floating UI for popup functionality
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	onMount(() => {
		if (typeof window !== 'undefined') {
			const storedPref = localStorage.getItem('userPrefersDark');
			if (storedPref !== null) {
				const userPrefersDark = storedPref === 'true';

				// Apply the user preference
				setModeUserPrefers(userPrefersDark);
				setModeCurrent(userPrefersDark);
			} else {
				// Match the OS preference by default
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

				setModeUserPrefers(prefersDark);
				setModeCurrent(prefersDark);
				localStorage.setItem('userPrefersDark', prefersDark.toString());
			}
		}
	});

	// Watch for changes in modeUserPrefers and update localStorage
	$: {
		if (typeof window !== 'undefined' && $modeUserPrefers !== undefined) {
			localStorage.setItem('userPrefersDark', $modeUserPrefers.toString());
		}
	}

	// Watch for changes in modeCurrent to detect when the user changes preferences
	$: {
		if (typeof window !== 'undefined' && $modeCurrent !== undefined && $modeUserPrefers !== undefined) {
			if ($modeCurrent !== $modeUserPrefers) {
				setModeUserPrefers($modeCurrent);
				localStorage.setItem('userPrefersDark', $modeCurrent.toString());
			}
		}
	}

	function onSearch() {
		hasSearched = true;
	}
</script>

{#if !hasSearched}
	<!-- Splash Page with Search Bar at Google-like height -->
	<div class="relative w-full h-screen flex items-center justify-center">
		<SplashGraph /> <!-- Background graph component -->
		<div class="absolute inset-0 flex flex-col items-center" style="top: 33%;">
			<h1 class="text-5xl font-bold mb-8">Flavor Database</h1> <!-- Large text above the search bar -->
			<SearchBar on:search={onSearch} />
		</div>
	</div>
{:else}
	<!-- Main Page Content -->
	<div class="fixed top-5 right-5 z-50 flex flex-col items-end space-y-4">
		<LightSwitch /> <!-- The LightSwitch component now works with reactive stores -->
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
