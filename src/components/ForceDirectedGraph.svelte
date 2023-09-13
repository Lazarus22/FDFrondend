<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let flavor = "";
  let expandedNodes = new Set();
  let nodes = [];
  let links = [];

  async function expandNode(flavor) {
    const res = await fetch(
      `https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`
    );
    const data = await res.json();

    if (!nodes.some((node) => node.name === data.flavor)) {
      nodes.push({ name: data.flavor, nodeType: "Flavor" });
    }
    expandedNodes.add(data.flavor);

    data.recommendations.forEach((rec) => {
      if (!nodes.some((node) => node.name === rec.name)) {
        nodes.push({ name: rec.name, nodeType: rec.nodeType });
      }
      if (
        !links.some(
          (link) =>
            link.source.name === data.flavor && link.target.name === rec.name
        )
      ) {
        links.push({
          source: data.flavor,
          target: rec.name,
          strength: rec.strength,
          relationshipType: rec.relationshipType,
        });
      }
    });
  }
  function collapseNode(flavor) {
  // Identify links that are connected to the flavor to be collapsed
  const linksToRemove = links.filter(
    (link) => link.source.name === flavor || link.target.name === flavor
  );

  // Identify nodes that are connected to the flavor to be collapsed
  const nodesToRemove = linksToRemove.map((link) =>
    link.source.name === flavor ? link.target.name : link.source.name
  );

  // Remove links connected to the flavor to be collapsed
  links = links.filter((link) => {
    return !(
      (link.source.name === flavor || link.target.name === flavor) &&
      !Array.from(expandedNodes).some(
        (expandedNode) =>
          link.source.name === expandedNode || link.target.name === expandedNode
      )
    );
  });

  // Remove nodes that are not connected to any other expanded node
  nodes = nodes.filter((node) => {
    return (
      !nodesToRemove.includes(node.name) ||
      Array.from(expandedNodes).some((expandedNode) =>
        links.some(
          (link) =>
            (link.source.name === expandedNode && link.target.name === node.name) ||
            (link.target.name === expandedNode && link.source.name === node.name)
        )
      )
    );
  });

  expandedNodes.delete(flavor);
}


  async function fetchDataAndUpdate(flavor) {
    if (expandedNodes.has(flavor)) {
      collapseNode(flavor);
    } else {
      await expandNode(flavor);
    }
    updateGraph();
  }

  function updateGraph() {
    d3.select("#forceGraph").selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const colorScale = d3.scaleLinear().domain([1, 4]).range(["#ccc", "#000"]); // Light gray to black

    const svg = d3
      .select("#forceGraph")
      .attr("width", width)
      .attr("height", height);

    const simulation = d3
      .forceSimulation(nodes) // Use global nodes
      .force(
        "link",
        d3
          .forceLink(links) // Use global links
          .id((d) => d.name)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => colorScale(d.strength)) // Use the color scale
      .attr("stroke-width", 2); // Set a uniform stroke width

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#69b3a2")
      .on("dblclick", (event, d) => {
        fetchDataAndUpdate(d.name);
      });

    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle") // Center the text
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("font-family", "Arial, Helvetica, sans-serif")
      .attr("pointer-events", "none") // Make text non-interactive
      .text((d) => d.name);

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        svg.selectAll("g").attr("transform", event.transform);
      });

    svg.call(zoom);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  }
  onMount(() => fetchDataAndUpdate(flavor));
</script>

<input
  type="text"
  bind:value={flavor}
  placeholder="Enter flavor"
  on:input={() => fetchDataAndUpdate(flavor)}
/>
<svg id="forceGraph" />
