<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let flavor = "";

  async function fetchDataAndUpdate(flavor) {
    const res = await fetch(
      `https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`
    );
    const data = await res.json();
    updateGraph(data);
  }

  function updateGraph(data) {
    d3.select("#forceGraph").selectAll("*").remove();

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

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3
      .select("#forceGraph")
      .attr("width", width)
      .attr("height", height);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
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
      .attr("stroke", "#999")
      .attr("stroke-width", (d) => d.strength);

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
        if (!clickedOnce) {
          svg.selectAll("g").attr("transform", event.transform);
        }
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
