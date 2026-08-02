/**
 * One-shot generator for Learn problem packages (phases 2–5).
 * Run: node scripts/generate-learn-problems.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/problems");

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log("wrote", rel);
}

// Shared tiny helpers embedded in generated solution files via imports from engine.

const problems = [
  {
    folder: "1-two-sum",
    meta: {
      id: 1,
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "easy",
      category: "search",
      tags: ["array", "hash-table"],
      leetcodeUrl: "https://leetcode.com/problems/two-sum/",
      inputSchema: "two-sum",
    },
    statement: `# 1. Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

## Constraints
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
    cases: [
      { id: "1-1", label: "Example 1", input: { array: [2, 7, 11, 15], target: 9 }, createdAt: 0 },
      { id: "1-2", label: "Example 2", input: { array: [3, 2, 4], target: 6 }, createdAt: 0 },
      { id: "1-3", label: "Duplicates", input: { array: [3, 3], target: 6 }, createdAt: 0 },
    ],
  },
  {
    folder: "bubble-sort",
    meta: {
      id: 9001,
      slug: "bubble-sort",
      title: "Bubble Sort",
      difficulty: "easy",
      category: "sort",
      tags: ["array", "sorting"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Bubble_sort",
      inputSchema: "array",
    },
    statement: `# Bubble Sort

Repeatedly compare adjacent elements and swap them if they are in the wrong order. After each pass, the largest unsorted element "bubbles" to the end.`,
    cases: [
      { id: "bs-1", label: "Unsorted", input: { array: [5, 1, 4, 2, 8] }, createdAt: 0 },
      { id: "bs-2", label: "Nearly sorted", input: { array: [1, 3, 2, 4, 5] }, createdAt: 0 },
    ],
  },
  {
    folder: "merge-sort",
    meta: {
      id: 9002,
      slug: "merge-sort",
      title: "Merge Sort",
      difficulty: "medium",
      category: "sort",
      tags: ["array", "divide-and-conquer", "sorting"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Merge_sort",
      inputSchema: "array",
    },
    statement: `# Merge Sort

Divide the array into halves, sort each half recursively, then merge the sorted halves.`,
    cases: [
      { id: "ms-1", label: "Unsorted", input: { array: [38, 27, 43, 3, 9, 82, 10] }, createdAt: 0 },
      { id: "ms-2", label: "Small", input: { array: [4, 1, 3, 2] }, createdAt: 0 },
    ],
  },
  {
    folder: "quick-sort",
    meta: {
      id: 9003,
      slug: "quick-sort",
      title: "Quick Sort",
      difficulty: "medium",
      category: "sort",
      tags: ["array", "divide-and-conquer", "sorting"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Quicksort",
      inputSchema: "array",
    },
    statement: `# Quick Sort

Pick a pivot, partition elements around it, then recursively sort the partitions.`,
    cases: [
      { id: "qs-1", label: "Unsorted", input: { array: [10, 7, 8, 9, 1, 5] }, createdAt: 0 },
      { id: "qs-2", label: "Small", input: { array: [3, 1, 4, 2] }, createdAt: 0 },
    ],
  },
  {
    folder: "bfs-graph",
    meta: {
      id: 9004,
      slug: "bfs",
      title: "Breadth-First Search",
      difficulty: "medium",
      category: "graph",
      tags: ["graph", "bfs", "queue"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Breadth-first_search",
      inputSchema: "graph",
    },
    statement: `# Breadth-First Search

Explore a graph level by level using a queue. Visit neighbors of the current node before going deeper.`,
    cases: [
      {
        id: "bfs-1",
        label: "Small graph",
        input: {
          start: "A",
          graph: {
            nodes: [
              { id: "A", label: "A", x: 0, y: 0 },
              { id: "B", label: "B", x: 1, y: 0 },
              { id: "C", label: "C", x: 0.5, y: 1 },
              { id: "D", label: "D", x: 1.5, y: 1 },
            ],
            edges: [
              { id: "A-B", from: "A", to: "B" },
              { id: "A-C", from: "A", to: "C" },
              { id: "B-D", from: "B", to: "D" },
              { id: "C-D", from: "C", to: "D" },
            ],
          },
        },
        createdAt: 0,
      },
    ],
  },
  {
    folder: "dfs-graph",
    meta: {
      id: 9005,
      slug: "dfs",
      title: "Depth-First Search",
      difficulty: "medium",
      category: "graph",
      tags: ["graph", "dfs", "stack"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Depth-first_search",
      inputSchema: "graph",
    },
    statement: `# Depth-First Search

Explore as far as possible along each branch before backtracking. Often implemented with recursion or an explicit stack.`,
    cases: [
      {
        id: "dfs-1",
        label: "Small graph",
        input: {
          start: "A",
          graph: {
            nodes: [
              { id: "A", label: "A", x: 0, y: 0 },
              { id: "B", label: "B", x: 1, y: 0 },
              { id: "C", label: "C", x: 0.5, y: 1 },
              { id: "D", label: "D", x: 1.5, y: 1 },
            ],
            edges: [
              { id: "A-B", from: "A", to: "B" },
              { id: "A-C", from: "A", to: "C" },
              { id: "B-D", from: "B", to: "D" },
              { id: "C-D", from: "C", to: "D" },
            ],
          },
        },
        createdAt: 0,
      },
    ],
  },
  {
    folder: "94-binary-tree-inorder",
    meta: {
      id: 94,
      slug: "binary-tree-inorder-traversal",
      title: "Binary Tree Inorder Traversal",
      difficulty: "easy",
      category: "tree",
      tags: ["tree", "dfs", "binary-tree"],
      leetcodeUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
      inputSchema: "tree-array",
    },
    statement: `# 94. Binary Tree Inorder Traversal

Given the root of a binary tree, return the inorder traversal of its nodes' values (Left → Root → Right).`,
    cases: [
      { id: "94-1", label: "Example", input: { values: [1, null, 2, 3] }, createdAt: 0 },
      { id: "94-2", label: "Balanced", input: { values: [4, 2, 6, 1, 3, 5, 7] }, createdAt: 0 },
    ],
  },
  {
    folder: "215-kth-largest",
    meta: {
      id: 215,
      slug: "kth-largest-element-in-an-array",
      title: "Kth Largest Element in an Array",
      difficulty: "medium",
      category: "heap",
      tags: ["array", "heap", "sorting"],
      leetcodeUrl: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
      inputSchema: "array-target",
    },
    statement: `# 215. Kth Largest Element in an Array

Given an integer array \`nums\` and an integer \`k\`, return the \`k\`th largest element in the array.

We visualize a max-heap style selection for learning.`,
    cases: [
      { id: "215-1", label: "Example 1", input: { array: [3, 2, 1, 5, 6, 4], target: 2 }, createdAt: 0 },
      { id: "215-2", label: "Example 2", input: { array: [3, 2, 3, 1, 2, 4, 5, 5, 6], target: 4 }, createdAt: 0 },
    ],
  },
  {
    folder: "3-longest-substring",
    meta: {
      id: 3,
      slug: "longest-substring-without-repeating-characters",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "medium",
      category: "sliding-window",
      tags: ["hash-table", "string", "sliding-window"],
      leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      inputSchema: "window",
    },
    statement: `# 3. Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    cases: [
      { id: "3-1", label: "abcabcbb", input: { s: "abcabcbb" }, createdAt: 0 },
      { id: "3-2", label: "bbbbb", input: { s: "bbbbb" }, createdAt: 0 },
      { id: "3-3", label: "pwwkew", input: { s: "pwwkew" }, createdAt: 0 },
    ],
  },
  {
    folder: "167-two-sum-ii",
    meta: {
      id: 167,
      slug: "two-sum-ii-input-array-is-sorted",
      title: "Two Sum II - Input Array Is Sorted",
      difficulty: "medium",
      category: "two-pointers",
      tags: ["array", "two-pointers", "binary-search"],
      leetcodeUrl: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      inputSchema: "two-sum",
    },
    statement: `# 167. Two Sum II

Given a 1-indexed array of integers \`numbers\` that is already sorted in non-decreasing order, find two numbers that add up to a specific \`target\`.`,
    cases: [
      { id: "167-1", label: "Example 1", input: { array: [2, 7, 11, 15], target: 9 }, createdAt: 0 },
      { id: "167-2", label: "Example 2", input: { array: [2, 3, 4], target: 6 }, createdAt: 0 },
    ],
  },
  {
    folder: "20-valid-parentheses",
    meta: {
      id: 20,
      slug: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "easy",
      category: "stack",
      tags: ["string", "stack"],
      leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/",
      inputSchema: "stack-ops",
    },
    statement: `# 20. Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.`,
    cases: [
      { id: "20-1", label: "()", input: { s: "()" }, createdAt: 0 },
      { id: "20-2", label: "()[]{}", input: { s: "()[]{}" }, createdAt: 0 },
      { id: "20-3", label: "(]", input: { s: "(]" }, createdAt: 0 },
      { id: "20-4", label: "([)]", input: { s: "([)]" }, createdAt: 0 },
    ],
  },
  {
    folder: "queue-basics",
    meta: {
      id: 9006,
      slug: "queue-basics",
      title: "Queue Operations",
      difficulty: "easy",
      category: "queue",
      tags: ["queue", "fifo"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Queue_(abstract_data_type)",
      inputSchema: "stack-ops",
    },
    statement: `# Queue Operations

A queue is FIFO. Visualize enqueue and dequeue on a sequence of values.`,
    cases: [
      { id: "q-1", label: "Sequence", input: { s: "ABCD" }, createdAt: 0 },
    ],
  },
  {
    folder: "206-reverse-linked-list",
    meta: {
      id: 206,
      slug: "reverse-linked-list",
      title: "Reverse Linked List",
      difficulty: "easy",
      category: "list",
      tags: ["linked-list", "recursion"],
      leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list/",
      inputSchema: "array",
    },
    statement: `# 206. Reverse Linked List

Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    cases: [
      { id: "206-1", label: "Example", input: { array: [1, 2, 3, 4, 5] }, createdAt: 0 },
      { id: "206-2", label: "Two nodes", input: { array: [1, 2] }, createdAt: 0 },
    ],
  },
  {
    folder: "knapsack-01",
    meta: {
      id: 9007,
      slug: "0-1-knapsack",
      title: "0/1 Knapsack",
      difficulty: "medium",
      category: "dp",
      tags: ["dynamic-programming"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Knapsack_problem",
      inputSchema: "knapsack",
    },
    statement: `# 0/1 Knapsack

Given weights and values of items, and a knapsack capacity, find the maximum value obtainable without exceeding capacity. Each item may be taken at most once.`,
    cases: [
      {
        id: "ks-1",
        label: "Classic",
        input: { weights: [1, 3, 4, 5], values: [1, 4, 5, 7], capacity: 7 },
        createdAt: 0,
      },
    ],
  },
  {
    folder: "547-number-of-provinces",
    meta: {
      id: 547,
      slug: "number-of-provinces",
      title: "Number of Provinces",
      difficulty: "medium",
      category: "union-find",
      tags: ["union-find", "graph"],
      leetcodeUrl: "https://leetcode.com/problems/number-of-provinces/",
      inputSchema: "uf-ops",
    },
    statement: `# 547. Number of Provinces

There are \`n\` cities. Some are connected. A province is a group of directly or indirectly connected cities. Return the total number of provinces.`,
    cases: [
      {
        id: "547-1",
        label: "Example",
        input: {
          isConnected: [
            [1, 1, 0],
            [1, 1, 0],
            [0, 0, 1],
          ],
        },
        createdAt: 0,
      },
    ],
  },
  {
    folder: "208-implement-trie",
    meta: {
      id: 208,
      slug: "implement-trie-prefix-tree",
      title: "Implement Trie (Prefix Tree)",
      difficulty: "medium",
      category: "trie",
      tags: ["trie", "string", "design"],
      leetcodeUrl: "https://leetcode.com/problems/implement-trie-prefix-tree/",
      inputSchema: "trie-ops",
    },
    statement: `# 208. Implement Trie

A trie (prefix tree) is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.`,
    cases: [
      {
        id: "208-1",
        label: "Insert apple/app",
        input: { words: ["apple", "app", "apex"] },
        createdAt: 0,
      },
    ],
  },
  {
    folder: "segment-tree-basics",
    meta: {
      id: 9008,
      slug: "segment-tree",
      title: "Segment Tree Range Sum",
      difficulty: "hard",
      category: "segment-tree",
      tags: ["segment-tree", "array"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Segment_tree",
      inputSchema: "segment-ops",
    },
    statement: `# Segment Tree (Range Sum)

Build a segment tree over an array to answer range-sum queries efficiently.`,
    cases: [
      {
        id: "st-1",
        label: "Build + query",
        input: { array: [1, 3, 5, 7, 9, 11], query: [1, 4] },
        createdAt: 0,
      },
    ],
  },
  {
    folder: "fenwick-tree-basics",
    meta: {
      id: 9009,
      slug: "fenwick-tree",
      title: "Fenwick Tree (BIT)",
      difficulty: "hard",
      category: "segment-tree",
      tags: ["fenwick-tree", "binary-indexed-tree"],
      leetcodeUrl: "https://en.wikipedia.org/wiki/Fenwick_tree",
      inputSchema: "segment-ops",
    },
    statement: `# Fenwick Tree

A Binary Indexed Tree supports prefix sums and point updates in O(log n).`,
    cases: [
      {
        id: "ft-1",
        label: "Prefix sums",
        input: { array: [1, 2, 3, 4, 5], query: [0, 3] },
        createdAt: 0,
      },
    ],
  },
];

for (const p of problems) {
  write(
    `${p.folder}/metadata.json`,
    JSON.stringify(p.meta, null, 2) + "\n",
  );
  write(`${p.folder}/statement.md`, p.statement + "\n");
  write(
    `${p.folder}/testcases.json`,
    JSON.stringify(p.cases, null, 2) + "\n",
  );
}

console.log("Metadata/statement/cases written. Solutions are authored separately.");
