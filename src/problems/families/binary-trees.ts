import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, treeFromLevelOrder } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";
import type { TreeNode } from "@/core/types/structures";

type TreeIn = { values: (number | null)[] };
type TwoTrees = { values1: (number | null)[]; values2: (number | null)[] };
type TreeTarget = { values: (number | null)[]; target: number };
type TreeK = { values: (number | null)[]; k: number };
type PreIn = { preorder: number[]; inorder: number[] };
type LcaIn = { values: (number | null)[]; p: number; q: number };

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneTree(node.left ?? null),
    right: cloneTree(node.right ?? null),
  };
}

function showTree(
  r: EventRecorder,
  tree: TreeNode | null,
  description: string,
  opts: {
    nodes?: string[];
    vars?: Record<string, unknown>;
    line?: number;
    array?: (number | string)[];
    queue?: (number | string)[];
  } = {},
) {
  r.setStructure(
    {
      tree: tree ? cloneTree(tree) : null,
      ...(opts.array ? { array: [...opts.array] } : {}),
      ...(opts.queue ? { queue: [...opts.queue] } : {}),
    },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  if (opts.nodes?.length) r.highlight({ nodes: opts.nodes, description });
}

function findNode(root: TreeNode | null, val: number): TreeNode | null {
  if (!root) return null;
  if (root.value === val) return root;
  return findNode(root.left ?? null, val) ?? findNode(root.right ?? null, val);
}

export const binaryTreesFamily: ProblemPackage[] = [
  createProblem({
    id: 100,
    title: "Same Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "recursion"],
    inputSchema: "tree-array",
    statement: `# 100. Same Tree

Check whether two binary trees are structurally identical with the same node values.`,
    testcases: [
      { label: "Same", input: { values1: [1, 2, 3], values2: [1, 2, 3] } },
      { label: "Different", input: { values1: [1, 2], values2: [1, null, 2] } },
    ],
    solutions: [
      sol<TwoTrees>({
        id: "100-recursive",
        name: "Recursive Compare",
        time: "O(n)",
        space: "O(h)",
        code: `function isSameTree(p, q): boolean {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
        execute({ values1, values2 }) {
          const r = new EventRecorder("100-recursive");
          const p = treeFromLevelOrder(values1);
          const q = treeFromLevelOrder(values2);
          showTree(r, p, "Compare tree p (left) with tree q (right).", { vars: { same: true } });

          function dfs(a: TreeNode | null, b: TreeNode | null): boolean {
            if (!a && !b) {
              showTree(r, p, "Both nodes null — subtrees match.", { line: 2 });
              return true;
            }
            if (!a || !b) {
              showTree(r, p, "One node missing — trees differ.", { line: 3, vars: { same: false } });
              return false;
            }
            showTree(r, p, `Compare ${a.value} vs ${b.value}.`, {
              line: 3,
              nodes: [a.id, b.id],
              vars: { a: a.value, b: b.value },
            });
            if (a.value !== b.value) {
              showTree(r, p, `Values differ (${a.value} ≠ ${b.value}).`, { nodes: [a.id, b.id], vars: { same: false } });
              return false;
            }
            const leftOk = dfs(a.left ?? null, b.left ?? null);
            const rightOk = dfs(a.right ?? null, b.right ?? null);
            return leftOk && rightOk;
          }

          const result = dfs(p, q);
          showTree(r, p, result ? "Trees are identical." : "Trees are not the same.", { vars: { same: result } });
          r.returnValue(result, { description: `Same tree: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 101,
    title: "Symmetric Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "bfs"],
    inputSchema: "tree-array",
    statement: `# 101. Symmetric Tree

Return true if the binary tree is a mirror of itself around its center.`,
    testcases: [
      { label: "Symmetric", input: { values: [1, 2, 2, 3, 4, 4, 3] } },
      { label: "Asymmetric", input: { values: [1, 2, 2, null, 3, null, 3] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "101-mirror",
        name: "Mirror DFS",
        time: "O(n)",
        space: "O(h)",
        code: `function isSymmetric(root): boolean {
  function mirror(a, b) {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return mirror(a.left, b.right) && mirror(a.right, b.left);
  }
  return mirror(root, root);
}`,
        execute({ values }) {
          const r = new EventRecorder("101-mirror");
          const root = treeFromLevelOrder(values);
          showTree(r, root, "Check left subtree mirrors right subtree.", {});

          function mirror(a: TreeNode | null, b: TreeNode | null): boolean {
            if (!a && !b) {
              showTree(r, root, "Both subtrees empty — symmetric here.", { line: 3 });
              return true;
            }
            if (!a || !b) {
              showTree(r, root, "Shape mismatch — not symmetric.", { line: 4, vars: { symmetric: false } });
              return false;
            }
            showTree(r, root, `Mirror pair: left ${a.value} vs right ${b.value}.`, {
              line: 4,
              nodes: [a.id, b.id],
            });
            if (a.value !== b.value) {
              showTree(r, root, `Values differ at mirror positions.`, { nodes: [a.id, b.id] });
              return false;
            }
            return mirror(a.left ?? null, b.right ?? null) && mirror(a.right ?? null, b.left ?? null);
          }

          const result = root ? mirror(root.left ?? null, root.right ?? null) : true;
          showTree(r, root, result ? "Tree is symmetric." : "Tree is not symmetric.", { vars: { symmetric: result } });
          r.returnValue(result, { description: `Symmetric: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 102,
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "bfs", "queue"],
    inputSchema: "tree-array",
    statement: `# 102. Binary Tree Level Order Traversal

Return the level-order traversal (left to right, level by level).`,
    testcases: [
      { label: "Example 1", input: { values: [3, 9, 20, null, null, 15, 7] } },
      { label: "Single", input: { values: [1] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "102-bfs",
        name: "BFS Queue",
        time: "O(n)",
        space: "O(n)",
        code: `function levelOrder(root): number[][] {
  if (!root) return [];
  const out = [], q = [root];
  while (q.length) {
    const level = [], size = q.length;
    for (let i = 0; i < size; i++) {
      const node = q.shift();
      level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    out.push(level);
  }
  return out;
}`,
        execute({ values }) {
          const r = new EventRecorder("102-bfs");
          const root = treeFromLevelOrder(values);
          const result: number[][] = [];
          if (!root) {
            showTree(r, null, "Empty tree — return [].", {});
            r.returnValue(result, { description: "No nodes to traverse." });
            r.done(result);
            return r.getEvents();
          }
          const q: TreeNode[] = [root];
          showTree(r, root, "Initialize queue with root.", { queue: [root.value], array: [] });

          while (q.length) {
            const level: number[] = [];
            const size = q.length;
            showTree(r, root, `Process level with ${size} node(s).`, {
              line: 4,
              queue: q.map((n) => n.value),
              array: result.flat(),
              vars: { levelIndex: result.length },
            });
            for (let i = 0; i < size; i++) {
              const node = q.shift()!;
              level.push(node.value as number);
              r.dequeue(node.value, { description: `Dequeue ${node.value} for current level.` });
              showTree(r, root, `Visit ${node.value} → level [${level.join(", ")}].`, {
                nodes: [node.id],
                queue: q.map((n) => n.value),
                array: [...result.flat(), ...level],
              });
              if (node.left) {
                q.push(node.left);
                r.enqueue(node.left.value, { description: `Enqueue left child ${node.left.value}.` });
              }
              if (node.right) {
                q.push(node.right);
                r.enqueue(node.right.value, { description: `Enqueue right child ${node.right.value}.` });
              }
            }
            result.push(level);
            showTree(r, root, `Level ${result.length} complete: [${level.join(", ")}].`, {
              array: result.flat(),
              queue: q.map((n) => n.value),
            });
          }
          r.returnValue(result, { description: `${result.length} levels collected.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 104,
    title: "Maximum Depth of Binary Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "recursion"],
    inputSchema: "tree-array",
    statement: `# 104. Maximum Depth of Binary Tree

Return the maximum depth (number of nodes along the longest root-to-leaf path).`,
    testcases: [
      { label: "Example 1", input: { values: [3, 9, 20, null, null, 15, 7] } },
      { label: "Empty", input: { values: [] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "104-dfs-depth",
        name: "Recursive Depth",
        time: "O(n)",
        space: "O(h)",
        code: `function maxDepth(root): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
        execute({ values }) {
          const r = new EventRecorder("104-dfs-depth");
          const root = treeFromLevelOrder(values);
          showTree(r, root, "Compute max depth via post-order DFS.", { vars: { depth: 0 } });

          function depth(node: TreeNode | null): number {
            if (!node) {
              showTree(r, root, "Null node — depth 0.", { line: 2 });
              return 0;
            }
            showTree(r, root, `Enter node ${node.value}.`, { line: 3, nodes: [node.id] });
            const left = depth(node.left ?? null);
            const right = depth(node.right ?? null);
            const d = 1 + Math.max(left, right);
            showTree(r, root, `Node ${node.value}: 1 + max(${left}, ${right}) = ${d}.`, {
              nodes: [node.id],
              vars: { leftDepth: left, rightDepth: right, depth: d },
            });
            return d;
          }

          const result = depth(root);
          showTree(r, root, `Maximum depth = ${result}.`, { vars: { depth: result } });
          r.returnValue(result, { description: `Max depth: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 105,
    title: "Construct Binary Tree from Preorder and Inorder Traversal",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "array", "divide-and-conquer"],
    inputSchema: "tree-array",
    statement: `# 105. Construct Binary Tree from Preorder and Inorder Traversal

Build a binary tree from its preorder and inorder traversal arrays.`,
    testcases: [
      { label: "Example 1", input: { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] } },
    ],
    solutions: [
      sol<PreIn>({
        id: "105-divide",
        name: "Divide & Conquer",
        time: "O(n)",
        space: "O(n)",
        code: `function buildTree(preorder, inorder): TreeNode {
  if (!preorder.length) return null;
  const rootVal = preorder[0];
  const mid = inorder.indexOf(rootVal);
  const root = new TreeNode(rootVal);
  root.left = buildTree(preorder.slice(1, mid+1), inorder.slice(0, mid));
  root.right = buildTree(preorder.slice(mid+1), inorder.slice(mid+1));
  return root;
}`,
        execute({ preorder, inorder }) {
          const r = new EventRecorder("105-divide");
          let idCounter = 0;
          showArray(r, preorder, "Preorder traversal defines root-first build order.", { vars: { inorder } });

          function build(pre: number[], ino: number[]): TreeNode | null {
            if (!pre.length) {
              showArray(r, pre, "Empty segment — return null.", { line: 2 });
              return null;
            }
            const rootVal = pre[0];
            const mid = ino.indexOf(rootVal);
            const root: TreeNode = { id: `n${idCounter++}`, value: rootVal };
            showTree(r, root, `Root = ${rootVal} (pre[0]); split inorder at index ${mid}.`, {
              line: 3,
              vars: { rootVal, mid, leftIno: ino.slice(0, mid), rightIno: ino.slice(mid + 1) },
            });
            root.left = build(pre.slice(1, mid + 1), ino.slice(0, mid));
            root.right = build(pre.slice(mid + 1), ino.slice(mid + 1));
            showTree(r, root, `Subtree rooted at ${rootVal} assembled.`, { nodes: [root.id] });
            return root;
          }

          const result = build([...preorder], [...inorder]);
          showTree(r, result, "Final constructed tree.", {});
          r.returnValue(result ? "tree built" : null, { description: "Tree construction complete." });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 110,
    title: "Balanced Binary Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs"],
    inputSchema: "tree-array",
    statement: `# 110. Balanced Binary Tree

Return true if the tree is height-balanced (|left − right| ≤ 1 at every node).`,
    testcases: [
      { label: "Balanced", input: { values: [3, 9, 20, null, null, 15, 7] } },
      { label: "Unbalanced", input: { values: [1, 2, 2, 3, 3, null, null, 4, 4] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "110-height-check",
        name: "Height with Early Exit",
        time: "O(n)",
        space: "O(h)",
        code: `function isBalanced(root): boolean {
  function height(node): number {
    if (!node) return 0;
    const l = height(node.left), r = height(node.right);
    if (Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
  }
  return height(root) !== -1;
}`,
        execute({ values }) {
          const r = new EventRecorder("110-height-check");
          const root = treeFromLevelOrder(values);
          showTree(r, root, "Check balance via subtree heights.", { vars: { balanced: true } });

          function height(node: TreeNode | null): number {
            if (!node) return 0;
            showTree(r, root, `Measure height at node ${node.value}.`, { nodes: [node.id], line: 3 });
            const l = height(node.left ?? null);
            if (l === -1) return -1;
            const rt = height(node.right ?? null);
            if (rt === -1) return -1;
            if (Math.abs(l - rt) > 1) {
              showTree(r, root, `Imbalance at ${node.value}: |${l}−${rt}| > 1.`, {
                nodes: [node.id],
                vars: { balanced: false },
              });
              return -1;
            }
            const h = 1 + Math.max(l, rt);
            showTree(r, root, `Node ${node.value} height = ${h} (balanced).`, { nodes: [node.id], vars: { height: h } });
            return h;
          }

          const result = root ? height(root) !== -1 : true;
          showTree(r, root, result ? "Tree is balanced." : "Tree is not balanced.", { vars: { balanced: result } });
          r.returnValue(result, { description: `Balanced: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 112,
    title: "Path Sum",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "backtracking"],
    inputSchema: "tree-array",
    statement: `# 112. Path Sum

Return true if the tree has a root-to-leaf path whose node values sum to target.`,
    testcases: [
      { label: "Example 1", input: { values: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], target: 22 } },
      { label: "False", input: { values: [1, 2, 3], target: 5 } },
    ],
    solutions: [
      sol<TreeTarget>({
        id: "112-dfs-sum",
        name: "DFS Accumulator",
        time: "O(n)",
        space: "O(h)",
        code: `function hasPathSum(root, targetSum): boolean {
  if (!root) return false;
  if (!root.left && !root.right) return root.val === targetSum;
  return hasPathSum(root.left, targetSum - root.val)
      || hasPathSum(root.right, targetSum - root.val);
}`,
        execute({ values, target }) {
          const r = new EventRecorder("112-dfs-sum");
          const root = treeFromLevelOrder(values);
          showTree(r, root, `Search root-to-leaf paths summing to ${target}.`, { vars: { target, remaining: target } });

          function dfs(node: TreeNode | null, rem: number): boolean {
            if (!node) return false;
            const next = rem - (node.value as number);
            showTree(r, root, `At ${node.value}: remaining = ${target} − path = ${rem} → need ${next} below.`, {
              nodes: [node.id],
              vars: { remaining: next },
            });
            if (!node.left && !node.right) {
              const hit = next === 0;
              showTree(r, root, hit ? `Leaf ${node.value} completes sum ${target}.` : `Leaf ${node.value}: sum ≠ ${target}.`, {
                nodes: [node.id],
              });
              return hit;
            }
            return dfs(node.left ?? null, next) || dfs(node.right ?? null, next);
          }

          const result = dfs(root, target);
          showTree(r, root, result ? `Found path with sum ${target}.` : `No path sums to ${target}.`, {});
          r.returnValue(result, { description: `Has path sum: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 124,
    title: "Binary Tree Maximum Path Sum",
    difficulty: "hard",
    category: "tree",
    tags: ["tree", "dfs", "divide-and-conquer"],
    inputSchema: "tree-array",
    statement: `# 124. Binary Tree Maximum Path Sum

Return the maximum path sum (any node sequence where adjacent nodes share an edge).`,
    testcases: [
      { label: "Example 1", input: { values: [1, 2, 3] } },
      { label: "Negative", input: { values: [-10, 9, 20, null, null, 15, 7] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "124-max-gain",
        name: "Gain DFS",
        time: "O(n)",
        space: "O(h)",
        code: `function maxPathSum(root): number {
  let best = -Infinity;
  function gain(node): number {
    if (!node) return 0;
    const l = Math.max(gain(node.left), 0);
    const r = Math.max(gain(node.right), 0);
    best = Math.max(best, node.val + l + r);
    return node.val + Math.max(l, r);
  }
  gain(root);
  return best;
}`,
        execute({ values }) {
          const r = new EventRecorder("124-max-gain");
          const root = treeFromLevelOrder(values);
          let best = -Infinity;
          showTree(r, root, "Track best path sum via max-gain DFS.", { vars: { best } });

          function gain(node: TreeNode | null): number {
            if (!node) return 0;
            showTree(r, root, `Post-order at ${node.value}.`, { nodes: [node.id], line: 4 });
            const l = Math.max(gain(node.left ?? null), 0);
            const rt = Math.max(gain(node.right ?? null), 0);
            const through = (node.value as number) + l + rt;
            best = Math.max(best, through);
            showTree(r, root, `Through ${node.value}: ${node.value}+${l}+${rt}=${through}; best=${best}.`, {
              nodes: [node.id],
              vars: { best, leftGain: l, rightGain: rt },
            });
            return (node.value as number) + Math.max(l, rt);
          }

          if (root) gain(root);
          showTree(r, root, `Maximum path sum = ${best}.`, { vars: { best } });
          r.returnValue(best, { description: `Max path sum: ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 226,
    title: "Invert Binary Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "recursion"],
    inputSchema: "tree-array",
    statement: `# 226. Invert Binary Tree

Mirror the tree by swapping every node's left and right children.`,
    testcases: [
      { label: "Example 1", input: { values: [4, 2, 7, 1, 3, 6, 9] } },
      { label: "Single", input: { values: [1] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "226-swap",
        name: "Recursive Swap",
        time: "O(n)",
        space: "O(h)",
        code: `function invertTree(root): TreeNode {
  if (!root) return null;
  [root.left, root.right] = [root.right, root.left];
  invertTree(root.left);
  invertTree(root.right);
  return root;
}`,
        execute({ values }) {
          const r = new EventRecorder("226-swap");
          const root = treeFromLevelOrder(values);
          showTree(r, root, "Swap left/right at every node (pre-order).", {});

          function invert(node: TreeNode | null): TreeNode | null {
            if (!node) return null;
            showTree(r, root, `Swap children of ${node.value}.`, { nodes: [node.id], line: 3 });
            const tmp = node.left;
            node.left = node.right ?? null;
            node.right = tmp ?? null;
            showTree(r, root, `After swap at ${node.value}.`, { nodes: [node.id] });
            invert(node.left ?? null);
            invert(node.right ?? null);
            return node;
          }

          const result = invert(root);
          showTree(r, result, "Tree fully inverted.", {});
          r.returnValue("inverted", { description: "Inversion complete." });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 230,
    title: "Kth Smallest Element in a BST",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "bst", "inorder"],
    inputSchema: "tree-array",
    statement: `# 230. Kth Smallest Element in a BST

Return the k-th smallest value (1-indexed) in a binary search tree.`,
    testcases: [
      { label: "Example 1", input: { values: [3, 1, 4, null, 2], k: 1 } },
      { label: "Example 2", input: { values: [5, 3, 6, 2, 4, null, null, 1], k: 3 } },
    ],
    solutions: [
      sol<TreeK>({
        id: "230-inorder",
        name: "Inorder Counter",
        time: "O(h + k)",
        space: "O(h)",
        code: `function kthSmallest(root, k): number {
  let count = 0, ans = 0;
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    if (++count === k) ans = node.val;
    inorder(node.right);
  }
  inorder(root);
  return ans;
}`,
        execute({ values, k }) {
          const r = new EventRecorder("230-inorder");
          const root = treeFromLevelOrder(values);
          let count = 0;
          let ans = 0;
          showTree(r, root, `Inorder traversal — stop at k=${k}.`, { vars: { k, count } });

          function inorder(node: TreeNode | null) {
            if (!node || count >= k) return;
            inorder(node.left ?? null);
            count += 1;
            showTree(r, root, `Visit ${node.value}: count=${count}.`, {
              nodes: [node.id],
              vars: { count, k },
              line: 4,
            });
            if (count === k) ans = node.value as number;
            inorder(node.right ?? null);
          }

          inorder(root);
          showTree(r, root, `${k}-th smallest = ${ans}.`, { vars: { answer: ans } });
          r.returnValue(ans, { description: `Kth smallest: ${ans}.` });
          r.done(ans);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 235,
    title: "Lowest Common Ancestor of a Binary Search Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "bst", "lca"],
    inputSchema: "tree-array",
    statement: `# 235. Lowest Common Ancestor of a BST

Find the lowest common ancestor of two nodes in a BST.`,
    testcases: [
      { label: "Example 1", input: { values: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 } },
      { label: "Example 2", input: { values: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 } },
    ],
    solutions: [
      sol<LcaIn>({
        id: "235-bst-walk",
        name: "BST Walk",
        time: "O(h)",
        space: "O(1)",
        code: `function lowestCommonAncestor(root, p, q): TreeNode {
  while (root) {
    if (p.val < root.val && q.val < root.val) root = root.left;
    else if (p.val > root.val && q.val > root.val) root = root.right;
    else return root;
  }
}`,
        execute({ values, p, q }) {
          const r = new EventRecorder("235-bst-walk");
          const root = treeFromLevelOrder(values);
          let cur: TreeNode | null = root;
          showTree(r, root, `Find LCA of p=${p} and q=${q} using BST ordering.`, { vars: { p, q } });

          while (cur) {
            showTree(r, root, `At ${cur.value}: compare with p=${p}, q=${q}.`, {
              nodes: [cur.id],
              line: 3,
              vars: { current: cur.value },
            });
            if (p < (cur.value as number) && q < (cur.value as number)) {
              showTree(r, root, `Both targets left of ${cur.value} — go left.`, { nodes: [cur.id] });
              cur = cur.left ?? null;
            } else if (p > (cur.value as number) && q > (cur.value as number)) {
              showTree(r, root, `Both targets right of ${cur.value} — go right.`, { nodes: [cur.id] });
              cur = cur.right ?? null;
            } else {
              showTree(r, root, `Split at ${cur.value} — LCA found.`, { nodes: [cur.id] });
              break;
            }
          }

          const result = cur?.value ?? null;
          r.returnValue(result, { description: `LCA value: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 236,
    title: "Lowest Common Ancestor of a Binary Tree",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "dfs", "lca"],
    inputSchema: "tree-array",
    statement: `# 236. Lowest Common Ancestor of a Binary Tree

Find the lowest common ancestor of two nodes in a general binary tree.`,
    testcases: [
      { label: "Example 1", input: { values: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 } },
      { label: "Example 2", input: { values: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 4 } },
    ],
    solutions: [
      sol<LcaIn>({
        id: "236-post-order",
        name: "Post-Order Search",
        time: "O(n)",
        space: "O(h)",
        code: `function lowestCommonAncestor(root, p, q): TreeNode {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left || right;
}`,
        execute({ values, p, q }) {
          const r = new EventRecorder("236-post-order");
          const root = treeFromLevelOrder(values);
          const pNode = findNode(root, p);
          const qNode = findNode(root, q);
          showTree(r, root, `Post-order search for LCA of ${p} and ${q}.`, { vars: { p, q } });

          function lca(node: TreeNode | null): TreeNode | null {
            if (!node || node === pNode || node === qNode) {
              if (node) showTree(r, root, `Hit target or null at ${node.value}.`, { nodes: [node.id], line: 2 });
              return node;
            }
            showTree(r, root, `Recurse from ${node.value}.`, { nodes: [node.id], line: 3 });
            const left = lca(node.left ?? null);
            const right = lca(node.right ?? null);
            if (left && right) {
              showTree(r, root, `Found both sides under ${node.value} — LCA.`, { nodes: [node.id], line: 5 });
              return node;
            }
            const ans = left ?? right;
            if (ans) showTree(r, root, `Propagate ${ans.value} upward from ${node.value}.`, { nodes: [node.id, ans.id] });
            return ans;
          }

          const result = lca(root);
          showTree(r, root, `LCA = ${result?.value}.`, { nodes: result ? [result.id] : [] });
          r.returnValue(result?.value ?? null, { description: `LCA: ${result?.value}.` });
          r.done(result?.value ?? null);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 257,
    title: "Binary Tree Paths",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "backtracking"],
    inputSchema: "tree-array",
    statement: `# 257. Binary Tree Paths

Return all root-to-leaf paths as strings.`,
    testcases: [
      { label: "Example 1", input: { values: [1, 2, 3, null, 5] } },
      { label: "Single", input: { values: [1] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "257-dfs-paths",
        name: "DFS Backtrack",
        time: "O(n)",
        space: "O(h)",
        code: `function binaryTreePaths(root): string[] {
  const out = [];
  function dfs(node, path) {
    if (!node) return;
    path += node.val;
    if (!node.left && !node.right) out.push(path);
    else { dfs(node.left, path + "->"); dfs(node.right, path + "->"); }
  }
  dfs(root, "");
  return out;
}`,
        execute({ values }) {
          const r = new EventRecorder("257-dfs-paths");
          const root = treeFromLevelOrder(values);
          const paths: string[] = [];
          showTree(r, root, "Collect root-to-leaf paths via DFS.", { array: [] });

          function dfs(node: TreeNode | null, path: string) {
            if (!node) return;
            const cur = path + node.value;
            showTree(r, root, `Extend path to ${node.value}: "${cur}".`, {
              nodes: [node.id],
              array: paths,
              vars: { currentPath: cur },
            });
            if (!node.left && !node.right) {
              paths.push(cur);
              showTree(r, root, `Leaf — record path "${cur}".`, { array: [...paths] });
              return;
            }
            dfs(node.left ?? null, cur + "->");
            dfs(node.right ?? null, cur + "->");
          }

          dfs(root, "");
          showTree(r, root, `${paths.length} path(s) found.`, { array: paths });
          r.returnValue(paths, { description: `Paths: ${paths.join("; ")}.` });
          r.done(paths);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 543,
    title: "Diameter of Binary Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs"],
    inputSchema: "tree-array",
    statement: `# 543. Diameter of Binary Tree

Return the length of the longest path between any two nodes (edges count).`,
    testcases: [
      { label: "Example 1", input: { values: [1, 2, 3, 4, 5] } },
      { label: "Two nodes", input: { values: [1, 2] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "543-diameter",
        name: "Height Tracking",
        time: "O(n)",
        space: "O(h)",
        code: `function diameterOfBinaryTree(root): number {
  let best = 0;
  function height(node): number {
    if (!node) return 0;
    const l = height(node.left), r = height(node.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  }
  height(root);
  return best;
}`,
        execute({ values }) {
          const r = new EventRecorder("543-diameter");
          const root = treeFromLevelOrder(values);
          let best = 0;
          showTree(r, root, "Diameter = max leftHeight + rightHeight at any node.", { vars: { diameter: best } });

          function height(node: TreeNode | null): number {
            if (!node) return 0;
            const l = height(node.left ?? null);
            const rt = height(node.right ?? null);
            best = Math.max(best, l + rt);
            showTree(r, root, `At ${node.value}: span ${l}+${rt}=${l + rt}; best=${best}.`, {
              nodes: [node.id],
              vars: { diameter: best },
              line: 4,
            });
            return 1 + Math.max(l, rt);
          }

          if (root) height(root);
          showTree(r, root, `Diameter = ${best} edges.`, { vars: { diameter: best } });
          r.returnValue(best, { description: `Diameter: ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 572,
    title: "Subtree of Another Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs"],
    inputSchema: "tree-array",
    statement: `# 572. Subtree of Another Tree

Return true if subRoot is a subtree of root.`,
    testcases: [
      { label: "True", input: { values1: [3, 4, 5, 1, 2], values2: [4, 1, 2] } },
      { label: "False", input: { values1: [3, 4, 5, 1, 2, null, null, 0], values2: [4, 1, 2] } },
    ],
    solutions: [
      sol<TwoTrees>({
        id: "572-subtree",
        name: "Match at Each Node",
        time: "O(m·n)",
        space: "O(h)",
        code: `function isSubtree(root, subRoot): boolean {
  if (!root) return false;
  if (sameTree(root, subRoot)) return true;
  return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}`,
        execute({ values1, values2 }) {
          const r = new EventRecorder("572-subtree");
          const root = treeFromLevelOrder(values1);
          const sub = treeFromLevelOrder(values2);
          showTree(r, root, "Check if subRoot matches any subtree of root.", { vars: { subRoot: values2 } });

          function same(a: TreeNode | null, b: TreeNode | null): boolean {
            if (!a && !b) return true;
            if (!a || !b || a.value !== b.value) return false;
            return same(a.left ?? null, b.left ?? null) && same(a.right ?? null, b.right ?? null);
          }

          function isSub(node: TreeNode | null): boolean {
            if (!node) return false;
            showTree(r, root, `Try match starting at ${node.value}.`, { nodes: [node.id], line: 2 });
            if (same(node, sub)) {
              showTree(r, root, `Subtree matches at ${node.value}.`, { nodes: [node.id] });
              return true;
            }
            return isSub(node.left ?? null) || isSub(node.right ?? null);
          }

          const result = isSub(root);
          showTree(r, root, result ? "subRoot is a subtree." : "subRoot is not a subtree.", {});
          r.returnValue(result, { description: `Is subtree: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 617,
    title: "Merge Two Binary Trees",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "dfs", "recursion"],
    inputSchema: "tree-array",
    statement: `# 617. Merge Two Binary Trees

Merge two trees by summing overlapping nodes; attach non-null nodes where one side is missing.`,
    testcases: [
      { label: "Example 1", input: { values1: [1, 3, 2, 5], values2: [2, 1, 3, null, 4, null, 7] } },
    ],
    solutions: [
      sol<TwoTrees>({
        id: "617-merge",
        name: "Recursive Merge",
        time: "O(n)",
        space: "O(h)",
        code: `function mergeTrees(t1, t2): TreeNode {
  if (!t1) return t2;
  if (!t2) return t1;
  t1.val += t2.val;
  t1.left = mergeTrees(t1.left, t2.left);
  t1.right = mergeTrees(t1.right, t2.right);
  return t1;
}`,
        execute({ values1, values2 }) {
          const r = new EventRecorder("617-merge");
          const t1 = treeFromLevelOrder(values1);
          const t2 = treeFromLevelOrder(values2);
          showTree(r, t1, "Merge t1 with t2 by summing overlapping nodes.", { vars: { t2: values2 } });

          function merge(a: TreeNode | null, b: TreeNode | null): TreeNode | null {
            if (!a && !b) return null;
            if (!a) {
              showTree(r, a, "Only t2 node remains — attach it.", {});
              return b ? cloneTree(b) : null;
            }
            if (!b) {
              showTree(r, a, "Only t1 node remains — keep it.", { nodes: [a.id] });
              return a;
            }
            const sum = (a.value as number) + (b.value as number);
            showTree(r, a, `Sum ${a.value} + ${b.value} = ${sum}.`, { nodes: [a.id, b.id], line: 4 });
            a.value = sum;
            a.left = merge(a.left ?? null, b.left ?? null);
            a.right = merge(a.right ?? null, b.right ?? null);
            showTree(r, a, `Merged subtree at ${sum}.`, { nodes: [a.id] });
            return a;
          }

          const result = merge(t1, t2);
          showTree(r, result, "Merged tree complete.", {});
          r.returnValue("merged", { description: "Trees merged." });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),
];
