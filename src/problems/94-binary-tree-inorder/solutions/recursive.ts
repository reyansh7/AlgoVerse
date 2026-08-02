import { EventRecorder } from "@/engine/events/recorder";
import type { TreeNode } from "@/core/types/structures";
import type { ReferenceSolution } from "@/problems/types";
import { treeFromLevelOrder } from "@/problems/lib/array-from-tree";

export interface TreeArrayInput {
  values: (number | null)[];
}

export const inorderRecursive: ReferenceSolution<TreeArrayInput> = {
  id: "94-recursive",
  name: "Recursive Inorder",
  approach: "recursive",
  timeComplexity: "O(n)",
  spaceComplexity: "O(h)",
  code: `function inorder(root): number[] {
  const out: number[] = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    out.push(node.val);
    dfs(node.right);
  }
  dfs(root);
  return out;
}`,
  execute({ values }) {
    const r = new EventRecorder("94-recursive");
    const root = treeFromLevelOrder(values);
    const out: (number | string)[] = [];
    r.setStructure({ tree: root, array: [] }, { description: "Inorder: Left → Root → Right." });

    function dfs(node: TreeNode | null | undefined) {
      if (!node) return;
      r.visitNode(node.id, undefined, {
        line: 4,
        description: `Enter node ${node.value}.`,
      });
      dfs(node.left);
      out.push(node.value);
      r.setStructure(
        { tree: root, array: [...out] },
        { line: 5, description: `Visit ${node.value} → output [${out.join(", ")}].` },
      );
      r.highlight({ nodes: [node.id], kinds: {} });
      dfs(node.right);
    }

    dfs(root);
    r.returnValue(out);
    r.done(out);
    return r.getEvents();
  },
};

export const inorderIterative: ReferenceSolution<TreeArrayInput> = {
  id: "94-iterative",
  name: "Iterative Inorder",
  approach: "iterative",
  timeComplexity: "O(n)",
  spaceComplexity: "O(h)",
  code: `function inorder(root): number[] {
  const out: number[] = [];
  const stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur);
      cur = cur.left;
    }
    cur = stack.pop();
    out.push(cur.val);
    cur = cur.right;
  }
  return out;
}`,
  execute({ values }) {
    const r = new EventRecorder("94-iterative");
    const root = treeFromLevelOrder(values);
    const out: (number | string)[] = [];
    const stack: TreeNode[] = [];
    let cur: TreeNode | null | undefined = root;
    r.setStructure({ tree: root, stack: [], array: [] }, { description: "Iterative inorder with stack." });

    while (cur || stack.length) {
      while (cur) {
        stack.push(cur);
        r.push(String(cur.value), { description: `Push ${cur.value}.` });
        r.setStructure({
          tree: root,
          stack: stack.map((n) => n.value),
          array: [...out],
        });
        r.visitNode(cur.id);
        cur = cur.left;
      }
      cur = stack.pop();
      if (!cur) break;
      r.pop(String(cur.value), { description: `Pop ${cur.value} and visit.` });
      out.push(cur.value);
      r.setStructure({
        tree: root,
        stack: stack.map((n) => n.value),
        array: [...out],
      });
      r.visitNode(cur.id, undefined, {
        description: `Output ${cur.value}.`,
      });
      cur = cur.right;
    }
    r.returnValue(out);
    r.done(out);
    return r.getEvents();
  },
};
