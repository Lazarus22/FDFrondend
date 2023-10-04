<script>
  import ForceDirectedGraph from './components/ForceDirectedGraph.svelte';
  import Analytics from './Analytics.svelte'; // Make sure the path is correct
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
