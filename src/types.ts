export interface GraphNode {
	name: string;
	nodeType: string;
	relationshipType: string;
	x?: number;
	y?: number;
	fx?: number | null; // Added for D3 dragging
	fy?: number | null; // Added for D3 dragging
}

export interface Link {
	source: string | GraphNode;
	target: string | GraphNode;
	strength: number;
	relationshipType: string;
}
