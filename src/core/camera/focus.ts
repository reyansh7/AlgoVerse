import type { GraphData } from "../types/structures";

export interface FocusTarget {
  x: number;
  y: number;
  z: number;
  distance: number;
}

/** Compute a cinematic camera focus from highlighted graph nodes. */
export function focusFromGraph(
  graph: GraphData | undefined,
  nodeIds: string[],
): FocusTarget | null {
  if (!graph || nodeIds.length === 0) return null;
  const nodes = graph.nodes.filter((n) => nodeIds.includes(n.id));
  if (nodes.length === 0) return null;

  const cx =
    nodes.reduce((s, n) => s + (n.x ?? 0), 0) / nodes.length;
  const cy =
    nodes.reduce((s, n) => s + (n.y ?? 0), 0) / nodes.length;

  return {
    x: cx * 0.08,
    y: -cy * 0.08,
    z: 0,
    distance: 6 + nodes.length * 0.4,
  };
}
