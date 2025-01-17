<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import { writable } from 'svelte/store';

	export let results: Array<{ set: string[]; nodes: string[] }>;
	export let onItemClick: (node: string) => void;

	let openIndex = writable<number | null>(0); // Track the open index

	function handleItemClick(node: string) {
		if (typeof onItemClick === 'function') {
			onItemClick(node);
		}
	}

	function toggleItem(index: number) {
		openIndex.update((current) => (current === index ? null : index)); // Toggle item open or close
	}
</script>

<Accordion
  spacing="space-y-2"
  width="w-full"
  rounded="rounded-md"
  hover="hover:bg-primary-hover-token"
>
  {#each results as { set, nodes }, index (set.join(', '))}
    <AccordionItem open={$openIndex === index} on:click={() => toggleItem(index)}>
      <svelte:fragment slot="summary">
        {'{' + set.join(', ') + '}'}
      </svelte:fragment>
      <svelte:fragment slot="content">
        <ul class="list nested-list">
          {#each nodes as node, i (node)}
            <li class="nested-item">
              <button
                on:click={() => handleItemClick(node)}
                class="node-button w-full text-left hover:bg-primary-hover-token rounded-md px-4 py-2"
              >
                <span>{i < nodes.length - 1 ? '├── ' : '└── '}{node}</span>
              </button>
            </li>
          {/each}
        </ul>
      </svelte:fragment>
    </AccordionItem>
  {/each}
</Accordion>

<style>
  .list,
  .nested-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
    overflow-y: auto; /* Ensure content can overflow and scroll */
    max-height: 100%; /* Fill available space inside the container */
  }

  .nested-item {
    padding-left: 20px;
    margin-bottom: 0; /* No bottom margin to avoid gaps */
  }

  .node-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 0;
    width: 100%;
    text-align: left;
  }

  /* Ensure the parent container fills height */
  :global(.accordion-item-content) {
    max-height: 100%; /* Ensure accordion items can grow and shrink */
    overflow-y: auto; /* Scroll when content overflows */
  }
</style>
