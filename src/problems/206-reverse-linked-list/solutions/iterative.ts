import { EventRecorder } from "@/engine/events/recorder";
import type { ExecutionEvent } from "@/engine/events/types";
import type { ReferenceSolution } from "@/problems/types";
import { listFromArray } from "@/problems/lib/array-from-tree";

function reverseEvents(
  algorithmId: string,
  array: number[],
  label: string,
): ExecutionEvent[] {
  const r = new EventRecorder(algorithmId);
  let list = listFromArray(array);
  r.setStructure(
    { linkedList: list },
    { description: `${label}: reverse the linked list.` },
  );

  const nodes = list.nodes.map((n) => ({ ...n }));
  let prev: string | null = null;
  let cur: string | null = list.head;

  while (cur) {
    const node = nodes.find((n) => n.id === cur)!;
    const next = node.next ?? null;
    r.visitNode(cur, undefined, {
      description: `Reverse link at ${node.value}.`,
    });
    node.next = prev;
    prev = cur;
    cur = next;
    list = { head: prev, nodes: nodes.map((n) => ({ ...n })) };
    r.setStructure(
      { linkedList: list },
      { description: `prev=${prev}, cur=${cur}.` },
    );
  }
  r.returnValue(prev);
  r.done(prev);
  return r.getEvents();
}

export const reverseListIterative: ReferenceSolution<{ array: number[] }> = {
  id: "206-iterative",
  name: "Iterative Reverse",
  approach: "iterative",
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  code: `function reverseList(head: ListNode | null): ListNode | null {
  let prev = null;
  let cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}`,
  execute({ array }) {
    return reverseEvents("206-iterative", array, "Iterative");
  },
};

export const reverseListRecursive: ReferenceSolution<{ array: number[] }> = {
  id: "206-recursive",
  name: "Recursive Reverse",
  approach: "recursive",
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  code: `function reverseList(head: ListNode | null): ListNode | null {
  if (!head || !head.next) return head;
  const newHead = reverseList(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}`,
  execute({ array }) {
    return reverseEvents("206-recursive", array, "Recursive");
  },
};
