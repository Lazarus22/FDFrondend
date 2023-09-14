<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let flavor = "";
  let expandedNodes = new Set();
  let nodes = [];
  let links = [];
  let simulation;

  async function expandNode(flavor) {
    const res = await fetch(
      `https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`
    );
    const data = await res.json();

    // Check if recommendations are null
    if (data.recommendations === null) {
      return; // Exit the function early
    }

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
    // Remove the node from the expandedNodes set
    expandedNodes.delete(flavor);

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
            link.source.name === expandedNode ||
            link.target.name === expandedNode
        )
      );
    });

    // Remove nodes that are not connected to any other expanded node and are not in the expandedNodes set
    nodes = nodes.filter((node) => {
      return (
        expandedNodes.has(node.name) ||
        node.name === flavor ||
        !nodesToRemove.includes(node.name) ||
        Array.from(expandedNodes).some((expandedNode) =>
          links.some(
            (link) =>
              (link.source.name === expandedNode &&
                link.target.name === node.name) ||
              (link.target.name === expandedNode &&
                link.source.name === node.name)
          )
        )
      );
    });
  }

  const colorMap = {
    Ingredient: "#fee07e",
    Taste: "#ecb5ca",
    Volume: "#f16767",
    Weight: "#ca90c0",
    Season: "#8cce91",
    Function: "#f79767",
    Technique: "#58c7e3",
    Related: "#d9c8ae",
  };

  async function fetchDataAndUpdate(flavor) {
    if (!expandedNodes.has(flavor)) {
      await expandNode(flavor);
    } else {
      collapseNode(flavor);
    }
    // Update the simulation with the new nodes and links
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    updateGraph();
  }

  function updateGraph() {
    d3.select("#forceGraph").selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3
      .select("#forceGraph")
      .attr("width", width)
      .attr("height", height);

    const zoomGroup = svg.append("g");

    const link = zoomGroup
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 0.5);

    const nodeGroup = zoomGroup
      .append("g")
      .selectAll("g.node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("dblclick", (event, d) => {
        fetchDataAndUpdate(d.name);
      });

    nodeGroup
      .append("circle")
      .attr("r", 5)
      .attr("fill", (d) => colorMap[d.nodeType] || "#fee07e");

    nodeGroup
      .append("text")
      .text((d) => d.name)
      .attr("x", 6)
      .attr("y", 3)
      .attr("font-size", "12px")
      .attr("font-family", "Arial, Helvetica, sans-serif")
      .attr("pointer-events", "none");

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    const drag = d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    nodeGroup.call(drag);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeGroup.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });
  }

  onMount(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    simulation = d3
      .forceSimulation()
      .force("link", d3.forceLink().id((d) => d.name))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));
    fetchDataAndUpdate(flavor);
  });
</script>

<input
  type="text"
  bind:value={flavor}
  placeholder="Enter flavor"
  on:input={() => fetchDataAndUpdate(flavor)}
/>
<svg id="forceGraph" />