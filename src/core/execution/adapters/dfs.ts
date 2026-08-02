import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import {
  adjacencyList,
  cloneGraph,
  edgeId,
  type GraphTraversalInput,
} from "./graph-utils";

export const dfsAdapter: AlgorithmAdapter<GraphTraversalInput> = {
  id: "dfs",
  execute({ graph, start }) {
    const b = new SnapshotBuilder("dfs");
    const g = cloneGraph(graph);
    const adj = adjacencyList(g);
    const visited = new Set<string>();
    const visitedEdges: string[] = [];
    const stack: string[] = [];

    const snap = (
      line: number,
      operation: string,
      description: string,
      current: string | null,
      currentEdges: string[],
      vars: Record<string, unknown> = {},
    ) => {
      b.emit({
        line,
        variables: {
          start,
          stack: [...stack],
          visited: [...visited],
          visitedEdges: [...visitedEdges],
          ...vars,
        },
        structures: { graph: g, stack: [...stack] },
        highlights: {
          nodes: current ? [current] : [...visited],
          edges: currentEdges.length ? currentEdges : [...visitedEdges],
          indices: [],
        },
        operation,
        description,
      });
    };

    function dfs(node: string, via: string | null) {
      stack.push(node);
      visited.add(node);
      const eid = via ? edgeId(via, node, g) : null;
      if (eid) visitedEdges.push(eid);

      snap(
        1,
        "call",
        `Recursive DFS call on ${node}.`,
        node,
        eid ? [eid] : [],
        { current: node },
      );
      snap(2, "visit", `Mark ${node} visited.`, node, [], { current: node });

      for (const neighbor of adj.get(node) ?? []) {
        const exploreId = edgeId(node, neighbor, g);
        snap(
          3,
          "explore",
          `Explore edge ${node} → ${neighbor}.`,
          neighbor,
          exploreId ? [exploreId] : [],
          { current: node, neighbor },
        );

        if (!visited.has(neighbor)) {
          dfs(neighbor, node);
        }
      }

      stack.pop();
      snap(5, "backtrack", `Backtrack from ${node}.`, node, [], {
        current: node,
      });
    }

    snap(0, "init", `Begin DFS from ${start}.`, start, []);
    dfs(start, null);
    snap(
      6,
      "done",
      "DFS traversal complete — all reachable nodes visited.",
      null,
      [...visitedEdges],
    );

    return b.build();
  },
};
