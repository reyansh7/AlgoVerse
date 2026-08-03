/**
 * LEGACY Playground registry — snapshot adapters that emit ExecutionState[] directly.
 *
 * Do NOT add new adapters here. New algorithms should emit Trace v0.1 events
 * (see packages/trace + sdk/python) or Learn ReferenceSolution EventRecorder paths.
 */
import type { AlgorithmAdapter } from "../types/execution";
import { binarySearchAdapter } from "./adapters/binary-search";
import { linearSearchAdapter } from "./adapters/linear-search";
import { bubbleSortAdapter } from "./adapters/bubble-sort";
import { selectionSortAdapter } from "./adapters/selection-sort";
import { insertionSortAdapter } from "./adapters/insertion-sort";
import { mergeSortAdapter } from "./adapters/merge-sort";
import { quickSortAdapter } from "./adapters/quick-sort";
import { bfsAdapter } from "./adapters/bfs";
import { dfsAdapter } from "./adapters/dfs";
import { dijkstraAdapter } from "./adapters/dijkstra";
import { linkedListAdapter } from "./adapters/linked-list";
import { bstInsertAdapter } from "./adapters/bst-insert";
import { knapsackAdapter } from "./adapters/knapsack";

const adapters: AlgorithmAdapter[] = [
  binarySearchAdapter,
  linearSearchAdapter,
  bubbleSortAdapter,
  selectionSortAdapter,
  insertionSortAdapter,
  mergeSortAdapter,
  quickSortAdapter,
  bfsAdapter,
  dfsAdapter,
  dijkstraAdapter,
  linkedListAdapter,
  bstInsertAdapter,
  knapsackAdapter,
];

const byId = new Map(adapters.map((a) => [a.id, a]));

export function getAdapter(id: string): AlgorithmAdapter | undefined {
  return byId.get(id);
}

export function listAdapters(): AlgorithmAdapter[] {
  return [...adapters];
}
