<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	// Extend the Node type definition
	interface Node {
		id: string;
		cluster: number;
		x: number;
		y: number;
		vx?: number;  // Optional vx property for velocity in x direction
		vy?: number;  // Optional vy property for velocity in y direction
	}

	// Define a type for links that ensures both source and target are Nodes or strings
	interface Link {
		source: Node | string;
		target: Node | string;
	}

	let nodes: Node[] = [];
	let links: Link[] = [];

	// Configuration for generating random clusters
	const numClusters = 20; // Total number of clusters
	const clusterRadius = 150; // Base radius for positioning nodes around the central node
	const minNodesPerCluster = 3; // Minimum number of nodes per cluster
	const maxNodesPerCluster = 20; // Maximum number of nodes per cluster

	let containerWidth: number;
	let containerHeight: number;
	let worldWidth: number;
	let worldHeight: number;

	onMount(() => {
		// Set the viewport dimensions
		containerWidth = window.innerWidth;
		containerHeight = window.innerHeight;

		// Expand the world dimensions to be significantly larger than the visible area
		worldWidth = containerWidth * 3; // Set the world width to 3 times the viewport width
		worldHeight = containerHeight * 3; // Set the world height to 3 times the viewport height

		generateRandomClusters();
		initializeGraph();
	});

	// Function to generate random clusters
	function generateRandomClusters() {
		nodes = [];
		links = [];

		for (let i = 0; i < numClusters; i++) {
			let centerX, centerY;
			let attempts = 0;
			const maxAttempts = 100;

			do {
				centerX = (Math.random() * 0.6 + 0.2) * worldWidth; // Ensure clusters are within the visible range
				centerY = (Math.random() * 0.6 + 0.2) * worldHeight; // Ensure clusters are within the visible range
				attempts++;
			} while (isTooCloseToExistingClusters(centerX, centerY) && attempts < maxAttempts);

			const clusterId = i + 1;
			const numNodes = Math.floor(Math.random() * (maxNodesPerCluster - minNodesPerCluster + 1)) + minNodesPerCluster;
			createCluster(clusterId, centerX, centerY, numNodes);
		}
	}

	// Function to check if the proposed center is too close to existing clusters
	function isTooCloseToExistingClusters(centerX: number, centerY: number): boolean {
		const minDistance = clusterRadius * 2;

		for (const node of nodes) {
			const dx = centerX - node.x;
			const dy = centerY - node.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance < minDistance) {
				return true;
			}
		}
		return false;
	}

	// Function to create a cluster
	function createCluster(clusterId: number, centerX: number, centerY: number, numNodes: number) {
		const centralNode: Node = { id: `node-${clusterId}-A`, cluster: clusterId, x: centerX, y: centerY };
		nodes.push(centralNode);

		for (let i = 0; i < numNodes; i++) {
			const angle = (2 * Math.PI / numNodes) * i;
			const distanceFromCenter = clusterRadius + numNodes * 5;
			const x = centerX + distanceFromCenter * Math.cos(angle);
			const y = centerY + distanceFromCenter * Math.sin(angle);
			const nodeId = `node-${clusterId}-${String.fromCharCode(66 + i)}`;
			const newNode: Node = { id: nodeId, cluster: clusterId, x, y };
			nodes.push(newNode);
			links.push({ source: centralNode, target: newNode });
		}
	}

	let simulation: d3.Simulation<Node, Link>;

	function initializeGraph() {
		const svg = d3
			.select<SVGSVGElement, unknown>('#splashBackgroundGraph')
			.attr('width', worldWidth)
			.attr('height', worldHeight);

		const zoomGroup = svg.append('g')
			.attr('transform', `translate(${(containerWidth - worldWidth) / 2}, ${(containerHeight - worldHeight) / 2})`);

		simulation = d3
			.forceSimulation<Node, Link>(nodes)
			.force('link', d3.forceLink<Node, Link>(links)
				.id((d: Node | string) => (typeof d === 'string' ? d : d.id))
				.distance(clusterRadius)
			)
			.force('charge', d3.forceManyBody().strength(-3).distanceMax(300)) // Further reduce repulsion for gentler motion
			.force('center', d3.forceCenter(worldWidth / 2, worldHeight / 2))
			.force('collision', d3.forceCollide<Node>()
				.radius((node) => {
					const numConnections = links.filter(link => (typeof link.source !== 'string' && (link.source as Node).id === node.id) || (typeof link.target !== 'string' && (link.target as Node).id === node.id)).length;
					return 60 + numConnections * 5;
				})
				.strength(0.3) // Reduced collision force strength even more for smoother movement
			)
			.force('cluster-repulsion', clusterRepulsionForce())
			.force('x', d3.forceX(worldWidth / 2).strength(0.0002)) // Further reduce drift forces for calmer movement
			.force('y', d3.forceY(worldHeight / 2).strength(0.0002))
			.force('random-motion', randomMotionForce())
			.alphaDecay(0)
			.on('tick', ticked);

		// Create link elements
		const link = zoomGroup
			.selectAll<SVGLineElement, Link>('line')
			.data(links)
			.enter()
			.append('line')
			.attr('stroke', '#999')
			.attr('stroke-width', 2);

		function ticked() {
			link
				.attr('x1', (d) => (typeof d.source !== 'string' ? (d.source as Node).x : nodes.find(n => n.id === d.source)?.x ?? 0))
				.attr('y1', (d) => (typeof d.source !== 'string' ? (d.source as Node).y : nodes.find(n => n.id === d.source)?.y ?? 0))
				.attr('x2', (d) => (typeof d.target !== 'string' ? (d.target as Node).x : nodes.find(n => n.id === d.target)?.x ?? 0))
				.attr('y2', (d) => (typeof d.target !== 'string' ? (d.target as Node).y : nodes.find(n => n.id === d.target)?.y ?? 0));

			nodes.forEach((node) => {
				node.vx = (node.vx ?? 0) * 0.9;
				node.vy = (node.vy ?? 0) * 0.9;
			});

			if (simulation.alpha() < 0.03) {
				simulation.alpha(0.03).restart();
			}
		}

		// Add zoom behavior
		svg.call(
			d3.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.5, 2])
				.on('zoom', (event) => {
					zoomGroup.attr('transform', event.transform);
				})
		);

		// Set initial zoom level
		const initialTransform = d3.zoomIdentity
			.translate(containerWidth / 2 - worldWidth / 2, containerHeight / 2 - worldHeight / 2)
			.scale(0.75);

		svg.transition()
			.duration(750)
			.call(
				d3.zoom<SVGSVGElement, unknown>()
					.transform,
				initialTransform
			);
	}

	// Function to create a custom repulsion force between clusters
	function clusterRepulsionForce() {
		const clusterForce = d3.forceManyBody<Node>()
			.strength(-30) // Reduced repulsion strength further for more gentle separation
			.distanceMin(150)
			.distanceMax(300);

		return () => {
			nodes.forEach((node, index) => {
				const otherClusterNodes = nodes.filter(n => n.cluster !== node.cluster);
				otherClusterNodes.forEach((otherNode) => {
					const dx = (node.x ?? 0) - (otherNode.x ?? 0);
					const dy = (node.y ?? 0) - (otherNode.y ?? 0);
					const distance = Math.sqrt((dx || 0) ** 2 + (dy || 0) ** 2);

					const forceStrength = clusterForce.strength();
					const strengthValue = typeof forceStrength === 'function'
							? forceStrength(node, index, nodes)
							: forceStrength;

					const strength = strengthValue / distance;
					if (distance < clusterForce.distanceMax()! && distance > clusterForce.distanceMin()!) {
						node.vx = (node.vx ?? 0) + (dx / distance) * strength;
						node.vy = (node.vy ?? 0) + (dy / distance) * strength;
					}
				});
			});
		};
	}

	// Function to create a random motion force for continuous movement
	function randomMotionForce() {
		return () => {
			nodes.forEach((node) => {
				node.vx = (node.vx ?? 0) + (Math.random() - 0.5) * 0.002; // Further reduce nudge for very slow motion
				node.vy = (node.vy ?? 0) + (Math.random() - 0.5) * 0.002;
			});
		};
	}
</script>

<svg id="splashBackgroundGraph" style="position: absolute; top: 0; left: 0; z-index: -1;">
	<g></g>
</svg>

<style>
	/* Styling to ensure the background graph takes up the full screen */
	svg {
		width: 100%;
		height: 100%;
	}
</style>
