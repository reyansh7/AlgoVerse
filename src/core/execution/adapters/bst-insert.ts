import type { AlgorithmAdapter } from "../../types/execution";
import type { TreeNode } from "../../types/structures";
import { SnapshotBuilder } from "../snapshot";

export interface BstInsertInput {
  values: number[];
}

function cloneTree(node: TreeNode | null | undefined): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

export const bstInsertAdapter: AlgorithmAdapter<BstInsertInput> = {
  id: "bst-insert",
  execute({ values }) {
    const b = new SnapshotBuilder("bst-insert");
    let root: TreeNode | null = null;
    let counter = 0;

    b.emit({
      line: 0,
      variables: { values },
      structures: { tree: null },
      operation: "init",
      description: "Start BST insertions.",
    });

    function insertInto(
      node: TreeNode,
      value: number,
    ): { id: string; parentId: string } {
      b.emit({
        line: 4,
        variables: { value, current: node.value },
        structures: { tree: cloneTree(root) },
        highlights: { nodes: [node.id], edges: [], indices: [] },
        operation: "traverse",
        description: `Compare ${value} with ${node.value}.`,
      });

      if (value < (node.value as number)) {
        if (!node.left) {
          const created: TreeNode = { id: `t${counter++}`, value };
          node.left = created;
          b.emit({
            line: 3,
            variables: { value, created: created.id, parent: node.value },
            structures: { tree: cloneTree(root) },
            highlights: {
              nodes: [created.id, node.id],
              edges: [],
              indices: [],
            },
            operation: "insert",
            description: `Create node ${value} as left child of ${node.value}.`,
          });
          return { id: created.id, parentId: node.id };
        }
        return insertInto(node.left, value);
      }

      if (!node.right) {
        const created: TreeNode = { id: `t${counter++}`, value };
        node.right = created;
        b.emit({
          line: 3,
          variables: { value, created: created.id, parent: node.value },
          structures: { tree: cloneTree(root) },
          highlights: {
            nodes: [created.id, node.id],
            edges: [],
            indices: [],
          },
          operation: "insert",
          description: `Create node ${value} as right child of ${node.value}.`,
        });
        return { id: created.id, parentId: node.id };
      }
      return insertInto(node.right, value);
    }

    for (const value of values) {
      b.emit({
        line: 1,
        variables: { inserting: value },
        structures: { tree: cloneTree(root) },
        operation: "start-insert",
        description: `Insert value ${value}.`,
      });

      if (!root) {
        root = { id: `t${counter++}`, value };
        b.emit({
          line: 2,
          variables: { value },
          structures: { tree: cloneTree(root) },
          highlights: { nodes: [root.id], edges: [], indices: [] },
          operation: "insert",
          description: `Create root ${value}.`,
        });
      } else {
        const created = insertInto(root, value);
        b.emit({
          line: 6,
          variables: { value },
          structures: { tree: cloneTree(root) },
          highlights: {
            nodes: [created.id, created.parentId],
            edges: [],
            indices: [],
          },
          operation: "inserted",
          description: `Inserted ${value} into BST.`,
        });
      }
    }

    b.emit({
      line: 7,
      variables: {},
      structures: { tree: cloneTree(root) },
      operation: "done",
      description: "BST construction complete.",
    });

    return b.build();
  },
};
