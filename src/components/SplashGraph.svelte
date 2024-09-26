<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Node {
		id: string;
		cluster: number;
		x: number;
		y: number;
		vx?: number;
		vy?: number;
	}

	interface Link {
		source: Node | string;
		target: Node | string;
	}

	let nodes: Node[] = [];
	let links: Link[] = [];

	const numClusters = 20;
	const clusterRadius = 150;
	const minNodesPerCluster = 3;
	const maxNodesPerCluster = 20;

	const worldSize = 3000; // Fixed world size (width and height)

	let containerWidth: number;
	let containerHeight: number;

	onMount(() => {
		containerWidth = window.innerWidth;
		containerHeight = window.innerHeight;

		generateRandomClusters();
		initializeGraph();
	});

	function generateRandomClusters() {
		nodes = [];
		links = [];

		for (let i = 0; i < numClusters; i++) {
			let centerX, centerY;
			let attempts = 0;
			const maxAttempts = 100;

			do {
				centerX = Math.random() * worldSize - worldSize / 2;
				centerY = Math.random() * worldSize - worldSize / 2;
				attempts++;
			} while (isTooCloseToExistingClusters(centerX, centerY) && attempts < maxAttempts);

			const clusterId = i + 1;
			const numNodes =
				Math.floor(Math.random() * (maxNodesPerCluster - minNodesPerCluster + 1)) +
				minNodesPerCluster;
			createCluster(clusterId, centerX, centerY, numNodes);
		}
	}

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

	function createCluster(clusterId: number, centerX: number, centerY: number, numNodes: number) {
		const centralNode: Node = {
			id: `node-${clusterId}-A`,
			cluster: clusterId,
			x: centerX,
			y: centerY
		};
		nodes.push(centralNode);

		for (let i = 0; i < numNodes; i++) {
			const angle = ((2 * Math.PI) / numNodes) * i;
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
			.attr('width', containerWidth)
			.attr('height', containerHeight);

		const zoomGroup = svg.append('g');

		// Introduce a gentler wind-like force by reducing the strength
		function windForce() {
			const windStrength = 0.0005; // Smaller value for more subtle movement
			const windDirectionX = 0.05; // Lower horizontal wind effect
			const windDirectionY = 0.025; // Lower vertical wind effect

			nodes.forEach((node) => {
				node.vx = (node.vx ?? 0) + windStrength * windDirectionX;
				node.vy = (node.vy ?? 0) + windStrength * windDirectionY;
			});
		}


		simulation = d3
			.forceSimulation<Node, Link>(nodes)
			.force(
				'link',
				d3
					.forceLink<Node, Link>(links)
					.id((d: Node | string) => (typeof d === 'string' ? d : d.id))
					.distance(clusterRadius) // Set a fixed distance
					.strength(1) // Make link force strong enough to maintain the distance
			)
			.force('charge', d3.forceManyBody().strength(-5).distanceMax(500)) // Even less aggressive repulsion
			.force('center', d3.forceCenter(0, 0)) // Center force at (0, 0)
			.force(
				'collision',
				d3
					.forceCollide<Node>()
					.radius(clusterRadius + 20) // Set collision radius slightly larger than cluster radius
					.strength(0.05) // Lower strength for gentler collisions
			)
			.force('x', d3.forceX().strength(0.00005))
			.force('y', d3.forceY().strength(0.00005))
			.force('wind', windForce) // Apply the gentler wind-like force
			.alpha(0.2)
			.alphaDecay(0.005) // Slower decay for gentle continuous movement
			.alphaTarget(0.02) // Lower target alpha for subtler movement
			.on('tick', ticked);

		const link = zoomGroup
			.selectAll<SVGLineElement, Link>('line')
			.data(links)
			.enter()
			.append('line')
			.attr('stroke', '#999')
			.attr('stroke-width', 2);

		function ticked() {
			link
				.attr('x1', (d) =>
					typeof d.source !== 'string'
						? (d.source as Node).x
						: (nodes.find((n) => n.id === d.source)?.x ?? 0)
				)
				.attr('y1', (d) =>
					typeof d.source !== 'string'
						? (d.source as Node).y
						: (nodes.find((n) => n.id === d.source)?.y ?? 0)
				)
				.attr('x2', (d) =>
					typeof d.target !== 'string'
						? (d.target as Node).x
						: (nodes.find((n) => n.id === d.target)?.x ?? 0)
				)
				.attr('y2', (d) =>
					typeof d.target !== 'string'
						? (d.target as Node).y
						: (nodes.find((n) => n.id === d.target)?.y ?? 0)
				);
		}

		svg.call(
			d3
				.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.5, 2])
				.on('zoom', (event) => {
					zoomGroup.attr('transform', event.transform);
				})
		);

		const initialTransform = d3.zoomIdentity
			.translate(containerWidth / 2, containerHeight / 2)
			.scale(0.75);

		svg
			.transition()
			.duration(750)
			.call(d3.zoom<SVGSVGElement, unknown>().transform, initialTransform);
	}
</script>

<svg id="splashBackgroundGraph" style="position: absolute; top: 0; left: 0; z-index: -1;">
	<g></g>
</svg>

<style>
	svg {
		width: 100%;
		height: 100%;
	}
</style>
