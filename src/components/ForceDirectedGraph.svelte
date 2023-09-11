<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  async function fetchData(flavor) {
    const response = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`);
    const data = await response.json();
    return data;
  }

  onMount(async () => {
    const flavor = "chicken"; // Replace this with the flavor you want to query
    const data = await fetchData(flavor);

    // Initialize SVG
    const svg = d3.select("#forceGraph")
                  .append("svg")
                  .attr("width", 400)
                  .attr("height", 400);

    // Initialize simulation
    const simulation = d3.forceSimulation()
                          .force("link", d3.forceLink().id((d) => d.id))
                          .force("charge", d3.forceManyBody())
                          .force("center", d3.forceCenter(200, 200));

    // Create nodes and links data
    const nodes = [{ id: data.flavor, nodeType: "Flavor" }, ...data.recommendations.map((r) => ({ id: r.name, nodeType: r.nodeType }))];
    const links = data.recommendations.map((r) => ({ source: data.flavor, target: r.name, strength: r.strength }));

    // Create links
    const link = svg.append("g")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr("stroke-width", (d) => Math.sqrt(d.strength));

    // Create nodes
    const node = svg.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("r", 5)
                    .attr("fill", (d) => (d.nodeType === "Flavor" ? "red" : "blue"));

    // Update simulation nodes and links
    simulation.nodes(nodes)
              .on("tick", ticked);

    simulation.force("link")
              .links(links);

    function ticked() {
      link.attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);
    }
  });
</script>

<div id="forceGraph"></div>
