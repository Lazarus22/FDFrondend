<script lang="ts">
	import '../app.postcss'; 
	import { LightSwitch, SlideToggle, TabGroup, Tab } from '@skeletonlabs/skeleton';
	import Graph from '../components/Graph.svelte';
	import PowerView from '../components/PowerView.svelte';
	import SearchBar from '../components/SearchBar.svelte';
	import SplitPane from '../components/SplitPane.svelte';
	import Analytics from '../components/Analytics.svelte';

	let tabSet: number = 0; 
	let splitPaneEnabled = false;
</script>

<!-- LightSwitch and Split Pane Toggle in a vertically aligned position -->
<div class="fixed top-5 right-5 z-50 flex flex-col items-end space-y-4">
	<LightSwitch />
	<SlideToggle bind:checked={splitPaneEnabled} name="splitPaneToggle" id="splitPaneToggle" size="sm" />
</div>

<!-- Include the Analytics component -->
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
		<div class="flex-1"></div> <!-- Empty space to balance the layout -->
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
				<div class="overflow-y-auto h-full"> <!-- Added scroll handling -->
					<PowerView />
				</div>
			{/if}
		{/if}
	</div>
</div>
