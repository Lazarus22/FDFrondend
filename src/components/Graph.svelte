<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { GraphNode, Link } from '../types';
  import { get } from 'svelte/store';
  import { searchQuery, searchTerms, chipToRemove, graphNodes, graphLinks } from '../stores';

  let nodes: GraphNode[] = [];
  let links: Link[] = [];
  let simulation: d3.Simulation<GraphNode, undefined> | undefined;

  // Subscribe to stores
  graphNodes.subscribe(value => nodes = value);
  graphLinks.subscribe(value => links = value);

  // Define the color map based on nodeType and edge strength
  const colorMap: { [key: string]: string } = {
    Ingredient: "#fee07e",
    Taste: "#ecb5ca",
    Volume: "#f16767",
    Weight: "#ca90c0",
    Season: "#8cce91",
    Function: "#f79767",
    Technique: "#58c7e3",
    Related: "#d9c8ae"
  };

  const edgeColorMap: { [key: number]: string } = {
    1: "#ccc",  // Light gray
    2: "#999",  // Medium gray
    3: "#666",  // Darker gray
    4: "#000"   // Black
  };

  onMount(() => {
    initializeGraph();
    initializeFromGlobalState();

    const unsubscribeSearch = searchQuery.subscribe(async (flavor) => {
      if (flavor) {
        await fetchDataAndUpdate(flavor);
      }
    });

    const unsubscribeChipRemove = chipToRemove.subscribe(chip => {
      if (chip) {
        removeChip({ detail: { chipValue: chip } });
        chipToRemove.set(null); // Clear the store after handling
      }
    });

    return () => {
      unsubscribeSearch();
      unsubscribeChipRemove();
    };
  });

  async function initializeFromGlobalState() {
    const terms = get(searchTerms);
    for (const term of terms) {
      await fetchDataAndUpdate(term);
    }
  }

  async function fetchDataAndUpdate(flavor: string) {
    const normalizedFlavor = flavor.toLowerCase();
    const res = await fetch(`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${normalizedFlavor}`);
    const data = await res.json();

    if (data.recommendations === null) return;

    if (!nodes.some(node => node.name === data.flavor.toLowerCase())) {
      nodes.push({ name: data.flavor.toLowerCase(), nodeType: "Flavor", relationshipType: "main" });
    }

    data.recommendations.forEach((rec: any) => {
      if (!nodes.some(node => node.name === rec.name)) {
        nodes.push({ name: rec.name, nodeType: rec.nodeType, relationshipType: rec.relationshipType });
      }
      if (!links.some(link => (link.source as GraphNode).name === data.flavor.toLowerCase() && (link.target as GraphNode).name === rec.name)) {
        links.push({
          source: data.flavor.toLowerCase(),
          target: rec.name,
          strength: rec.strength,
          relationshipType: rec.relationshipType,
        });
      }
    });

    updateGraph();
  }

  function initializeGraph() {
    if (simulation) return; // Prevent re-initialization if already initialized

    const width = window.innerWidth;
    const height = window.innerHeight;

    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.name).distance(100))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2));

    simulation.on('tick', () => {
      d3.selectAll<SVGLineElement, Link>('line.link')
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0);

      d3.selectAll<SVGGElement, GraphNode>('g.node')
        .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });
  }

  function updateGraph() {
    // Persist nodes and links to the store
    graphNodes.set(nodes);
    graphLinks.set(links);

    const svg = d3.select<SVGSVGElement, unknown>("#forceGraph")
      .attr("width", window.innerWidth)
      .attr("height", window.innerHeight);
    const zoomGroup = svg.select<SVGGElement>("g");

    zoomGroup.selectAll<SVGLineElement, Link>("line")
      .data(links, (d: any) => `${(d.source as GraphNode).name}-${(d.target as GraphNode).name}`)
      .join("line")
      .attr("class", "link")
      .attr("stroke-width", 1)  // Keep the stroke width consistent
      .attr("stroke", (d) => edgeColorMap[d.strength] || "#ccc");  // Apply color based on strength

    const nodeGroup = zoomGroup.selectAll<SVGGElement, GraphNode>("g.node")
      .data(nodes, (d: any) => d.name)
      .join(
        enter => {
          const g = enter.append("g").attr("class", "node");

          g.append("circle")
            .attr("r", 5)
            .attr("fill", (d) => colorMap[d.nodeType as keyof typeof colorMap] || "#fee07e"); // Apply color based on nodeType

          g.append("text")
            .text(d => d.name)
            .attr("x", 6)
            .attr("y", 3)
            .attr("font-size", "12px")
            .attr("font-family", "Arial, Helvetica, sans-serif")
            .attr("pointer-events", "none");

          return g;
        },
        update => update,
        exit => exit.remove()
      );

    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 10]).on("zoom", event => zoomGroup.attr("transform", event.transform)));

    if (simulation) {
      simulation.nodes(nodes);
      const linkForce = simulation.force<d3.ForceLink<GraphNode, Link>>('link');
      if (linkForce) {
        linkForce.links(links);
      }
      simulation.alpha(1).restart();
    }
  }

  function removeChip(event: { detail: { chipValue: string } }) {
    const chip = event.detail.chipValue;

    nodes = nodes.filter(node => node.name !== chip);

    const connectedNodes = links
      .filter(link => (link.source as GraphNode).name === chip || (link.target as GraphNode).name === chip)
      .map(link => (link.source as GraphNode).name === chip ? (link.target as GraphNode).name : (link.source as GraphNode).name);

    const uniqueNodes = connectedNodes.filter(nodeName => {
      const connectedLinks = links.filter(link => (link.source as GraphNode).name === nodeName || (link.target as GraphNode).name === nodeName);
      return connectedLinks.length === 1; // Keep only nodes with one connection
    });

    nodes = nodes.filter(node => !uniqueNodes.includes(node.name));
    links = links.filter(link => 
      (link.source as GraphNode).name !== chip && 
      (link.target as GraphNode).name !== chip && 
      !uniqueNodes.includes((link.source as GraphNode).name) && 
      !uniqueNodes.includes((link.target as GraphNode).name)
    );

    updateGraph();
  }
</script>

<svg id="forceGraph">
  <g></g>
</svg>
