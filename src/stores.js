import { writable } from 'svelte/store';

export const flavors = writable([]);
export const isDarkMode = writable(false);