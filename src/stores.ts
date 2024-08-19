import { writable, type Writable } from 'svelte/store';
import type { GraphNode, Link } from './types';

// Existing stores
export const searchQuery = writable<string>('');
export const searchResultsMap = writable<Map<string, string[]>>(new Map());
export const searchTerms = writable<string[]>([]);
export const autoCompleteResults = writable<string[]>([]);
export const isDarkMode = writable<boolean>(false);
export const mode = writable<string>('graph');

// New store for chip removal
export const chipToRemove = writable<string | null>(null);

// New stores for managing graph nodes and links
export const graphNodes = writable<GraphNode[]>([]);
export const graphLinks = writable<Link[]>([]);

// Store for managing the active tab state
export const activeTab: Writable<number> = writable(0); // Default to the first tab

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
