<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AutocompleteOption } from '@skeletonlabs/skeleton';

  export let input: string = '';
  export let options: AutocompleteOption<any>[] = [];
  export let denylist: string[] = [];
  export let highlightedIndex: number = -1;

  const dispatch = createEventDispatcher();

  let filteredOptions: AutocompleteOption<any>[] = [];

  $: filteredOptions = filterOptions();

  function filterOptions(): AutocompleteOption<any>[] {
    let opts = options;

    // Apply denylist
    if (denylist && denylist.length > 0) {
      opts = opts.filter((option) => !denylist.includes(option.value));
    }

    const inputLower = input.toLowerCase();
    opts = opts.filter((option) => option.label.toLowerCase().includes(inputLower));

    return opts;
  }

  function selectOption(option: AutocompleteOption<any>) {
    dispatch('selection', option);
  }
</script>

{#if filteredOptions.length > 0}
  <ul class="absolute z-10 w-full max-h-48 overflow-y-auto bg-white shadow-md border border-gray-200">
    {#each filteredOptions as option, index}
      <li>
        <button
          type="button"
          class="w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 {index === highlightedIndex ? 'bg-gray-100' : ''}"
          on:click={() => selectOption(option)}
        >
          {option.label}
        </button>
      </li>
    {/each}
  </ul>
{/if}
