import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, treeFromLevelOrder } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";
import type { TreeNode } from "@/core/types/structures";

type TreeIn = { values: (number | null)[] };
type SortedArr = { array: number[] };
type BstDelete = { values: (number | null)[]; key: number };
type BstSearch = { values: (number | null)[]; target: number };
type BstInsert = { values: (number | null)[]; val: number };

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
  } = {},
) {
  r.setStructure(
    {
      tree: tree ? cloneTree(tree) : null,
      ...(opts.array ? { array: [...opts.array] } : {}),
    },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  if (opts.nodes?.length) r.highlight({ nodes: opts.nodes, description });
}

export const bstFamily: ProblemPackage[] = [
  createProblem({
    id: 98,
    title: "Validate Binary Search Tree",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "bst", "dfs"],
    inputSchema: "tree-array",
    statement: `# 98. Validate Binary Search Tree

Return true if the tree is a valid BST (all left < node < all right).`,
    testcases: [
      { label: "Valid", input: { values: [2, 1, 3] } },
      { label: "Invalid", input: { values: [5, 1, 4, null, null, 3, 6] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "98-bounds",
        name: "Min/Max Bounds",
        time: "O(n)",
        space: "O(h)",
        code: `function isValidBST(root): boolean {
  function valid(node, lo, hi): boolean {
    if (!node) return true;
    if (node.val <= lo || node.val >= hi) return false;
    return valid(node.left, lo, node.val) && valid(node.right, node.val, hi);
  }
  return valid(root, -Infinity, Infinity);
}`,
        execute({ values }) {
          const r = new EventRecorder("98-bounds");
          const root = treeFromLevelOrder(values);
          showTree(r, root, "Validate BST with (lo, hi) bounds at each node.", { vars: { valid: true } });

          function valid(node: TreeNode | null, lo: number, hi: number): boolean {
            if (!node) return true;
            const v = node.value as number;
            showTree(r, root, `Check ${v} in (${lo}, ${hi}).`, {
              nodes: [node.id],
              vars: { lo, hi, val: v },
              line: 3,
            });
            if (v <= lo || v >= hi) {
              showTree(r, root, `${v} violates bounds — invalid BST.`, { nodes: [node.id], vars: { valid: false } });
              return false;
            }
            return valid(node.left ?? null, lo, v) && valid(node.right ?? null, v, hi);
          }

          const result = valid(root, -Infinity, Infinity);
          showTree(r, root, result ? "Valid BST." : "Not a valid BST.", { vars: { valid: result } });
          r.returnValue(result, { description: `Valid BST: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 108,
    title: "Convert Sorted Array to Binary Search Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "bst", "divide-and-conquer"],
    inputSchema: "array",
    statement: `# 108. Convert Sorted Array to Binary Search Tree

Build a height-balanced BST from a sorted array.`,
    testcases: [
      { label: "Example 1", input: { array: [-10, -3, 0, 5, 9] } },
      { label: "Single", input: { array: [1] } },
    ],
    solutions: [
      sol<SortedArr>({
        id: "108-balanced",
        name: "Mid-Root Divide",
        time: "O(n)",
        space: "O(log n)",
        code: `function sortedArrayToBST(nums): TreeNode {
  function build(lo, hi): TreeNode {
    if (lo > hi) return null;
    const mid = (lo + hi) >> 1;
    const node = new TreeNode(nums[mid]);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  }
  return build(0, nums.length - 1);
}`,
        execute({ array }) {
          const r = new EventRecorder("108-balanced");
          let idCounter = 0;
          showArray(r, array, "Pick mid element as root for balanced BST.", {});

          function build(lo: number, hi: number): TreeNode | null {
            if (lo > hi) {
              showArray(r, array, `Empty range [${lo},${hi}] — null.`, { line: 2 });
              return null;
            }
            const mid = (lo + hi) >> 1;
            const node: TreeNode = { id: `n${idCounter++}`, value: array[mid] };
            showArray(r, array, `Root at mid index ${mid} → value ${array[mid]}.`, {
              line: 4,
              kinds: { [mid]: "found" },
              vars: { lo, hi, mid },
            });
            node.left = build(lo, mid - 1);
            node.right = build(mid + 1, hi);
            showTree(r, node, `Subtree rooted at ${node.value} built.`, { nodes: [node.id] });
            return node;
          }

          const result = build(0, array.length - 1);
          showTree(r, result, "Height-balanced BST complete.", {});
          r.returnValue(result ? "bst" : null, { description: "BST built from sorted array." });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 450,
    title: "Delete Node in a BST",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "bst"],
    inputSchema: "tree-array",
    statement: `# 450. Delete Node in a BST

Delete a node with the given key and return the root.`,
    testcases: [
      { label: "Example 1", input: { values: [5, 3, 6, 2, 4, null, 7], key: 3 } },
      { label: "Leaf", input: { values: [5, 3, 6, 2, 4, null, 7], key: 7 } },
    ],
    solutions: [
      sol<BstDelete>({
        id: "450-delete",
        name: "Standard BST Delete",
        time: "O(h)",
        space: "O(h)",
        code: `function deleteNode(root, key): TreeNode {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}`,
        execute({ values, key }) {
          const r = new EventRecorder("450-delete");
          const root = treeFromLevelOrder(values);
          showTree(r, root, `Delete key ${key} from BST.`, { vars: { key } });

          function del(node: TreeNode | null): TreeNode | null {
            if (!node) {
              showTree(r, root, `Key ${key} not found.`, { line: 2 });
              return null;
            }
            showTree(r, root, `Search at ${node.value}.`, { nodes: [node.id], line: 3 });
            if (key < (node.value as number)) {
              node.left = del(node.left ?? null);
              return node;
            }
            if (key > (node.value as number)) {
              node.right = del(node.right ?? null);
              return node;
            }
            showTree(r, root, `Found ${key} — remove node.`, { nodes: [node.id], line: 6 });
            if (!node.left) {
              showTree(r, node.right ?? null, "No left child — promote right.", {});
              return node.right ?? null;
            }
            if (!node.right) {
              showTree(r, node.left ?? null, "No right child — promote left.", {});
              return node.left ?? null;
            }
            const succVal = ((): number => {
              let s = node.right!;
              while (s.left) s = s.left;
              return s.value as number;
            })();
            showTree(r, root, `Two children — replace with inorder successor ${succVal}.`, {
              nodes: [node.id],
              line: 9,
            });
            node.value = succVal;
            node.right = delSuccessor(node.right ?? null);
            return node;
          }

          function delSuccessor(node: TreeNode | null): TreeNode | null {
            if (!node!.left) {
              const right = node!.right ?? null;
              showTree(r, root, `Remove successor leaf ${node!.value}.`, { nodes: [node!.id] });
              return right;
            }
            node!.left = delSuccessor(node!.left ?? null);
            return node;
          }

          const result = del(root);
          showTree(r, result, `BST after deleting ${key}.`, {});
          r.returnValue("deleted", { description: `Deleted ${key}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 530,
    title: "Minimum Absolute Difference in BST",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "bst", "inorder"],
    inputSchema: "tree-array",
    statement: `# 530. Minimum Absolute Difference in BST

Return the minimum absolute difference between values of any two nodes in a BST.`,
    testcases: [
      { label: "Example 1", input: { values: [4, 2, 6, 1, 3] } },
      { label: "Chain", input: { values: [1, 0, 48, null, null, 12, 49] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "530-inorder",
        name: "Inorder Min Gap",
        time: "O(n)",
        space: "O(h)",
        code: `function getMinimumDifference(root): number {
  let prev = -Infinity, best = Infinity;
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    best = Math.min(best, node.val - prev);
    prev = node.val;
    inorder(node.right);
  }
  inorder(root);
  return best;
}`,
        execute({ values }) {
          const r = new EventRecorder("530-inorder");
          const root = treeFromLevelOrder(values);
          let prev = -Infinity;
          let best = Infinity;
          showTree(r, root, "Inorder gives sorted values — track min adjacent gap.", { vars: { best } });

          function inorder(node: TreeNode | null) {
            if (!node) return;
            inorder(node.left ?? null);
            const gap = (node.value as number) - prev;
            if (prev !== -Infinity) best = Math.min(best, gap);
            showTree(r, root, `Visit ${node.value}: gap from prev ${prev === -Infinity ? "−∞" : prev} = ${prev === -Infinity ? "—" : gap}; best=${best}.`, {
              nodes: [node.id],
              vars: { prev, best, gap: prev === -Infinity ? null : gap },
              line: 4,
            });
            prev = node.value as number;
            inorder(node.right ?? null);
          }

          inorder(root);
          showTree(r, root, `Minimum absolute difference = ${best}.`, { vars: { best } });
          r.returnValue(best, { description: `Min diff: ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 700,
    title: "Search in a Binary Search Tree",
    difficulty: "easy",
    category: "tree",
    tags: ["tree", "bst"],
    inputSchema: "tree-array",
    statement: `# 700. Search in a Binary Search Tree

Find the node with the given value in a BST.`,
    testcases: [
      { label: "Found", input: { values: [4, 2, 7, 1, 3], target: 2 } },
      { label: "Not found", input: { values: [4, 2, 7, 1, 3], target: 5 } },
    ],
    solutions: [
      sol<BstSearch>({
        id: "700-search",
        name: "BST Descent",
        time: "O(h)",
        space: "O(1)",
        code: `function searchBST(root, val): TreeNode {
  while (root && root.val !== val) {
    root = val < root.val ? root.left : root.right;
  }
  return root;
}`,
        execute({ values, target }) {
          const r = new EventRecorder("700-search");
          let cur = treeFromLevelOrder(values);
          showTree(r, cur, `Search for ${target} using BST property.`, { vars: { target } });

          while (cur && cur.value !== target) {
            showTree(r, cur, `At ${cur.value}: ${target} ${target < (cur.value as number) ? "<" : ">"} ${cur.value}.`, {
              nodes: [cur.id],
              line: 3,
            });
            cur = target < (cur.value as number) ? (cur.left ?? null) : (cur.right ?? null);
          }

          if (cur) {
            showTree(r, cur, `Found ${target} at node ${cur.id}.`, { nodes: [cur.id] });
          } else {
            showTree(r, null, `${target} not in BST.`, {});
          }
          r.returnValue(cur?.value ?? null, { description: cur ? `Found ${target}.` : "Not found." });
          r.done(cur?.value ?? null);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 701,
    title: "Insert into a Binary Search Tree",
    difficulty: "medium",
    category: "tree",
    tags: ["tree", "bst"],
    inputSchema: "bst-insert",
    statement: `# 701. Insert into a Binary Search Tree

Insert val into the BST and return the root.`,
    testcases: [
      { label: "Example 1", input: { values: [4, 2, 7, 1, 3], val: 5 } },
      { label: "Empty", input: { values: [], val: 4 } },
    ],
    solutions: [
      sol<BstInsert>({
        id: "701-insert",
        name: "Recursive Insert",
        time: "O(h)",
        space: "O(h)",
        code: `function insertIntoBST(root, val): TreeNode {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;
}`,
        execute({ values, val }) {
          const r = new EventRecorder("701-insert");
          let idCounter = 0;
          let root = treeFromLevelOrder(values);
          showTree(r, root, `Insert ${val} preserving BST order.`, { vars: { val } });

          function insert(node: TreeNode | null): TreeNode {
            if (!node) {
              const n: TreeNode = { id: `n${idCounter++}`, value: val };
              r.insertNode(n.id, { value: val, description: `Create new node ${val}.` });
              showTree(r, n, `Inserted leaf ${val}.`, { nodes: [n.id], line: 2 });
              return n;
            }
            showTree(r, root, `Compare ${val} with ${node.value}.`, { nodes: [node.id], line: 3 });
            if (val < (node.value as number)) node.left = insert(node.left ?? null);
            else node.right = insert(node.right ?? null);
            return node;
          }

          root = values.length ? insert(root) : insert(null);
          showTree(r, root, `BST after inserting ${val}.`, {});
          r.returnValue("inserted", { description: `Inserted ${val}.` });
          r.done(root);
          return r.getEvents();
        },
      }),
    ],
  }),
];
