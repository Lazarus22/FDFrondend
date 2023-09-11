<script>
  import * as d3 from "d3";
  import { flavors } from "../stores";

  let height;

  $: flavors.subscribe(async (currentFlavors) => {
    if (currentFlavors && currentFlavors.length > 0) {
      const flavor = currentFlavors[0];
      await fetchData(flavor);
    }
  });

  async function fetchData(flavor) {
    try {
      const res = await fetch(
        `https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`
      );
      const data = await res.json();
      if (data && data.recommendations) {
        renderVisualization(data);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  }

  function renderVisualization(data) {
    const flavor = data.flavor;
  
    // Create an initial nodes array with the flavor node
    const initialNodes = [{ id: flavor, nodeType: 'Flavor' }];
  
    // Create the links and enrich nodes array with the target nodes
    const links = [];
    data.recommendations.forEach((recommendation) => {
      const targetNode = {
        id: recommendation.name,
        nodeType: recommendation.nodeType,
      };
      links.push({
        source: initialNodes[0], // reference to the exact 'flavor' node object
        target: targetNode, // reference to the new target node object
        value: 1,
      });
      initialNodes.push(targetNode); // add the new node to the nodes array
    });

    const nodes = Array.from(
      new Set(links.flatMap((l) => [l.source, l.target])),
      (id) => ({
        id,
        nodeType: links.find(l => l.target === id)?.nodeType // enrich node with nodeType
      })
    );
    const dynamicLinkDistance = Math.sqrt(nodes.length) * 10;
    const dynamicCharge = -Math.sqrt(nodes.length) * 60;

    const svg = d3
      .select("#visualization")
      .html("")
      .append("svg")
      .attr("width", "100%")
      .attr("height", height);

    const container = svg.append("g");
    const width = window.innerWidth;

    // Add zoom functionality
    svg.call(
      d3.zoom().on("zoom", (event) => {
        container.attr("transform", event.transform);
      })
    );

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(dynamicLinkDistance)
      )
      .force("charge", d3.forceManyBody().strength(dynamicCharge))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = container
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

      const node = container
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", (d) => d.nodeType)  // Add class for styling
      .call(d3.drag().on("start", dragstarted).on("drag", dragged));

      node.append("circle")
      .attr("r", 5)
      .attr("fill", (d) => (d.nodeType === "Ingredient" ? "#6699cc" : "#cc9966"));
      node
      .append("text")
      .attr("stroke", "none")
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text((d) => `${d.id} (${d.nodeType})`);  // Display both 'id' and 'nodeType'

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
  }
</script>

<div id="visualization" />
