import type { GraphData } from "../../types/structures";

export interface GraphTraversalInput {
  graph: GraphData;
  start: string;
}

export function cloneGraph(graph: GraphData): GraphData {
  return {
    nodes: graph.nodes.map((n) => ({ ...n })),
    edges: graph.edges.map((e) => ({ ...e })),
  };
}

export function adjacencyList(graph: GraphData): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const n of graph.nodes) map.set(n.id, []);
  for (const e of graph.edges) {
    map.get(e.from)?.push(e.to);
    if (!e.directed) map.get(e.to)?.push(e.from);
  }
  return map;
}

export function edgeId(from: string, to: string, graph: GraphData): string | null {
  const edge = graph.edges.find(
    (e) =>
      (e.from === from && e.to === to) ||
      (!e.directed && e.from === to && e.to === from),
  );
  return edge?.id ?? null;
}

/** Default undirected demo graph with layout positions. */
export function defaultDemoGraph(): GraphData {
  return {
    nodes: [
      { id: "A", label: "A", x: 0, y: -2 },
      { id: "B", label: "B", x: -2, y: 0 },
      { id: "C", label: "C", x: 2, y: 0 },
      { id: "D", label: "D", x: -3, y: 2 },
      { id: "E", label: "E", x: -1, y: 2 },
      { id: "F", label: "F", x: 1, y: 2 },
      { id: "G", label: "G", x: 3, y: 2 },
    ],
    edges: [
      { id: "A-B", from: "A", to: "B", weight: 2 },
      { id: "A-C", from: "A", to: "C", weight: 4 },
      { id: "B-D", from: "B", to: "D", weight: 3 },
      { id: "B-E", from: "B", to: "E", weight: 1 },
      { id: "C-F", from: "C", to: "F", weight: 2 },
      { id: "C-G", from: "C", to: "G", weight: 5 },
      { id: "E-F", from: "E", to: "F", weight: 3 },
    ],
  };
}
