<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { searchQuery, searchResultsMap, searchTerms, isDarkMode } from '../stores.js';

  let nodes = [];
  let links = [];
  let simulation;
  let isDragging = false;
  let currentMode = 'light-mode';

  onMount(() => {
    // Initialize nodes and links from the global search state
    initializeFromGlobalState();

    const unsubscribeSearch = searchQuery.subscribe(async (flavor) => {
      if (flavor) {
        await fetchDataAndUpdate(flavor);  // Trigger data fetching and graph update
      }
    });

    const unsubscribeSearchResults = searchResultsMap.subscribe(map => {
      if (map.size === 0) {
        clearGraph();  // Clear the graph when the search results are cleared
      }
    });

    const unsubscribeMode = isDarkMode.subscribe(value => {
      currentMode = value ? 'dark-mode' : 'light-mode';
      updateGraph();  // Update graph colors when mode changes
    });

    return () => {
      unsubscribeSearch();
      unsubscribeSearchResults();
      unsubscribeMode();
    };
  });

  async function initializeFromGlobalState() {
    const terms = $searchTerms;
    for (const term of terms) {
      await fetchDataAndUpdate(term);
    }
  }

  async function fetchDataAndUpdate(flavor) {
    const normalizedFlavor = flavor.toLowerCase();
    const res = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${normalizedFlavor}`);
    const data = await res.json();

    if (data.recommendations === null) {
      return;
    }

    if (!nodes.some(node => node.name === data.flavor.toLowerCase())) {
      nodes.push({ name: data.flavor.toLowerCase(), nodeType: "Flavor" });
    }

    data.recommendations.forEach(rec => {
      if (!nodes.some(node => node.name === rec.name)) {
        nodes.push({ name: rec.name, nodeType: rec.nodeType });
      }
      if (!links.some(link => link.source === data.flavor.toLowerCase() && link.target === rec.name)) {
        links.push({
          source: data.flavor.toLowerCase(),
          target: rec.name,
          strength: rec.strength,
          relationshipType: rec.relationshipType,
        });
      }
    });

    // Persist the data back to the global store
    searchResultsMap.update(map => {
      map.set(flavor, [...(map.get(flavor) || []), ...data.recommendations.map(r => r.name)]);
      return map;
    });

    searchTerms.update(terms => {
      if (!terms.includes(flavor)) terms.push(flavor);
      return terms;
    });

    updateGraph();  // Re-render the graph with the new data
  }

  function clearGraph() {
    nodes = [];
    links = [];
    updateGraph(); // Re-render the graph to reflect the cleared state
  }

  function updateGraph() {
    d3.select("#forceGraph").selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;

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

    const svg = d3
      .select("#forceGraph")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", currentMode)
      .style("background-color", currentMode === 'dark-mode' ? '#333' : '#f6f7fb'); 

    const zoomGroup = svg.append("g");

    const colorScaleLight = d3.scaleLinear().domain([1, 4]).range(["#ccc", "#000"]);
    const colorScaleDark = d3.scaleLinear().domain([1, 4]).range(["#666", "#fff"]);

    const colorScale = currentMode === 'dark-mode' ? colorScaleDark : colorScaleLight;

    if (!simulation) {
      simulation = d3
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
    } else {
      simulation.nodes(nodes);
      simulation.force("link").links(links);
    }

    simulation.alpha(1).restart();

    const link = zoomGroup
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => colorScale(d.strength))
      .attr("stroke-width", 1);

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
      .attr("pointer-events", "none")
      .attr("fill", currentMode === 'dark-mode' ? 'white' : 'black');

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        if (!isDragging) {
          const currentZoomScale = event.transform.k;
          zoomGroup.attr("transform", event.transform);

          if (currentZoomScale < 0.7) {
            zoomGroup.selectAll("text").style("display", "none");
          } else {
            zoomGroup.selectAll("text").style("display", "block");
          }
        }
      });

    function dragstarted(event, d) {
      isDragging = true;
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      isDragging = false;
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const drag = d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    nodeGroup.call(drag);

    svg.call(zoom).on("dblclick.zoom", null);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeGroup.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });
  }
</script>

<svg id="forceGraph" class="{currentMode}" />

<style>
  #forceGraph {
    background-color: var(--graph-background-color, #f6f7fb);
  }
</style>
