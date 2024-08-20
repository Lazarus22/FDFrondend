<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { modeCurrent } from '@skeletonlabs/skeleton';
	import type { GraphNode, Link } from '../types';
	import { get } from 'svelte/store';
	import {
		activeTab,
		searchQuery,
		searchTerms,
		chipToRemove,
		graphNodes,
		graphLinks
	} from '../stores';

	let nodes: GraphNode[] = [];
	let links: Link[] = [];
	let simulation: d3.Simulation<GraphNode, undefined> | undefined;

	// Subscribe to stores
	graphNodes.subscribe((value) => (nodes = value));
	graphLinks.subscribe((value) => (links = value));

	onMount(() => {
		initializeGraph();
		initializeFromGlobalState();

		// Subscribe to modeCurrent to update the graph when the mode changes
		const unsubscribeMode = modeCurrent.subscribe((isDarkMode) => {
			updateGraph(); // Re-render the graph with the current mode's colors
		});

		const unsubscribeSearch = searchQuery.subscribe(async (flavor) => {
			if (flavor) {
				await fetchDataAndUpdate(flavor);
			}
		});

		const unsubscribeChipRemove = chipToRemove.subscribe((chip) => {
			if (chip) {
				removeChip({ detail: { chipValue: chip } });
				chipToRemove.set(null);
			}
		});

		const unsubscribeTab = activeTab.subscribe((tab) => {
			if (tab === 0) {
				initializeGraph();
				recalculateGraphFromState();
			}
		});

		return () => {
			unsubscribeMode(); // Ensure cleanup of the subscription
			unsubscribeSearch();
			unsubscribeChipRemove();
			unsubscribeTab();
		};
	});

	async function initializeFromGlobalState() {
		const terms = get(searchTerms);
		for (const term of terms) {
			await fetchDataAndUpdate(term);
		}
	}

	async function recalculateGraphFromState() {
		nodes = [];
		links = [];
		await initializeFromGlobalState(); // Re-fetch and re-calculate the graph
		updateGraph(); // Redraw the graph with the updated nodes and links
	}

	async function fetchDataAndUpdate(flavor: string) {
		const normalizedFlavor = flavor.toLowerCase();
		const res = await fetch(
			`https://fdbackend-d0a756cc3435.herokuapp.com/recommendations?flavor=${normalizedFlavor}`
		);
		const data = await res.json();

		if (data.recommendations === null) return;

		if (!nodes.some((node) => node.name === data.flavor.toLowerCase())) {
			nodes.push({ name: data.flavor.toLowerCase(), nodeType: 'Flavor', relationshipType: 'main' });
		}

		data.recommendations.forEach((rec: any) => {
			if (!nodes.some((node) => node.name === rec.name)) {
				nodes.push({
					name: rec.name,
					nodeType: rec.nodeType,
					relationshipType: rec.relationshipType
				});
			}
			if (
				!links.some(
					(link) =>
						(link.source as GraphNode).name === data.flavor.toLowerCase() &&
						(link.target as GraphNode).name === rec.name
				)
			) {
				links.push({
					source: data.flavor.toLowerCase(),
					target: rec.name,
					strength: rec.strength,
					relationshipType: rec.relationshipType
				});
			}
		});

		updateGraph();
	}

	function initializeGraph() {
		if (simulation) return; // Prevent re-initialization if already initialized

		const width = window.innerWidth;
		const height = window.innerHeight;

		simulation = d3
			.forceSimulation(nodes)
			.force(
				'link',
				d3
					.forceLink(links)
					.id((d: any) => d.name)
					.distance(100)
			)
			.force('charge', d3.forceManyBody().strength(-500))
			.force('center', d3.forceCenter(width / 2, height / 2));

		simulation.on('tick', () => {
			d3.selectAll<SVGLineElement, Link>('line.link')
				.attr('x1', (d) => (d.source as GraphNode).x ?? 0)
				.attr('y1', (d) => (d.source as GraphNode).y ?? 0)
				.attr('x2', (d) => (d.target as GraphNode).x ?? 0)
				.attr('y2', (d) => (d.target as GraphNode).y ?? 0);

			d3.selectAll<SVGGElement, GraphNode>('g.node').attr(
				'transform',
				(d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`
			);
		});
	}

	const lightModeColors = {
		node: {
			Ingredient: '#fee07e', // Light yellow
			Taste: '#ecb5ca', // Light pink
			Volume: '#f16767', // Light red
			Weight: '#ca90c0', // Light purple
			Season: '#8cce91', // Light green
			Function: '#f79767', // Light orange
			Technique: '#58c7e3', // Light blue
			Related: '#d9c8ae' // Light beige
		},
		edge: {
			1: '#ccc', // Light gray
			2: '#999', // Medium gray
			3: '#666', // Dark gray
			4: '#fff' // Black
		},
		text: '#fff' // Black text
	};

	const darkModeColors = {
		node: {
			Ingredient: '#ffd700', // Bright yellow
			Taste: '#ff69b4', // Hot pink
			Volume: '#ff4500', // Orange-red
			Weight: '#b565a7', // Deep purple
			Season: '#6b8e23', // Olive green
			Function: '#ffa500', // Bright orange
			Technique: '#1e90ff', // Dodger blue
			Related: '#cd853f' // Peru brown
		},
		edge: {
			1: '#666', // Dark gray
			2: '#444', // Darker gray
			3: '#222', // Near black
			4: '#000' // White
		},
		text: '#000' // White text
	};

	const hexagonPath = d3
		.line()
		.x((d) => d[0])
		.y((d) => d[1])
		.curve(d3.curveLinear);

	const hexagonPoints: [number, number][] = [
		[0, -5],
		[4.33, -2.5],
		[4.33, 2.5],
		[0, 5],
		[-4.33, 2.5],
		[-4.33, -2.5],
		[0, -5]
	];

	function dragStarted(event: any, d: GraphNode) {
		if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event: any, d: GraphNode) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragEnded(event: any, d: GraphNode) {
		if (!event.active && simulation) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	function updateGraph() {
		const isDarkMode = get(modeCurrent); // Get the current mode

		const currentEdgeColorMap = isDarkMode ? darkModeColors.edge : lightModeColors.edge;
		const currentNodeColorMap = isDarkMode ? darkModeColors.node : lightModeColors.node;
		const currentTextColor = isDarkMode ? darkModeColors.text : lightModeColors.text;

		const svg = d3
			.select<SVGSVGElement, unknown>('#forceGraph')
			.attr('width', window.innerWidth)
			.attr('height', window.innerHeight);

		const zoomGroup = svg.select<SVGGElement>('g');

		// Clear existing elements to force redraw with new colors
		zoomGroup.selectAll('*').remove();

		// Draw the lines (links) first
		zoomGroup
			.selectAll<SVGLineElement, Link>('line')
			.data(links, (d: any) => `${(d.source as GraphNode).name}-${(d.target as GraphNode).name}`)
			.join('line')
			.attr('class', 'link')
			.attr('stroke-width', .3)
			.attr(
				'stroke',
				(d) => currentEdgeColorMap[d.strength as keyof typeof currentEdgeColorMap] || '#ccc'
			);

		// Draw the nodes and text labels after the lines (links)
		zoomGroup
			.selectAll<SVGGElement, GraphNode>('g.node')
			.data(nodes, (d: any) => d.name)
			.join(
				(enter) => {
					const g = enter
						.append('g')
						.attr('class', 'node')
						.call(
							d3
								.drag<SVGGElement, GraphNode>()
								.on('start', dragStarted)
								.on('drag', dragged)
								.on('end', dragEnded)
						);

					g.append('path')
						.attr('d', hexagonPath(hexagonPoints)!)
						.attr(
							'fill',
							(d) =>
								currentNodeColorMap[d.nodeType as keyof typeof currentNodeColorMap] || '#fee07e'
						);

					g.append('text')
						.text((d) => d.name)
						.attr('x', 6)
						.attr('y', 3)
						.attr('font-size', '12px')
						.attr('font-family', 'Arial, Helvetica, sans-serif')
						.attr('fill', currentTextColor)
						.attr('pointer-events', 'none');

					return g;
				},
				(update) => update,
				(exit) => exit.remove()
			);

		zoomGroup.selectAll('g.node').raise();

		svg.call(
			d3
				.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.1, 10])
				.on('zoom', (event) => zoomGroup.attr('transform', event.transform))
		);

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

		nodes = nodes.filter((node) => node.name !== chip);

		const connectedNodes = links
			.filter(
				(link) =>
					(link.source as GraphNode).name === chip || (link.target as GraphNode).name === chip
			)
			.map((link) =>
				(link.source as GraphNode).name === chip
					? (link.target as GraphNode).name
					: (link.source as GraphNode).name
			);

		const uniqueNodes = connectedNodes.filter((nodeName) => {
			const connectedLinks = links.filter(
				(link) =>
					(link.source as GraphNode).name === nodeName ||
					(link.target as GraphNode).name === nodeName
			);
			return connectedLinks.length === 1; // Keep only nodes with one connection
		});

		nodes = nodes.filter((node) => !uniqueNodes.includes(node.name));
		links = links.filter(
			(link) =>
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
