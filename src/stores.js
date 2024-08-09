import { writable } from 'svelte/store';

export const searchQuery = writable('');
export const searchResultsMap = writable(new Map());
export const searchTerms = writable([]);
export const autoCompleteResults = writable([]);
export const isDarkMode = writable(false);
export const mode = writable('graph');

export async function fetchAutoCompleteResults(flavor) {
  if (flavor.length < 2) {
    autoCompleteResults.set([]);
    return;
  }

  const res = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/autocomplete?prefix=${flavor}`);
  const results = await res.json();
  autoCompleteResults.set(results);
}
