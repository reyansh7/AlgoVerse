import type { AlgorithmAdapter } from "../../types/execution";
import type { LinkedListData, ListNode } from "../../types/structures";
import { SnapshotBuilder } from "../snapshot";

export type ListOp =
  | { type: "traverse" }
  | { type: "insert"; value: number; index: number }
  | { type: "delete"; index: number };

export interface LinkedListInput {
  values: number[];
  operations: ListOp[];
}

function buildList(values: number[]): LinkedListData {
  const nodes: ListNode[] = values.map((value, i) => ({
    id: `n${i}`,
    value,
    next: i < values.length - 1 ? `n${i + 1}` : null,
  }));
  return { head: nodes[0]?.id ?? null, nodes };
}

function cloneList(list: LinkedListData): LinkedListData {
  return {
    head: list.head,
    nodes: list.nodes.map((n) => ({ ...n })),
  };
}

export const linkedListAdapter: AlgorithmAdapter<LinkedListInput> = {
  id: "linked-list-ops",
  execute({ values, operations }) {
    const b = new SnapshotBuilder("linked-list-ops");
    let list = buildList(values);
    let idCounter = values.length;

    b.emit({
      line: 0,
      variables: { head: list.head },
      structures: { linkedList: cloneList(list) },
      highlights: {
        nodes: list.head ? [list.head] : [],
        edges: [],
        indices: [],
      },
      operation: "init",
      description: "Initialize linked list.",
    });

    for (const op of operations) {
      if (op.type === "traverse") {
        let current = list.head;
        while (current) {
          const node = list.nodes.find((n) => n.id === current)!;
          b.emit({
            line: 2,
            variables: { current: node.value, pointer: current },
            structures: { linkedList: cloneList(list) },
            highlights: { nodes: [current], edges: [], indices: [] },
            operation: "traverse",
            description: `Pointer at node ${node.value}.`,
          });
          current = node.next ?? null;
        }
      }

      if (op.type === "insert") {
        const newId = `n${idCounter++}`;
        const newNode: ListNode = { id: newId, value: op.value, next: null };

        if (op.index <= 0 || !list.head) {
          newNode.next = list.head;
          list.nodes.unshift(newNode);
          list.head = newId;
        } else {
          let prevId: string | null = list.head;
          let i = 0;
          while (prevId && i < op.index - 1) {
            const prev = list.nodes.find((n) => n.id === prevId)!;
            b.emit({
              line: 4,
              variables: { index: op.index, value: op.value, at: prev.value },
              structures: { linkedList: cloneList(list) },
              highlights: { nodes: [prevId], edges: [], indices: [] },
              operation: "traverse",
              description: `Walk to insertion point (index ${op.index}).`,
            });
            prevId = prev.next ?? null;
            i++;
          }
          const prev = list.nodes.find((n) => n.id === prevId);
          if (prev) {
            newNode.next = prev.next ?? null;
            prev.next = newId;
            list.nodes.push(newNode);
          } else {
            list.nodes.push(newNode);
          }
        }

        b.emit({
          line: 5,
          variables: { index: op.index, value: op.value },
          structures: { linkedList: cloneList(list) },
          highlights: { nodes: [newId], edges: [], indices: [] },
          operation: "insert",
          description: `Insert ${op.value} at index ${op.index}.`,
        });
      }

      if (op.type === "delete") {
        if (!list.head) continue;
        if (op.index <= 0) {
          const removed = list.head;
          const head = list.nodes.find((n) => n.id === list.head)!;
          list.head = head.next ?? null;
          list.nodes = list.nodes.filter((n) => n.id !== removed);
          b.emit({
            line: 7,
            variables: { index: op.index },
            structures: { linkedList: cloneList(list) },
            highlights: {
              nodes: list.head ? [list.head] : [],
              edges: [],
              indices: [],
            },
            operation: "delete",
            description: "Delete head node.",
          });
        } else {
          let prevId: string | null = list.head;
          let i = 0;
          while (prevId && i < op.index - 1) {
            const prev = list.nodes.find((n) => n.id === prevId)!;
            b.emit({
              line: 6,
              variables: { index: op.index, at: prev.value },
              structures: { linkedList: cloneList(list) },
              highlights: { nodes: [prevId], edges: [], indices: [] },
              operation: "traverse",
              description: `Walk to node before index ${op.index}.`,
            });
            prevId = prev.next ?? null;
            i++;
          }
          const prev = list.nodes.find((n) => n.id === prevId);
          if (prev?.next) {
            const removeId = prev.next;
            const remove = list.nodes.find((n) => n.id === removeId)!;
            prev.next = remove.next ?? null;
            list.nodes = list.nodes.filter((n) => n.id !== removeId);
            b.emit({
              line: 7,
              variables: { index: op.index, removed: remove.value },
              structures: { linkedList: cloneList(list) },
              highlights: {
                nodes: prevId ? [prevId] : [],
                edges: [],
                indices: [],
              },
              operation: "delete",
              description: `Delete node ${remove.value}.`,
            });
          }
        }
      }
    }

    b.emit({
      line: 8,
      variables: { head: list.head },
      structures: { linkedList: cloneList(list) },
      operation: "done",
      description: "Linked list operations complete.",
    });

    return b.build();
  },
};
