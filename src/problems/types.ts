import type { ExecutionEvent } from "@/engine/events/types";
import type { TestCase } from "@/core/types/execution";

export type SolutionApproach =
  | "brute"
  | "better"
  | "optimal"
  | "recursive"
  | "iterative"
  | "other";

export type ProblemDifficulty = "easy" | "medium" | "hard";

export type ProblemCategory =
  | "search"
  | "sort"
  | "graph"
  | "tree"
  | "list"
  | "dp"
  | "stack"
  | "queue"
  | "heap"
  | "trie"
  | "union-find"
  | "sliding-window"
  | "two-pointers"
  | "segment-tree";

export type InputSchema =
  | "array-target"
  | "array"
  | "two-sum"
  | "graph"
  | "list-ops"
  | "bst-insert"
  | "knapsack"
  | "tree-array"
  | "window"
  | "stack-ops"
  | "uf-ops"
  | "trie-ops"
  | "segment-ops";

export interface ProblemMetadata {
  id: number;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  category: ProblemCategory;
  tags: string[];
  leetcodeUrl: string;
  inputSchema: InputSchema;
}

export interface ReferenceSolution<TInput = unknown> {
  id: string;
  name: string;
  approach: SolutionApproach;
  timeComplexity: string;
  spaceComplexity: string;
  /** Default TypeScript source shown in Monaco. */
  code: string;
  /** Optional hand-authored variants for other editor languages. */
  codeByLang?: Partial<
    Record<"java" | "python" | "cpp" | "typescript", string>
  >;
  execute: (input: TInput) => ExecutionEvent[];
}

export interface ProblemPackage {
  metadata: ProblemMetadata;
  statement: string;
  testcases: TestCase[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  solutions: ReferenceSolution<any>[];
}
