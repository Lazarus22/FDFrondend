<script lang="ts">
	export let results: Array<{ set: string[]; nodes: string[] }>;
	export let onItemClick: (node: string) => void;

	function handleItemClick(node: string) {
		if (typeof onItemClick === 'function') {
			onItemClick(node);
		}
	}
</script>

<div>
	{#each results as { set, nodes } (set.join(', '))}
		<div class="results-container">
			<strong>{'{'}{set.join(', ')}{'}'}</strong>
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
