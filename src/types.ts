// types.ts
export interface GraphNode {
  name: string;
  nodeType: string;
  relationshipType: string;
  x?: number;
  y?: number;
}

export interface Link {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  relationshipType: string;
}
