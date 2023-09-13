<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let flavor = ""; // No default flavor

  async function updateGraph() {
    if (!flavor) return; // Don't fetch if no flavor is entered

    const res = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`);
    const data = await res.json();

    // Clear previous graph
    d3.select("#forceGraph").selectAll("*").remove();

    // Prepare data and draw graph
    let nodes = [{ name: data.flavor, nodeType: "Flavor" }];
    let links = [];

    data.recommendations.forEach((rec) => {
      nodes.push({ name: rec.name, nodeType: rec.nodeType });
      links.push({
        source: data.flavor,
        target: rec.name,
        strength: rec.strength,
        relationshipType: rec.relationshipType,
      });
    });

    const svg = d3.select("#forceGraph");
    const width = 600;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.name))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", (d) => d.strength);

    const node = svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#69b3a2");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });
  }

  onMount(updateGraph);
</script>

<input type="text" bind:value={flavor} placeholder="Enter flavor" on:input={updateGraph} />
<svg id="forceGraph"></svg>
