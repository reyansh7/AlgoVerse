import { EventRecorder } from "@/engine/events/recorder";
import type { GraphData } from "@/core/types/structures";
import type { ReferenceSolution } from "@/problems/types";

export interface GraphTraversalInput {
  graph: GraphData;
  start: string;
}

function adj(g: GraphData) {
  const m = new Map<string, string[]>();
  for (const n of g.nodes) m.set(n.id, []);
  for (const e of g.edges) {
    m.get(e.from)?.push(e.to);
    m.get(e.to)?.push(e.from);
  }
  return m;
}

export const bfsIterative: ReferenceSolution<GraphTraversalInput> = {
  id: "bfs-iterative",
  name: "BFS (Queue)",
  approach: "iterative",
  timeComplexity: "O(V + E)",
  spaceComplexity: "O(V)",
  code: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of neighbors(node)) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
}`,
  execute({ graph, start }) {
    const r = new EventRecorder("bfs-iterative");
    const g = {
      nodes: graph.nodes.map((n) => ({ ...n })),
      edges: graph.edges.map((e) => ({ ...e })),
    };
    const neighbors = adj(g);
    const visited = new Set<string>([start]);
    const queue: string[] = [start];

    r.setStructure(
      { graph: g, queue: [...queue] },
      { description: `BFS from ${start}. Enqueue start.` },
    );
    r.visitNode(start, undefined, { description: `Mark ${start} visited.` });

    while (queue.length) {
      const node = queue.shift()!;
      r.setStructure(
        { graph: g, queue: [...queue] },
        { description: `Dequeue ${node}.` },
      );
      r.visitNode(node, undefined, { description: `Visit ${node}.` });

      for (const next of neighbors.get(node) ?? []) {
        const edge = g.edges.find(
          (e) =>
            (e.from === node && e.to === next) ||
            (e.from === next && e.to === node),
        );
        r.describe(`Explore ${node} → ${next}.`, { line: 5 });
        if (edge) r.highlight({ edges: [edge.id], nodes: [node, next] });
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
          r.setStructure(
            { graph: g, queue: [...queue] },
            { description: `Enqueue ${next}.` },
          );
          r.visitNode(next, edge?.id, { description: `Discover ${next}.` });
        }
      }
    }
    r.done([...visited]);
    return r.getEvents();
  },
};
