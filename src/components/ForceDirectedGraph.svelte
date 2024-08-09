<script>
  import * as d3 from "d3";
  import { onMount, onDestroy } from "svelte";
  import debounce from "lodash.debounce";
  import { isDarkMode } from '../stores.js';

  let flavor = "";
  let expandedNodes = new Set();
  let nodes = [];
  let links = [];
  let simulation;
  let isDragging = false;
  let autoCompleteResults = [];
  let selectedIndex = -1;
  let originalSearch = "";
  let searchInput;
  let currentMode = 'light-mode';

  onMount(() => {
    updateGraph();
    searchInput.focus();
    const unsubscribe = isDarkMode.subscribe((value) => {
      currentMode = value ? 'dark-mode' : 'light-mode';
      updateGraph();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  });

  async function expandNode(flavor) {
    const res = await fetch(
      `https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${flavor}`
    );
    const data = await res.json();

    if (data.recommendations === null) {
      return;
    }

    if (!nodes.some((node) => node.name === data.flavor.toLowerCase())) {
      nodes.push({ name: data.flavor.toLowerCase(), nodeType: "Flavor" });
    }
    expandedNodes.add(data.flavor.toLowerCase());

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
    const normalizedFlavor = flavor.toLowerCase();
    expandedNodes.delete(normalizedFlavor);

    const linksToRemove = links.filter(
      (link) => link.source.name === flavor || link.target.name === flavor
    );

    const nodesToRemove = linksToRemove.map((link) =>
      link.source.name === flavor ? link.target.name : link.source.name
    );

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

  async function fetchDataAndUpdate(flavor) {
    const normalizedFlavor = flavor.toLowerCase();
    if (!expandedNodes.has(normalizedFlavor)) {
      await expandNode(normalizedFlavor);
    } else {
      collapseNode(normalizedFlavor);
    }
    updateGraph();
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
        .style("background-color", currentMode === 'dark-mode' ? '#333' : '#f6f7fb'); // Ensure consistent background color

    const zoomGroup = svg.append("g");

    // Adjusted color scales for light and dark modes
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


  async function fetchAutoCompleteResults(flavor) {
    if (flavor.length < 2) {
      autoCompleteResults = [];
      return;
    }

    const res = await fetch(
      `https://fdbackend-d0a756cc3435.herokuapp.com/autocomplete?prefix=${flavor}`
    );
    autoCompleteResults = await res.json();
  }

  const debounceFetchAutoCompleteResults = debounce(
    fetchAutoCompleteResults,
    200
  );

  $: if (flavor) {
    debounceFetchAutoCompleteResults(flavor);
  }

  function selectAutoCompleteResult(result) {
    flavor = result;
    fetchDataAndUpdate(flavor);
    autoCompleteResults = [];
    flavor = "";
  }

  function handleKeyUp(event) {
    if (event.key === "Enter") {
      if (selectedIndex !== -1) {
        selectAutoCompleteResult(autoCompleteResults[selectedIndex]);
      } else {
        if (flavor.toLowerCase() === "clear") {
          clearGraph();
        } else {
          fetchDataAndUpdate(flavor.toLowerCase());
        }
      }
      originalSearch = "";
      flavor = "";
      autoCompleteResults = [];
      selectedIndex = -1;
    } else {
      originalSearch = flavor;
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "ArrowDown" &&
      selectedIndex < autoCompleteResults.length - 1
    ) {
      event.preventDefault();
      selectedIndex++;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (selectedIndex > 0) {
        selectedIndex--;
      } else if (selectedIndex === 0) {
        selectedIndex = -1;
        flavor = originalSearch;
      }
    }
  }

  function clearGraph() {
    nodes.length = 0;
    links.length = 0;
    expandedNodes.clear();
    updateGraph();
    flavor = "";
  }

  window.addEventListener("resize", () => {
    updateGraph();
  });
</script>

<div id="search-container">
  <input
    type="text"
    bind:value={flavor}
    placeholder="Enter flavor"
    on:keyup={handleKeyUp}
    on:keydown={handleKeyDown}
    bind:this={searchInput}
  />

  <button on:click={clearGraph}>Clear</button>
  {#if autoCompleteResults.length}
    <ul>
      {#each autoCompleteResults as result, index}
        <li class:selected={index === selectedIndex}>
          <button
            class="autocomplete-button"
            on:click={() => selectAutoCompleteResult(result)}
            on:keyup={(event) =>
              event.key === "Enter" ? selectAutoCompleteResult(result) : null}
          >
            {result}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
<svg id="forceGraph" class="{currentMode}" />

<style>
  #search-container {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1;
  }
  #forceGraph {
    background-color: var(--graph-background-color, #f6f7fb);
  }
  :global(body),
  :global(svg) {
    margin: 0;
    padding: 0;
    transition: background-color 0.3s, color 0.3s;
  }

  :global(body.light-mode) {
    background-color: #f6f7fb;
    color: #000;
  }

  :global(body.dark-mode) {
    background-color: #333;
    color: #fff;
  }

  .autocomplete-button {
    text-align: left;
    border: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
    padding: 8px 12px;
  }

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    position: absolute;
    background-color: white;
    border: 1px solid #ddd;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    width: calc(100% - 2px);
  }

  li {
    cursor: pointer;
    width: 100%;
  }

  li:hover,
  .autocomplete-button:hover {
    background-color: #f5f5f5;
  }

  li.selected {
    background-color: #cccccc;
  }

  .dark-mode {
    --graph-background-color: #333;
  }

  .light-mode {
    --graph-background-color: #f6f7fb;
  }
</style>
