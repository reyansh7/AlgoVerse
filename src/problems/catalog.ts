import { defaultDemoGraph } from "@/core/execution/adapters/graph-utils";
import type { ProblemDefinition, TestCase } from "@/core/types/execution";

let caseSeq = 0;
function caseOf(label: string, input: unknown): TestCase {
  caseSeq += 1;
  return {
    id: `default-case-${caseSeq}`,
    label,
    input,
    createdAt: 0,
  };
}

export const PROBLEMS: ProblemDefinition[] = [
  {
    id: "AV-001",
    slug: "binary-search",
    name: "Binary Search",
    category: "search",
    difficulty: "easy",
    description:
      "Locate a target value in a sorted array by repeatedly halving the search space.",
    inputSchema: "array-target",
    code: [
      "function binarySearch(nums, target):",
      "  left, right = 0, n - 1",
      "  while left <= right:",
      "    mid = (left + right) // 2",
      "    if nums[mid] == target: return mid",
      "    if nums[mid] < target:",
      "      left = mid + 1",
      "    else:",
      "      right = mid - 1",
      "  return -1",
    ],
    defaultCases: [
      caseOf("Classic", {
        array: [1, 3, 5, 7, 9, 11, 13, 15],
        target: 13,
      }),
      caseOf("First probe", {
        array: [1, 3, 5, 7, 9, 11, 13, 15],
        target: 7,
      }),
      caseOf("Not found", {
        array: [2, 4, 6, 8, 10, 12, 14],
        target: 5,
      }),
    ],
  },
  {
    id: "AV-011",
    slug: "linear-search",
    name: "Linear Search",
    category: "search",
    difficulty: "easy",
    description:
      "Scan each element from left to right until the target is found or the array ends.",
    inputSchema: "array-target",
    code: [
      "function linearSearch(nums, target):",
      "  for i in 0..n-1:",
      "    if nums[i] == target: return i",
      "    # keep scanning",
      "  return -1",
      "# not found",
    ],
    defaultCases: [
      caseOf("Find 43", { array: [38, 27, 43, 3, 9, 82, 10], target: 43 }),
      caseOf("Missing", { array: [38, 27, 43, 3, 9], target: 99 }),
    ],
  },
  {
    id: "AV-002",
    slug: "bubble-sort",
    name: "Bubble Sort",
    category: "sort",
    difficulty: "easy",
    description:
      "Repeatedly compare adjacent elements and swap them until the array is sorted. Sorted suffix grows each pass.",
    inputSchema: "array",
    code: [
      "function bubbleSort(nums):",
      "  for i in 0..n-2:",
      "    for j in 0..n-i-2:",
      "      if nums[j] > nums[j+1]: swap",
      "  return nums",
      "# done",
    ],
    defaultCases: [
      caseOf("Classic", { array: [38, 27, 43, 3, 9, 82, 10] }),
      caseOf("Reversed", { array: [6, 5, 4, 3, 2, 1] }),
      caseOf("Nearly sorted", { array: [1, 2, 4, 3, 5] }),
    ],
  },
  {
    id: "AV-012",
    slug: "selection-sort",
    name: "Selection Sort",
    category: "sort",
    difficulty: "easy",
    description:
      "Repeatedly select the minimum from the unsorted region and swap it into the next sorted slot.",
    inputSchema: "array",
    code: [
      "function selectionSort(nums):",
      "  for i in 0..n-2:",
      "    minIndex = i",
      "    for j in i+1..n-1:",
      "      if nums[j] < nums[minIndex]: minIndex = j",
      "    # min found",
      "    # optional swap",
      "    swap nums[i] with nums[minIndex]",
      "  return nums",
      "# placed",
      "# ...",
      "# done",
    ],
    defaultCases: [
      caseOf("Classic", { array: [64, 25, 12, 22, 11] }),
      caseOf("Demo", { array: [38, 27, 43, 3, 9] }),
    ],
  },
  {
    id: "AV-013",
    slug: "insertion-sort",
    name: "Insertion Sort",
    category: "sort",
    difficulty: "easy",
    description:
      "Grow a sorted prefix by inserting each next element into its correct position.",
    inputSchema: "array",
    code: [
      "function insertionSort(nums):",
      "  # index 0 sorted",
      "  for i in 1..n-1:",
      "    key = nums[i]",
      "    while j >= 0 and nums[j] > key:",
      "      shift nums[j] right",
      "    # hole ready",
      "    place key",
      "  return nums",
      "# done",
    ],
    defaultCases: [
      caseOf("Classic", { array: [12, 11, 13, 5, 6] }),
      caseOf("Demo", { array: [38, 27, 43, 3, 9] }),
    ],
  },
  {
    id: "AV-003",
    slug: "merge-sort",
    name: "Merge Sort",
    category: "sort",
    difficulty: "medium",
    description: "Divide the array, sort each half, then merge the sorted halves.",
    inputSchema: "array",
    code: [
      "function mergeSort(nums, low, high):",
      "  if low >= high: return",
      "  mid = (low + high) // 2",
      "  mergeSort(low, mid)",
      "  mergeSort(mid+1, high)",
      "  merge(low, mid, high)",
      "function merge(...):",
      "  compare left & right heads",
      "  write smaller into array",
      "  drain left remainder",
      "  drain right remainder",
      "# done",
      "return nums",
    ],
    defaultCases: [
      caseOf("Demo", { array: [38, 27, 43, 3, 9, 82, 10] }),
      caseOf("Small", { array: [8, 3, 6, 1, 7, 2] }),
    ],
  },
  {
    id: "AV-004",
    slug: "quick-sort",
    name: "Quick Sort",
    category: "sort",
    difficulty: "medium",
    description:
      "Partition around a pivot, then recursively sort the left and right partitions.",
    inputSchema: "array",
    code: [
      "function quickSort(nums, low, high):",
      "  if low >= high: return",
      "  p = partition(low, high)",
      "  pivot = nums[high]",
      "  # partition loop",
      "  compare nums[j] with pivot",
      "  swap when nums[j] < pivot",
      "  # place pivot",
      "  swap pivot into place",
      "  quickSort(low, p-1)",
      "  quickSort(p+1, high)",
      "# done",
    ],
    defaultCases: [
      caseOf("Demo", { array: [38, 27, 43, 3, 9, 82, 10] }),
      caseOf("Small", { array: [9, 4, 6, 2, 7, 1] }),
    ],
  },
  {
    id: "AV-005",
    slug: "bfs",
    name: "Breadth-First Search",
    category: "graph",
    difficulty: "medium",
    description: "Explore a graph level by level using a queue.",
    inputSchema: "graph",
    code: [
      "function bfs(graph, start):",
      "  queue = [start]; visit start",
      "  while queue not empty:",
      "    node = dequeue()",
      "    visit(node)",
      "    for neighbor of node:",
      "      if unvisited: enqueue(neighbor)",
      "  # explored",
      "# done",
    ],
    defaultCases: [
      caseOf("From A", { graph: defaultDemoGraph(), start: "A" }),
      caseOf("From C", { graph: defaultDemoGraph(), start: "C" }),
    ],
  },
  {
    id: "AV-006",
    slug: "dfs",
    name: "Depth-First Search",
    category: "graph",
    difficulty: "medium",
    description: "Explore as deep as possible along each branch before backtracking.",
    inputSchema: "graph",
    code: [
      "function dfs(graph, start):",
      "  dfsVisit(start)",
      "  function dfsVisit(node):",
      "    mark visited",
      "    for neighbor of node:",
      "      if unvisited: dfsVisit(neighbor)",
      "    backtrack",
      "# done",
    ],
    defaultCases: [
      caseOf("From A", { graph: defaultDemoGraph(), start: "A" }),
    ],
  },
  {
    id: "AV-007",
    slug: "dijkstra",
    name: "Dijkstra's Shortest Path",
    category: "graph",
    difficulty: "hard",
    description:
      "Compute shortest paths from a source node in a weighted graph.",
    inputSchema: "graph",
    code: [
      "function dijkstra(graph, start):",
      "  dist[start] = 0; others = ∞",
      "  while unvisited remains:",
      "    u = closest unvisited",
      "    for edge u → v:",
      "      relax distance",
      "      update if improved",
      "  # paths ready",
      "# done",
    ],
    defaultCases: [
      caseOf("From A", { graph: defaultDemoGraph(), start: "A" }),
    ],
  },
  {
    id: "AV-008",
    slug: "linked-list-ops",
    name: "Linked List Operations",
    category: "list",
    difficulty: "easy",
    description: "Traverse, insert, and delete nodes in a singly linked list.",
    inputSchema: "list-ops",
    code: [
      "list = build(values)",
      "for each operation:",
      "  traverse with pointer",
      "  # insert path",
      "  walk to index",
      "  relink pointers (insert)",
      "  walk to predecessor",
      "  relink pointers (delete)",
      "# done",
    ],
    defaultCases: [
      caseOf("Insert & delete", {
        values: [10, 20, 30, 40],
        operations: [
          { type: "traverse" },
          { type: "insert", value: 25, index: 2 },
          { type: "delete", index: 1 },
          { type: "traverse" },
        ],
      }),
    ],
  },
  {
    id: "AV-009",
    slug: "bst-insert",
    name: "BST Insertion",
    category: "tree",
    difficulty: "medium",
    description: "Insert values into a binary search tree while preserving order.",
    inputSchema: "bst-insert",
    code: [
      "root = null",
      "for value in values:",
      "  if root is null: create root",
      "  else create leaf when empty slot",
      "  compare and descend",
      "  go left or right",
      "  confirm insertion",
      "# done",
    ],
    defaultCases: [
      caseOf("Build tree", { values: [8, 3, 10, 1, 6, 14, 4, 7] }),
    ],
  },
  {
    id: "AV-010",
    slug: "knapsack",
    name: "0/1 Knapsack",
    category: "dp",
    difficulty: "hard",
    description:
      "Maximize value under a weight capacity using dynamic programming.",
    inputSchema: "knapsack",
    code: [
      "dp = zeros(n+1, capacity+1)",
      "for i in 1..n:",
      "  for w in 0..capacity:",
      "    if weight > w: skip",
      "    else:",
      "      dp[i][w] = max(include, exclude)",
      "  # row complete",
      "# answer = dp[n][capacity]",
    ],
    defaultCases: [
      caseOf("Classic", {
        weights: [1, 2, 3],
        values: [6, 10, 12],
        capacity: 5,
      }),
    ],
  },
];

export function getProblemBySlug(slug: string): ProblemDefinition | undefined {
  return PROBLEMS.find((p) => p.slug === slug);
}

export function getProblemById(id: string): ProblemDefinition | undefined {
  return PROBLEMS.find((p) => p.id.toLowerCase() === id.toLowerCase());
}

export function searchProblems(query: string): ProblemDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return PROBLEMS;
  return PROBLEMS.filter(
    (p) =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.slug.includes(q) ||
      p.category.includes(q),
  );
}
