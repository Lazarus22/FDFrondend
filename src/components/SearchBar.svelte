<script lang="ts">
	import { Autocomplete, InputChip } from '@skeletonlabs/skeleton';
	import type { AutocompleteOption } from '@skeletonlabs/skeleton';
	import {
		searchQuery,
		autoCompleteResults,
		fetchAutoCompleteResults,
		searchTerms,
		chipToRemove
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

	function handleSelect(event: CustomEvent<AutocompleteOption<string>> | KeyboardEvent) {
		let selectedValue: string | undefined;

		if (event instanceof KeyboardEvent) {
			selectedValue = inputText.trim();
		} else if (event.detail && event.detail.value) {
			selectedValue = event.detail.value;
		}

		if (selectedValue) {
			if (!searchChips.includes(selectedValue)) {
				searchChips = [...searchChips, selectedValue];
				searchTerms.set(searchChips); // Update the searchTerms store
			}
			searchQuery.set(selectedValue); // Trigger search
		}

		// Clear input and autocomplete options after selection
		inputText = '';
		autoCompleteOptions = []; // Clear local autocomplete options
		autoCompleteResults.set([]); // Clear the autocomplete results store

		// Optionally blur the input to close any open dropdown
		const inputElement = document.querySelector('input[name="search"]') as HTMLInputElement | null;
		if (inputElement) {
			inputElement.blur();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent form submission if inside a form
			handleSelect(event);
			// Clear autocomplete options explicitly
			autoCompleteOptions = [];
			autoCompleteResults.set([]);
		}
	}

	function removeChip(event: CustomEvent<{ chipValue: string }>) {
		const chip = event.detail.chipValue; // Extract the chip value from the event
		searchChips = searchChips.filter((item) => item !== chip);
		searchTerms.set(searchChips); // Update the searchTerms store

		// Set the chipToRemove store to trigger graph updates
		chipToRemove.set(chip);

		// Clear the searchQuery if the removed chip was the last query
		if (get(searchQuery) === chip) {
			searchQuery.set(''); // Clear the searchQuery
		}
	}

	function handleAdd(event: CustomEvent<{ chipValue: string }>) {
		const chip = event.detail.chipValue;

		if (!searchChips.includes(chip)) {
			searchChips = [...searchChips, chip]; // Add chip to the list
			searchTerms.set(searchChips); // Update the searchTerms store
		}

		searchQuery.set(chip); // Update searchQuery to trigger PowerView update
	}
</script>

<div class="w-full max-w-sm">
	<InputChip
		bind:input={inputText}
		bind:value={searchChips}
		name="search"
		placeholder="Search..."
		on:keydown={handleKeydown}
		on:remove={removeChip}
		on:add={handleAdd}
	/>

	<!-- Conditionally render the Autocomplete component only if there are results -->
	{#if autoCompleteOptions.length > 0}
		<div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto" tabindex="-1">
			<Autocomplete
				bind:input={inputText}
				options={autoCompleteOptions}
				denylist={searchChips}
				on:selection={handleSelect}
			/>
		</div>
	{/if}
</div>
