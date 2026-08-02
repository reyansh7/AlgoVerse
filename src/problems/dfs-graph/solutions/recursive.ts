import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";
import type { GraphTraversalInput } from "@/problems/bfs-graph/solutions/iterative";

function adj(g: GraphTraversalInput["graph"]) {
  const m = new Map<string, string[]>();
  for (const n of g.nodes) m.set(n.id, []);
  for (const e of g.edges) {
    m.get(e.from)?.push(e.to);
    m.get(e.to)?.push(e.from);
  }
  return m;
}

export const dfsRecursive: ReferenceSolution<GraphTraversalInput> = {
  id: "dfs-recursive",
  name: "DFS (Recursive)",
  approach: "recursive",
  timeComplexity: "O(V + E)",
  spaceComplexity: "O(V)",
  code: `function dfs(node) {
  visited.add(node);
  for (const next of neighbors(node)) {
    if (!visited.has(next)) dfs(next);
  }
}`,
  execute({ graph, start }) {
    const r = new EventRecorder("dfs-recursive");
    const g = {
      nodes: graph.nodes.map((n) => ({ ...n })),
      edges: graph.edges.map((e) => ({ ...e })),
    };
    const neighbors = adj(g);
    const visited = new Set<string>();
    r.setStructure({ graph: g, stack: [] }, { description: `DFS from ${start}.` });

    function dfs(node: string, depth: number) {
      visited.add(node);
      r.push(node, { description: `Enter ${node} (depth ${depth}).` });
      r.setStructure({ graph: g, stack: [...visited] });
      r.visitNode(node, undefined, {
        line: 1,
        description: `Visit ${node}.`,
      });
      r.updateVariable("depth", depth);

      for (const next of neighbors.get(node) ?? []) {
        const edge = g.edges.find(
          (e) =>
            (e.from === node && e.to === next) ||
            (e.from === next && e.to === node),
        );
        if (!visited.has(next)) {
          r.visitNode(next, edge?.id, {
            description: `Recurse ${node} → ${next}.`,
          });
          dfs(next, depth + 1);
        }
      }
      r.pop(node, { description: `Backtrack from ${node}.` });
    }

    dfs(start, 0);
    r.done([...visited]);
    return r.getEvents();
  },
};

export const dfsIterative: ReferenceSolution<GraphTraversalInput> = {
  id: "dfs-iterative",
  name: "DFS (Iterative Stack)",
  approach: "iterative",
  timeComplexity: "O(V + E)",
  spaceComplexity: "O(V)",
  code: `function dfs(start) {
  const stack = [start];
  const visited = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of neighbors(node)) stack.push(next);
  }
}`,
  execute({ graph, start }) {
    const r = new EventRecorder("dfs-iterative");
    const g = {
      nodes: graph.nodes.map((n) => ({ ...n })),
      edges: graph.edges.map((e) => ({ ...e })),
    };
    const neighbors = adj(g);
    const visited = new Set<string>();
    const stack: string[] = [start];
    r.setStructure({ graph: g, stack: [...stack] }, { description: `Iterative DFS from ${start}.` });
    r.push(start);

    while (stack.length) {
      const node = stack.pop()!;
      r.pop(node, { description: `Pop ${node}.` });
      r.setStructure({ graph: g, stack: [...stack] });
      if (visited.has(node)) continue;
      visited.add(node);
      r.visitNode(node, undefined, { description: `Visit ${node}.` });
      const neigh = [...(neighbors.get(node) ?? [])].reverse();
      for (const next of neigh) {
        if (!visited.has(next)) {
          stack.push(next);
          r.push(next, { description: `Push ${next}.` });
          r.setStructure({ graph: g, stack: [...stack] });
        }
      }
    }
    r.done([...visited]);
    return r.getEvents();
  },
};
