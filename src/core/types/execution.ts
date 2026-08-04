import type { GraphData, LinkedListData, TreeNode } from "./structures";

/** Semantic highlight kinds — mirrors alg0.dev's typed bar colors, plus extras. */
export type HighlightKind =
  | "comparing"
  | "swapped"
  | "selected"
  | "sorted"
  | "pivot"
  | "found"
  | "current"
  | "searching"
  | "left"
  | "right"
  | "merged"
  | "minimum"
  | "active"
  | "visited"
  | "write";

export interface Highlights {
  nodes: string[];
  edges: string[];
  indices: number[];
  indexKinds?: Record<number, HighlightKind>;
  sorted?: number[];
}

export interface Structures {
  array?: (number | string)[];
  tree?: TreeNode | null;
  graph?: GraphData;
  queue?: (number | string)[];
  stack?: (number | string)[];
  linkedList?: LinkedListData;
  table?: (number | string | null)[][];
  hashmap?: Record<string, number | string | null>;
}

export interface ExecutionState {
  step: number;
  line: number;
  algorithm: string;
  variables: Record<string, unknown>;
  structures: Structures;
  highlights: Highlights;
  operation: string;
  description: string;
  /** Active call frames when present on the Trace Frame (debugger strip). */
  callStack?: string[];
}

export interface Timeline {
  id: string;
  algorithmId: string;
  input: unknown;
  states: ExecutionState[];
  createdAt: number;
}

export type ProblemCategory =
  | "search"
  | "sort"
  | "graph"
  | "tree"
  | "list"
  | "dp";

export interface TestCase {
  id: string;
  label: string;
  input: unknown;
  favorite?: boolean;
  createdAt: number;
}

export interface ProblemDefinition {
  id: string;
  slug: string;
  name: string;
  category: ProblemCategory;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  code: string[];
  defaultCases: TestCase[];
  inputSchema:
    | "array-target"
    | "array"
    | "graph"
    | "list-ops"
    | "bst-insert"
    | "knapsack";
}

export interface AlgorithmAdapter<TInput = unknown> {
  id: string;
  execute(input: TInput): ExecutionState[];
}

export interface SavedExecution {
  id: string;
  algorithmId: string;
  label: string;
  timeline: Timeline;
  savedAt: number;
}
