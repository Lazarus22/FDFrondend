<script>
  import { searchQuery, autoCompleteResults, searchResultsMap, searchTerms } from '../stores.js';

  function clearSearch() {
    searchQuery.set(''); // Reset the search query store
    autoCompleteResults.set([]); // Clear autocomplete results
    searchResultsMap.set(new Map()); // Clear the search results map
    searchTerms.set([]); // Clear the search terms
  }
</script>

<button on:click={clearSearch}>
  Clear
</button>

<style>
  button {
    padding: 10px;
    font-size: 1em;
    cursor: pointer;
  }
</style>
