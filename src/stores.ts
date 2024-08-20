import { writable, type Writable, get } from 'svelte/store';
import type { GraphNode, Link } from './types';

// Existing stores
export const searchQuery = writable<string>('');
export const searchResultsMap = writable<Map<string, string[]>>(new Map());
export const searchTerms = writable<string[]>([]);
export const autoCompleteResults = writable<string[]>([]);
export const mode = writable<string>('graph');

// New store for chip removal
export const chipToRemove = writable<string | null>(null);

// New stores for managing graph nodes and links
export const graphNodes = writable<GraphNode[]>([]);
export const graphLinks = writable<Link[]>([]);

// Store for managing the active tab state
export const activeTab: Writable<number> = writable(0); // Default to the first tab

// Function to add a chip (search term) to the searchTerms store
export function addChip(chip: string) {
	searchTerms.update((terms) => {
		if (!terms.includes(chip)) {
			terms.push(chip);
		}
		return terms;
	});

	searchQuery.set(chip);
}

// Function to remove a chip (search term) from the searchTerms store
export function removeChip(chip: string) {
	searchTerms.update((terms) => {
		return terms.filter((term) => term !== chip);
	});

	chipToRemove.set(chip);

	// Clear the searchQuery if the removed chip was the last query
	if (get(searchQuery) === chip) {
		searchQuery.set(''); // Clear the searchQuery
	}
}

// Example fetch function for autocomplete results
export async function fetchAutoCompleteResults(flavor: string): Promise<string[]> {
	if (flavor.length < 2) {
		autoCompleteResults.set([]);
		return []; // Return an empty array to match the expected return type
	}

	const res = await fetch(
		`https://fdbackend-d0a756cc3435.herokuapp.com/autocomplete?prefix=${flavor}`
	);
	const results: string[] = await res.json();
	autoCompleteResults.set(results);
	return results; // Return the results array to match the expected return type
}
