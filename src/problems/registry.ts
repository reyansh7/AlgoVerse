import type { ProblemPackage } from "./types";

import { problem704 } from "./704-binary-search";
import { problem1 } from "./1-two-sum";
import { problemBubbleSort } from "./bubble-sort";
import { problemMergeSort } from "./merge-sort";
import { problemQuickSort } from "./quick-sort";
import { problemBfs } from "./bfs-graph";
import { problemDfs } from "./dfs-graph";
import { problem94 } from "./94-binary-tree-inorder";
import { problem215 } from "./215-kth-largest";
import { problem3 } from "./3-longest-substring";
import { problem167 } from "./167-two-sum-ii";
import { problem20 } from "./20-valid-parentheses";
import { problemQueue } from "./queue-basics";
import { problem206 } from "./206-reverse-linked-list";
import { problemKnapsack } from "./knapsack-01";
import { problem547 } from "./547-number-of-provinces";
import { problem208 } from "./208-implement-trie";
import { problemSegmentTree } from "./segment-tree-basics";
import { problemFenwick } from "./fenwick-tree-basics";

import { arrayFamily } from "./families/arrays";
import { binarySearchFamily } from "./families/binary-search";
import { twoPointersFamily } from "./families/two-pointers";
import { slidingWindowFamily } from "./families/sliding-window";
import { prefixSumFamily } from "./families/prefix-sum";
import { hashMapFamily } from "./families/hashmaps";
import { linkedListFamily } from "./families/linked-lists";
import { stacksFamily } from "./families/stacks";
import { queuesFamily } from "./families/queues";
import { binaryTreesFamily } from "./families/binary-trees";
import { bstFamily } from "./families/bst";
import { heapsFamily } from "./families/heaps";
import { graphsFamily } from "./families/graphs";
import { dfsFamily } from "./families/dfs-problems";
import { bfsFamily } from "./families/bfs-problems";
import { backtrackingFamily } from "./families/backtracking";
import { dpFamily } from "./families/dp";
import { triesFamily } from "./families/tries";
import { unionFindFamily } from "./families/union-find";
import { greedyFamily } from "./families/greedy";
import { bitFamily } from "./families/bit-manipulation";
import { monotonicStackFamily } from "./families/monotonic-stack";
import { segmentFenwickFamily } from "./families/segment-fenwick";
import { designFamily } from "./families/design";

const LEGACY: ProblemPackage[] = [
  problem704,
  problem1,
  problemBubbleSort,
  problemMergeSort,
  problemQuickSort,
  problemBfs,
  problemDfs,
  problem94,
  problem215,
  problem3,
  problem167,
  problem20,
  problemQueue,
  problem206,
  problemKnapsack,
  problem547,
  problem208,
  problemSegmentTree,
  problemFenwick,
];

const FAMILIES: ProblemPackage[] = [
  ...arrayFamily,
  ...binarySearchFamily,
  ...twoPointersFamily,
  ...slidingWindowFamily,
  ...prefixSumFamily,
  ...hashMapFamily,
  ...linkedListFamily,
  ...stacksFamily,
  ...queuesFamily,
  ...binaryTreesFamily,
  ...bstFamily,
  ...heapsFamily,
  ...graphsFamily,
  ...dfsFamily,
  ...bfsFamily,
  ...backtrackingFamily,
  ...dpFamily,
  ...triesFamily,
  ...unionFindFamily,
  ...greedyFamily,
  ...bitFamily,
  ...monotonicStackFamily,
  ...segmentFenwickFamily,
  ...designFamily,
];

/** Deduplicate by LeetCode id (legacy packages win so curated folders stay primary). */
function mergeProblems(
  primary: ProblemPackage[],
  extra: ProblemPackage[],
): ProblemPackage[] {
  const seen = new Set(primary.map((p) => p.metadata.id));
  const out = [...primary];
  for (const p of extra) {
    if (seen.has(p.metadata.id)) continue;
    seen.add(p.metadata.id);
    out.push(p);
  }
  return out.sort((a, b) => a.metadata.id - b.metadata.id);
}

/** All Learn-mode problem packages. */
export const LEARN_PROBLEMS: ProblemPackage[] = mergeProblems(LEGACY, FAMILIES);

const bySlug = new Map(LEARN_PROBLEMS.map((p) => [p.metadata.slug, p]));
const byId = new Map(LEARN_PROBLEMS.map((p) => [p.metadata.id, p]));

export function getProblemBySlug(slug: string): ProblemPackage | undefined {
  return bySlug.get(slug);
}

export function getProblemById(id: number): ProblemPackage | undefined {
  return byId.get(id);
}

export function getSolution(
  problem: ProblemPackage,
  solutionId: string,
): import("./types").ReferenceSolution | undefined {
  return problem.solutions.find((s) => s.id === solutionId);
}

export function listLearnProblems(): ProblemPackage[] {
  return LEARN_PROBLEMS;
}
