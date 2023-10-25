<script>
  import ForceDirectedGraph from './components/ForceDirectedGraph.svelte';
  import Analytics from './components/Analytics.svelte';
  import { load } from '@sveltejs/kit/http';
</script>

<Analytics />

<main>
  <ForceDirectedGraph />
</main>

<style>
  main {
    text-align: center;
    padding: 0;
    width: 100%;
    margin: 0;
  }
</style>

<!-- HTTPS enforcement middleware -->
<script context="module">
  export async function beforeLoad({ request }) {
    // Check if the request protocol is not HTTPS
    if (request.protocol !== 'https') {
      // Redirect to HTTPS
      const httpsUrl = `https://${request.host}${request.path}`;
      return load(httpsUrl, request);
    }
    // Continue with the request
    return load(request);
  }
</script>
