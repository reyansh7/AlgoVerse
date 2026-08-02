import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { cloneGraph, type GraphTraversalInput } from "./graph-utils";

export const dijkstraAdapter: AlgorithmAdapter<GraphTraversalInput> = {
  id: "dijkstra",
  execute({ graph, start }) {
    const b = new SnapshotBuilder("dijkstra");
    const g = cloneGraph(graph);
    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const unvisited = new Set(g.nodes.map((n) => n.id));

    for (const n of g.nodes) {
      dist.set(n.id, Infinity);
      prev.set(n.id, null);
    }
    dist.set(start, 0);

    const distObj = () =>
      Object.fromEntries(
        [...dist.entries()].map(([k, v]) => [k, v === Infinity ? "∞" : v]),
      );
    const visitedList = () =>
      g.nodes.map((n) => n.id).filter((id) => !unvisited.has(id));

    b.emit({
      line: 0,
      variables: { start, dist: distObj(), visited: visitedList() },
      structures: { graph: g },
      highlights: { nodes: [start], edges: [], indices: [] },
      operation: "init",
      description: `Initialize distances from ${start}.`,
    });

    while (unvisited.size > 0) {
      let u: string | null = null;
      let best = Infinity;
      for (const id of unvisited) {
        const d = dist.get(id) ?? Infinity;
        if (d < best) {
          best = d;
          u = id;
        }
      }
      if (u === null || best === Infinity) break;

      unvisited.delete(u);
      b.emit({
        line: 2,
        variables: { current: u, dist: distObj(), visited: visitedList() },
        structures: { graph: g },
        highlights: { nodes: [u], edges: [], indices: [] },
        operation: "visit",
        description: `Select closest unvisited node ${u} (dist ${best}).`,
      });

      const outs = g.edges.filter(
        (e) =>
          e.from === u ||
          (!e.directed && e.to === u),
      );

      for (const e of outs) {
        const v = e.from === u ? e.to : e.from;
        if (!unvisited.has(v)) continue;
        const weight = e.weight ?? 1;
        const alt = (dist.get(u) ?? Infinity) + weight;

        b.emit({
          line: 4,
          variables: {
            current: u,
            neighbor: v,
            weight,
            alt,
            dist: distObj(),
            visited: visitedList(),
          },
          structures: { graph: g },
          highlights: { nodes: [u, v], edges: [e.id], indices: [] },
          operation: "relax",
          description: `Relax edge ${u} → ${v} with weight ${weight}.`,
        });

        if (alt < (dist.get(v) ?? Infinity)) {
          dist.set(v, alt);
          prev.set(v, u);
          b.emit({
            line: 5,
            variables: {
              current: u,
              neighbor: v,
              dist: distObj(),
              visited: visitedList(),
            },
            structures: { graph: g },
            highlights: { nodes: [v], edges: [e.id], indices: [] },
            operation: "update",
            description: `Update distance of ${v} to ${alt}.`,
          });
        }
      }
    }

    // Illuminate the shortest-path tree built from the predecessor map
    const pathNodes = [...dist.keys()].filter((id) => dist.get(id) !== Infinity);
    const pathEdges: string[] = [];
    for (const [node, parent] of prev.entries()) {
      if (!parent) continue;
      const edge = g.edges.find(
        (e) =>
          (e.from === parent && e.to === node) ||
          (!e.directed && e.from === node && e.to === parent),
      );
      if (edge) pathEdges.push(edge.id);
    }

    b.emit({
      line: 7,
      variables: { dist: distObj(), visited: visitedList(), pathNodes },
      structures: { graph: g },
      highlights: { nodes: pathNodes, edges: pathEdges, indices: [] },
      operation: "done",
      description: "Dijkstra complete — shortest path tree highlighted.",
    });

    return b.build();
  },
};
