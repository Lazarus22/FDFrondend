<script lang="ts">
	import { Autocomplete, InputChip } from '@skeletonlabs/skeleton';
	import type { AutocompleteOption } from '@skeletonlabs/skeleton';
	import {
		searchQuery,
		autoCompleteResults,
		fetchAutoCompleteResults,
		searchTerms,
		addChip,         // Importing the addChip function
		removeChip       // Importing the removeChip function
	} from '../stores';
	import { get } from 'svelte/store';

	let inputText = ''; // Bound search input text
	let autoCompleteOptions: AutocompleteOption<string>[] = [];
	let searchChips = get(searchTerms); // Initialize with current search terms

	let previousResults: string[] = []; // Store previous results for comparison

	// Watch for changes in inputText and fetch autocomplete results
	$: if (inputText.trim()) {
		fetchAutoCompleteResults(inputText).then((newResults) => {
			if (JSON.stringify(newResults) !== JSON.stringify(previousResults)) {
				previousResults = [...newResults]; // Update the previous results
				autoCompleteResults.set(newResults); // Update the store
				autoCompleteOptions = newResults.map((result) => ({
					label: result,
					value: result
				}));
			}
		});
	}

	// Ensure autoCompleteOptions is cleared when inputText is empty
	$: if (inputText === '') {
		autoCompleteOptions = [];
		autoCompleteResults.set([]); // Clear the autocomplete results store
	}

	$: searchChips = $searchTerms; // Ensure searchChips reflects updates in searchTerms

	// Function to handle selection from the Autocomplete component
	function handleAutocompleteSelect(event: CustomEvent<AutocompleteOption<string>>) {
		const selectedValue = event.detail.value;
		if (selectedValue) {
			addChip(selectedValue); // Use the addChip function
			inputText = ''; // Clear the search bar
			autoCompleteOptions = []; // Clear autocomplete options
			autoCompleteResults.set([]); // Clear the autocomplete results store
		}
	}

	// Function to handle addition of chips directly via the InputChip component
	function handleChipAdd(event: CustomEvent<{ chipValue: string }>) {
		const chip = event.detail.chipValue;
		if (chip) {
			addChip(chip); // Use the addChip function
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent form submission if inside a form
			handleChipAdd(new CustomEvent('add', { detail: { chipValue: inputText.trim() } }));
			// Clear autocomplete options explicitly
			inputText = ''; // Clear the search bar
			autoCompleteOptions = [];
			autoCompleteResults.set([]);
		}
	}

	function handleRemove(event: CustomEvent<{ chipValue: string }>) {
		const chip = event.detail.chipValue;
		removeChip(chip); // Use the removeChip function
	}
</script>

<div class="w-full max-w-sm">
	<InputChip
		bind:input={inputText}
		bind:value={searchChips}
		name="search"
		placeholder="Search..."
		on:keydown={handleKeydown}
		on:remove={handleRemove}
		on:add={handleChipAdd}  
	/>

	<!-- Conditionally render the Autocomplete component only if there are results -->
	{#if autoCompleteOptions.length > 0}
		<div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto" tabindex="-1">
			<Autocomplete
				bind:input={inputText}
				options={autoCompleteOptions}
				denylist={searchChips}
				on:selection={handleAutocompleteSelect} 
			/>
		</div>
	{/if}
</div>
