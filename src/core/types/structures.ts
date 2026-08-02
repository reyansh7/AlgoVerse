export interface TreeNode {
  id: string;
  value: number | string;
  left?: TreeNode | null;
  right?: TreeNode | null;
  height?: number;
  balance?: number;
}

export interface ListNode {
  id: string;
  value: number | string;
  next?: string | null;
}

export interface GraphNode {
  id: string;
  label: string | number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LinkedListData {
  head: string | null;
  nodes: ListNode[];
}
