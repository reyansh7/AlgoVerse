import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import {
  adjacencyList,
  cloneGraph,
  edgeId,
  type GraphTraversalInput,
} from "./graph-utils";

export const bfsAdapter: AlgorithmAdapter<GraphTraversalInput> = {
  id: "bfs",
  execute({ graph, start }) {
    const b = new SnapshotBuilder("bfs");
    const g = cloneGraph(graph);
    const adj = adjacencyList(g);
    const visited = new Set<string>();
    const visitedEdges: string[] = [];
    const queue: string[] = [start];
    visited.add(start);

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
          queue: [...queue],
          visited: [...visited],
          visitedEdges: [...visitedEdges],
          ...vars,
        },
        structures: { graph: g, queue: [...queue] },
        highlights: {
          nodes: current ? [current] : [...visited],
          edges: currentEdges.length ? currentEdges : [...visitedEdges],
          indices: [],
        },
        operation,
        description,
      });
    };

    snap(0, "init", `Enqueue start node ${start}.`, start, [], {
      current: start,
    });

    while (queue.length > 0) {
      const node = queue.shift()!;
      snap(3, "dequeue", `Dequeue node ${node}.`, node, [], { current: node });
      snap(4, "visit", `Visit node ${node}.`, node, [], { current: node });

      for (const neighbor of adj.get(node) ?? []) {
        const eid = edgeId(node, neighbor, g);
        const edgeList = eid ? [eid] : [];
        snap(
          5,
          "explore",
          `Explore edge ${node} → ${neighbor}.`,
          neighbor,
          edgeList,
          { current: node, neighbor },
        );

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          if (eid) visitedEdges.push(eid);
          queue.push(neighbor);
          snap(
            6,
            "enqueue",
            `Enqueue unvisited neighbor ${neighbor}.`,
            neighbor,
            edgeList,
            { current: node, neighbor },
          );
        }
      }
    }

    snap(
      8,
      "done",
      "BFS traversal complete — all reachable nodes visited.",
      null,
      [...visitedEdges],
    );

    return b.build();
  },
};
