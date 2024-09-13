<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		Autocomplete,
		InputChip,
		popup,
		type PopupSettings,
		type AutocompleteOption
	} from '@skeletonlabs/skeleton';
	import {
		autoCompleteResults,
		fetchAutoCompleteResults,
		searchTerms,
		addChip,
		removeChip
	} from '../stores';
	import { get } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import { computePosition, offset, flip, shift } from '@floating-ui/dom';
	import type { Placement } from '@floating-ui/dom';

	const dispatch = createEventDispatcher();
	let inputText = '';
	let autoCompleteOptions: AutocompleteOption<string>[] = [];
	let searchChips = get(searchTerms);
	let previousResults: string[] = [];
	let showPopup = false;
	let popupElement: HTMLElement | null = null;
	let containerElement: HTMLElement | null = null;

	let popupSettings: PopupSettings = {
		event: 'focus-click',
		target: '.input-chip-container',
		placement: 'bottom-start',
		middleware: {
			offset: ({
				rects,
				placement
			}: {
				rects: { reference: DOMRect; floating: DOMRect };
				placement: Placement;
			}) => {
				if (placement.startsWith('bottom')) {
					return { mainAxis: rects.reference.height + 10 }; // Add a 10-pixel buffer below the container
				}
				return { mainAxis: 0 };
			},
			flip: { fallbackPlacements: ['top-start', 'bottom-start'] },
			shift: { padding: 5 }
		}
	};

	onMount(async () => {
		await tick();

		containerElement = document.querySelector('.input-chip-container'); // Update to target container

		window.addEventListener('resize', updatePopupPosition);
		window.addEventListener('scroll', updatePopupPosition, true);
	});

	async function handlePopupVisibilityChange() {
		if (showPopup) {
			await tick(); // Wait for DOM to update with the popup element
			popupElement = document.querySelector('[data-popup="popupAutocomplete"]');
			updatePopupPosition(); // Recompute position when popup is shown
		}
	}

	// Call this function every time `showPopup` changes
	$: handlePopupVisibilityChange();

	function updatePopupPosition() {
		if (containerElement && popupElement) {
			// Update condition to use containerElement
			computePosition(containerElement, popupElement, {
				placement: 'bottom-start',
				middleware: [offset(10), flip(), shift({ padding: 5 })] // Offset dynamically based on container
			})
				.then(({ x, y }) => {
					Object.assign(popupElement!.style, {
						left: `${x}px`,
						top: `${y}px`,
						display: 'block',
						visibility: 'visible',
						position: 'absolute'
					});
				})
				.catch((err) => console.error('Error computing popup position:', err));
		}
	}

	// Fetch autocomplete results
	$: if (inputText.trim()) {
		fetchAutoCompleteResults(inputText)
			.then((newResults) => {
				if (JSON.stringify(newResults) !== JSON.stringify(previousResults)) {
					previousResults = [...newResults];
					autoCompleteResults.set(newResults);
					autoCompleteOptions = newResults.map((result) => ({ label: result, value: result }));
					showPopup = autoCompleteOptions.length > 0;
					logPopupState();
					handlePopupVisibilityChange(); // Explicitly handle popup visibility
				}
			})
			.catch((error) => console.error('Error fetching autocomplete results:', error));
	}

	// Clear autocomplete options if inputText is empty
	$: if (inputText === '') {
		autoCompleteOptions = [];
		autoCompleteResults.set([]);
		showPopup = false;
		logPopupState();
	}

	$: searchChips = $searchTerms;

	function handleAutocompleteSelect(event: CustomEvent<AutocompleteOption<string>>) {
		const selectedValue = event.detail.value;
		if (selectedValue) {
			addChip(selectedValue);
			inputText = ''; // Clear input text
			autoCompleteOptions = []; // Clear autocomplete options
			autoCompleteResults.set([]); // Clear stored autocomplete results
			showPopup = false;
			logPopupState();
			dispatch('search');
		}
	}

	function handleChipAdd(event: CustomEvent<{ chipValue: string }>) {
		const chip = event.detail.chipValue;
		if (chip) {
			addChip(chip);
			dispatch('search');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleChipAdd(new CustomEvent('add', { detail: { chipValue: inputText.trim() } }));
			inputText = '';
			autoCompleteOptions = [];
			autoCompleteResults.set([]);
			showPopup = false;
			logPopupState();
		}
	}

	function handleRemove(event: CustomEvent<{ chipValue: string }>) {
		const chip = event.detail.chipValue;
		removeChip(chip);
	}

	function logPopupState() {
		if (showPopup && popupElement) {
			popupElement.style.display = 'block';
			popupElement.style.zIndex = '1000';
			popupElement.style.visibility = 'visible';
			popupElement.style.maxHeight = '200px';
			popupElement.style.overflowY = 'auto';
		} else if (popupElement) {
			popupElement.style.display = 'none';
		}
	}
</script>

<div class="w-full max-w-sm relative input-chip-container">
	<InputChip
		bind:input={inputText}
		bind:value={searchChips}
		name="search"
		placeholder="Search..."
		on:keydown={handleKeydown}
		on:remove={handleRemove}
		on:add={handleChipAdd}
	/>

	{#if showPopup}
		<div
			use:popup={popupSettings}
			data-popup="popupAutocomplete"
			class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto"
			tabindex="0"
			role="button"
			on:click={() => {}}
			on:keydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
				}
			}}
		>
			<Autocomplete
				bind:input={inputText}
				options={autoCompleteOptions}
				denylist={searchChips}
				on:selection={handleAutocompleteSelect}
			/>
		</div>
	{/if}
</div>

<style>
	[data-popup='popupAutocomplete'] {
		position: absolute !important;
		margin: 0 !important;
		padding: 0 !important;
		z-index: 1000; /* Ensure it’s above other elements */
		max-height: 200px; /* Optional: Limit height */
		overflow-y: auto; /* Optional: Allow scrolling */
	}

	.card[data-popup='popupAutocomplete'] {
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}

	[data-popup='popupAutocomplete'] {
		display: block !important;
		visibility: visible !important;
	}
</style>
