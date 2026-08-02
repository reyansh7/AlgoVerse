import type { TreeNode } from "@/core/types/structures";

/** Build a binary tree from level-order values (null = missing). */
export function treeFromLevelOrder(values: (number | null)[]): TreeNode | null {
  if (!values.length || values[0] == null) return null;
  const root: TreeNode = { id: "n0", value: values[0] };
  const queue: TreeNode[] = [root];
  let i = 1;
  let id = 1;
  while (queue.length && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length) {
      const v = values[i++];
      if (v != null) {
        node.left = { id: `n${id++}`, value: v };
        queue.push(node.left);
      }
    }
    if (i < values.length) {
      const v = values[i++];
      if (v != null) {
        node.right = { id: `n${id++}`, value: v };
        queue.push(node.right);
      }
    }
  }
  return root;
}

export function listFromArray(arr: number[]) {
  const nodes = arr.map((value, i) => ({
    id: `n${i}`,
    value,
    next: i < arr.length - 1 ? `n${i + 1}` : null,
  }));
  return { head: nodes.length ? "n0" : null, nodes };
}
