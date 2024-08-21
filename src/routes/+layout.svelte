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

<div class="container mx-auto mt-5 h-screen overflow-y-auto">
	<SearchBar />

	{#if splitPaneEnabled}
		<SplitPane leftInitialSize="75%">
			<div slot="left">
				<Graph />
			</div>
			<div slot="right">
				<PowerView />
			</div>
		</SplitPane>
	{:else}
		<TabGroup>
			<Tab bind:group={tabSet} name="graph" value={0}>Graph</Tab>
			<Tab bind:group={tabSet} name="list" value={1}>List</Tab>

			<svelte:fragment slot="panel">
				{#if tabSet === 0}
					<Graph />
				{:else if tabSet === 1}
					<PowerView />
				{/if}
			</svelte:fragment>
		</TabGroup>
	{/if}

	<slot />
</div>
