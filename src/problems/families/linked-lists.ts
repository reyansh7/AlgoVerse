import { EventRecorder } from "@/engine/events/recorder";
import type { LinkedListData } from "@/core/types/structures";
import { createProblem, sol } from "@/problems/define";
import { listFromArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type ListIn = { array: number[] };
type ListN = { array: number[]; n: number };
type ListCycle = { array: number[]; pos: number };
type TwoLists = { array1: number[]; array2: number[] };
type ListK = { array: number[]; k: number };

function cloneList(list: LinkedListData): LinkedListData {
  return {
    head: list.head,
    nodes: list.nodes.map((n) => ({ ...n })),
  };
}

function listWithCycle(arr: number[], pos: number): LinkedListData {
  const list = listFromArray(arr);
  if (pos >= 0 && pos < arr.length && arr.length > 0) {
    const tail = list.nodes[arr.length - 1];
    tail.next = `n${pos}`;
  }
  return list;
}

function nextOf(list: LinkedListData, id: string | null): string | null {
  if (!id) return null;
  return list.nodes.find((n) => n.id === id)?.next ?? null;
}

function showList(
  r: EventRecorder,
  list: LinkedListData,
  description: string,
  opts: { nodes?: string[]; vars?: Record<string, unknown>; line?: number } = {},
) {
  r.setStructure({ linkedList: cloneList(list) }, { line: opts.line, description });
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  if (opts.nodes?.length) {
    r.highlight({ nodes: opts.nodes, description });
  }
}

function intersectLists(a: number[], b: number[], skipA: number, skipB: number): {
  list1: LinkedListData;
  list2: LinkedListData;
} {
  const shared = a.slice(skipA);
  const prefixA = a.slice(0, skipA);
  const prefixB = b.slice(0, skipB);
  const nodes1 = prefixA.map((value, i) => ({
    id: `a${i}`,
    value,
    next: i < prefixA.length - 1 ? `a${i + 1}` : shared.length ? "s0" : null,
  }));
  const nodes2 = prefixB.map((value, i) => ({
    id: `b${i}`,
    value,
    next: i < prefixB.length - 1 ? `b${i + 1}` : shared.length ? "s0" : null,
  }));
  const sharedNodes = shared.map((value, i) => ({
    id: `s${i}`,
    value,
    next: i < shared.length - 1 ? `s${i + 1}` : null,
  }));
  return {
    list1: {
      head: nodes1.length ? "a0" : sharedNodes.length ? "s0" : null,
      nodes: [...nodes1, ...sharedNodes],
    },
    list2: {
      head: nodes2.length ? "b0" : sharedNodes.length ? "s0" : null,
      nodes: [...nodes2, ...sharedNodes],
    },
  };
}

export const linkedListFamily: ProblemPackage[] = [
  createProblem({
    id: 2,
    title: "Add Two Numbers",
    difficulty: "medium",
    category: "list",
    tags: ["linked-list", "math"],
    inputSchema: "array",
    statement: `# 2. Add Two Numbers

Add two numbers represented as linked lists (digits in reverse order).`,
    testcases: [
      { label: "Example 1", input: { array1: [2, 4, 3], array2: [5, 6, 4] } },
      { label: "Example 2", input: { array1: [0], array2: [0] } },
    ],
    solutions: [
      sol<TwoLists>({
        id: "2-digit-carry",
        name: "Digit-by-Digit Carry",
        time: "O(max(m,n))",
        space: "O(max(m,n))",
        code: `function addTwoNumbers(l1, l2) {
  let carry = 0, dummy = new ListNode(0), cur = dummy;
  while (l1 || l2 || carry) {
    const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
    cur.next = new ListNode(sum % 10);
    carry = Math.floor(sum / 10);
    l1 = l1?.next; l2 = l2?.next; cur = cur.next;
  }
  return dummy.next;
}`,
        execute({ array1, array2 }) {
          const r = new EventRecorder("2-digit-carry");
          let l1 = listFromArray(array1);
          let l2 = listFromArray(array2);
          const out: number[] = [];
          let carry = 0;
          let i1 = l1.head;
          let i2 = l2.head;
          showList(r, l1, "List 1 (reversed digits).", { vars: { l2: array2.join("→") } });
          showList(r, l2, "List 2 (reversed digits).", {});
          while (i1 || i2 || carry) {
            const v1 = i1 ? l1.nodes.find((n) => n.id === i1)!.value as number : 0;
            const v2 = i2 ? l2.nodes.find((n) => n.id === i2)!.value as number : 0;
            const sum = v1 + v2 + carry;
            const digit = sum % 10;
            carry = Math.floor(sum / 10);
            out.push(digit);
            showList(
              r,
              l1,
              `Add ${v1}+${v2}+carry → digit ${digit}, carry ${carry}. Result: [${out.join(",")}].`,
              {
                line: 3,
                nodes: [i1, i2].filter(Boolean) as string[],
                vars: { v1, v2, carry, digit, result: out },
              },
            );
            if (i1) i1 = nextOf(l1, i1);
            if (i2) i2 = nextOf(l2, i2);
          }
          const result = listFromArray(out);
          showList(r, result, `Sum list: ${out.join("→")}.`, { nodes: result.head ? [result.head] : [] });
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 19,
    title: "Remove Nth Node From End of List",
    difficulty: "medium",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 19. Remove Nth Node From End of List

Remove the nth node from the end in one pass using fast/slow pointers.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 4, 5], n: 2 } },
      { label: "Example 2", input: { array: [1], n: 1 } },
    ],
    solutions: [
      sol<ListN>({
        id: "19-two-pointer",
        name: "Fast/Slow Gap",
        time: "O(n)",
        space: "O(1)",
        code: `function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}`,
        execute({ array, n }) {
          const r = new EventRecorder("19-two-pointer");
          const list = listFromArray(array);
          const dummy: LinkedListData = {
            head: "d",
            nodes: [{ id: "d", value: 0, next: list.head }, ...list.nodes],
          };
          let fast: string | null = "d";
          let slow: string | null = "d";
          showList(r, dummy, `Create dummy node. Remove nth=${n} from end.`, {
            nodes: ["d"],
            vars: { n },
          });
          for (let i = 0; i <= n; i++) {
            showList(
              r,
              dummy,
              `Advance fast ${i + 1}/${n + 1} ahead of slow.`,
              { nodes: fast ? [fast] : [], vars: { fast, slow, step: i + 1 } },
            );
            if (fast) fast = nextOf(dummy, fast);
          }
          while (fast) {
            showList(
              r,
              dummy,
              "Move both pointers until fast reaches end.",
              { nodes: [slow!, fast], vars: { fast, slow } },
            );
            fast = nextOf(dummy, fast);
            slow = nextOf(dummy, slow);
          }
          const slowNode = dummy.nodes.find((nd) => nd.id === slow!)!;
          const removeId = slowNode.next!;
          const removeNode = dummy.nodes.find((nd) => nd.id === removeId)!;
          slowNode.next = removeNode.next ?? null;
          dummy.nodes = dummy.nodes.filter((nd) => nd.id !== removeId);
          showList(
            r,
            dummy,
            `Skip node ${removeNode.value} — removed nth from end.`,
            { nodes: slow ? [slow] : [] },
          );
          const result = walkValues(dummy, nextOf(dummy, "d"));
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 21,
    title: "Merge Two Sorted Lists",
    difficulty: "easy",
    category: "list",
    tags: ["linked-list", "merge"],
    inputSchema: "array",
    statement: `# 21. Merge Two Sorted Lists

Merge two sorted linked lists into one sorted list.`,
    testcases: [
      { label: "Example 1", input: { array1: [1, 2, 4], array2: [1, 3, 4] } },
      { label: "Example 2", input: { array1: [], array2: [] } },
    ],
    solutions: [
      sol<TwoLists>({
        id: "21-merge",
        name: "Iterative Merge",
        time: "O(m+n)",
        space: "O(1)",
        code: `function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0), cur = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }
    else { cur.next = l2; l2 = l2.next; }
    cur = cur.next;
  }
  cur.next = l1 ?? l2;
  return dummy.next;
}`,
        execute({ array1, array2 }) {
          const r = new EventRecorder("21-merge");
          let l1 = listFromArray(array1);
          let l2 = listFromArray(array2);
          const merged: number[] = [];
          let p1 = l1.head;
          let p2 = l2.head;
          showList(r, l1, "Merge sorted lists.", { vars: { l2: array2.join("→") } });
          while (p1 && p2) {
            const v1 = l1.nodes.find((n) => n.id === p1)!.value as number;
            const v2 = l2.nodes.find((n) => n.id === p2)!.value as number;
            if (v1 <= v2) {
              merged.push(v1);
              showList(
                r,
                l1,
                `Take ${v1} from l1. Merged: [${merged.join(",")}].`,
                { nodes: [p1], vars: { v1, v2 } },
              );
              p1 = nextOf(l1, p1);
            } else {
              merged.push(v2);
              showList(
                r,
                l2,
                `Take ${v2} from l2. Merged: [${merged.join(",")}].`,
                { nodes: [p2], vars: { v1, v2 } },
              );
              p2 = nextOf(l2, p2);
            }
          }
          while (p1) {
            const v = l1.nodes.find((n) => n.id === p1)!.value as number;
            merged.push(v);
            showList(r, l1, `Append remaining ${v}.`, { nodes: [p1] });
            p1 = nextOf(l1, p1);
          }
          while (p2) {
            const v = l2.nodes.find((n) => n.id === p2)!.value as number;
            merged.push(v);
            showList(r, l2, `Append remaining ${v}.`, { nodes: [p2] });
            p2 = nextOf(l2, p2);
          }
          r.returnValue(merged);
          r.done(merged);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 24,
    title: "Swap Nodes in Pairs",
    difficulty: "medium",
    category: "list",
    tags: ["linked-list"],
    inputSchema: "array",
    statement: `# 24. Swap Nodes in Pairs

Swap every two adjacent nodes in the linked list.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 4] } },
      { label: "Example 2", input: { array: [] } },
    ],
    solutions: [
      sol<ListIn>({
        id: "24-pair-swap",
        name: "Iterative Pair Swap",
        time: "O(n)",
        space: "O(1)",
        code: `function swapPairs(head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next && prev.next.next) {
    const a = prev.next, b = a.next;
    prev.next = b; a.next = b.next; b.next = a;
    prev = a;
  }
  return dummy.next;
}`,
        execute({ array }) {
          const r = new EventRecorder("24-pair-swap");
          let list = listFromArray(array);
          const dummy: LinkedListData = {
            head: "d",
            nodes: [{ id: "d", value: "D", next: list.head }, ...list.nodes],
          };
          let prev: string | null = "d";
          showList(r, dummy, "Swap adjacent pairs iteratively.", { nodes: ["d"] });
          while (prev) {
            const prevNode = dummy.nodes.find((n) => n.id === prev)!;
            const aId = prevNode.next;
            if (!aId) break;
            const a = dummy.nodes.find((n) => n.id === aId)!;
            const bId = a.next;
            if (!bId) break;
            const b = dummy.nodes.find((n) => n.id === bId)!;
            showList(
              r,
              dummy,
              `Swap pair ${a.value} ↔ ${b.value}.`,
              { nodes: [aId, bId], line: 4 },
            );
            prevNode.next = bId;
            a.next = b.next;
            b.next = aId;
            prev = aId;
            showList(r, dummy, `After swap: ${b.value}→${a.value}.`, { nodes: [bId, aId] });
          }
          const out = walkValues(dummy, nextOf(dummy, "d"));
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 61,
    title: "Rotate List",
    difficulty: "medium",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 61. Rotate List

Rotate the list to the right by \`k\` places.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 4, 5], k: 2 } },
      { label: "Example 2", input: { array: [0, 1, 2], k: 4 } },
    ],
    solutions: [
      sol<ListK>({
        id: "61-cycle-rotate",
        name: "Make Cycle & Break",
        time: "O(n)",
        space: "O(1)",
        code: `function rotateRight(head, k) {
  if (!head) return null;
  let len = 1, tail = head;
  while (tail.next) { tail = tail.next; len++; }
  k %= len;
  if (!k) return head;
  tail.next = head;
  for (let i = 0; i < len - k; i++) tail = tail.next;
  const newHead = tail.next;
  tail.next = null;
  return newHead;
}`,
        execute({ array, k }) {
          const r = new EventRecorder("61-cycle-rotate");
          const list = listFromArray(array);
          if (!list.head) {
            r.done([]);
            return r.getEvents();
          }
          let len = 1;
          let tailId: string | null = list.head;
          while (tailId) {
            const n = list.nodes.find((nd) => nd.id === tailId)!;
            if (!n.next) break;
            len++;
            tailId = nextOf(list, tailId);
          }
          const effective = array.length ? k % array.length : 0;
          showList(r, list, `Length=${len}, k=${k} → effective rotate ${effective}.`, {
            vars: { len, k, effective },
          });
          if (!effective) {
            r.returnValue(array);
            r.done(array);
            return r.getEvents();
          }
          const tail = list.nodes.find((nd) => nd.id === tailId)!;
          tail.next = list.head;
          showList(r, list, "Connect tail to head forming a cycle.", { nodes: [tailId!] });
          let breakNode: string | null = list.head;
          for (let i = 0; i < len - effective; i++) {
            breakNode = nextOf(list, breakNode);
            showList(
              r,
              list,
              `Walk ${i + 1}/${len - effective} to find new tail.`,
              { nodes: breakNode ? [breakNode] : [] },
            );
          }
          const newHead = list.nodes.find((nd) => nd.id === breakNode!)!.next!;
          list.nodes.find((nd) => nd.id === breakNode!)!.next = null;
          list.head = newHead;
          const out = walkValues(list, newHead);
          showList(r, list, `Rotated list: ${out.join("→")}.`, { nodes: [newHead] });
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 83,
    title: "Remove Duplicates from Sorted List",
    difficulty: "easy",
    category: "list",
    tags: ["linked-list"],
    inputSchema: "array",
    statement: `# 83. Remove Duplicates from Sorted List

Delete duplicate nodes so each value appears once.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 1, 2] } },
      { label: "Example 2", input: { array: [1, 1, 2, 3, 3] } },
    ],
    solutions: [
      sol<ListIn>({
        id: "83-skip-dupes",
        name: "Skip Duplicates",
        time: "O(n)",
        space: "O(1)",
        code: `function deleteDuplicates(head) {
  let cur = head;
  while (cur && cur.next) {
    if (cur.val === cur.next.val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
}`,
        execute({ array }) {
          const r = new EventRecorder("83-skip-dupes");
          const list = listFromArray(array);
          let cur: string | null = list.head;
          showList(r, list, "Walk sorted list, skip duplicate successors.", {
            nodes: cur ? [cur] : [],
          });
          while (cur) {
            const node = list.nodes.find((n) => n.id === cur)!;
            const nextId = node.next;
            if (nextId) {
              const next = list.nodes.find((n) => n.id === nextId)!;
              if (node.value === next.value) {
                node.next = next.next;
                list.nodes = list.nodes.filter((n) => n.id !== nextId);
                showList(
                  r,
                  list,
                  `Duplicate ${node.value} — skip node ${nextId}.`,
                  { nodes: [cur], line: 3 },
                );
                continue;
              }
            }
            showList(r, list, `Keep ${node.value}, advance.`, { nodes: [cur] });
            cur = nextOf(list, cur);
          }
          const out = walkValues(list, list.head);
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 82,
    title: "Remove Duplicates from Sorted List II",
    difficulty: "medium",
    category: "list",
    tags: ["linked-list"],
    inputSchema: "array",
    statement: `# 82. Remove Duplicates from Sorted List II

Remove all nodes that have duplicate numbers, leaving only distinct values.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 3, 4, 4, 5] } },
      { label: "Example 2", input: { array: [1, 1, 1, 2, 3] } },
    ],
    solutions: [
      sol<ListIn>({
        id: "82-remove-all-dupes",
        name: "Dummy + Skip Runs",
        time: "O(n)",
        space: "O(1)",
        code: `function deleteDuplicates(head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next) {
    if (prev.next.next && prev.next.val === prev.next.next.val) {
      const v = prev.next.val;
      while (prev.next && prev.next.val === v) prev.next = prev.next.next;
    } else prev = prev.next;
  }
  return dummy.next;
}`,
        execute({ array }) {
          const r = new EventRecorder("82-remove-all-dupes");
          const list = listFromArray(array);
          const dummy: LinkedListData = {
            head: "d",
            nodes: [{ id: "d", value: "D", next: list.head }, ...list.nodes],
          };
          let prev: string | null = "d";
          showList(r, dummy, "Remove entire duplicate runs from sorted list.", {
            nodes: ["d"],
          });
          while (prev) {
            const prevNode = dummy.nodes.find((n) => n.id === prev)!;
            const aId = prevNode.next;
            if (!aId) break;
            const a = dummy.nodes.find((n) => n.id === aId)!;
            const bId = a.next;
            const b = bId ? dummy.nodes.find((n) => n.id === bId)! : null;
            if (b && a.value === b.value) {
              const v = a.value;
              showList(
                r,
                dummy,
                `Duplicate run of ${v} detected — remove all.`,
                { nodes: [aId, bId!], line: 4 },
              );
              while (prevNode.next) {
                const n = dummy.nodes.find((nd) => nd.id === prevNode.next!)!;
                if (n.value !== v) break;
                const removeId = prevNode.next!;
                prevNode.next = n.next;
                dummy.nodes = dummy.nodes.filter((nd) => nd.id !== removeId);
              }
              showList(r, dummy, `Run of ${v} removed.`, { nodes: prev ? [prev] : [] });
            } else {
              showList(r, dummy, `Keep ${a.value}.`, { nodes: [aId] });
              prev = aId;
            }
          }
          const out = walkValues(dummy, nextOf(dummy, "d"));
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 141,
    title: "Linked List Cycle",
    difficulty: "easy",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 141. Linked List Cycle

Detect if the linked list has a cycle. Input \`pos\` is cycle entry index or -1.`,
    testcases: [
      { label: "Example 1", input: { array: [3, 2, 0, -4], pos: 1 } },
      { label: "Example 2", input: { array: [1, 2], pos: 0 } },
      { label: "No cycle", input: { array: [1], pos: -1 } },
    ],
    solutions: [
      sol<ListCycle>({
        id: "141-floyd",
        name: "Floyd Cycle Detection",
        time: "O(n)",
        space: "O(1)",
        code: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
        execute({ array, pos }) {
          const r = new EventRecorder("141-floyd");
          const list = listWithCycle(array, pos);
          let slow: string | null = list.head;
          let fast: string | null = list.head;
          showList(
            r,
            list,
            pos >= 0 ? `List with cycle entering at index ${pos}.` : "Acyclic list.",
            { nodes: list.head ? [list.head] : [], vars: { pos } },
          );
          while (fast) {
            const fastNode = list.nodes.find((n) => n.id === fast!)!;
            if (!fastNode.next) break;
            const fastNext = list.nodes.find((n) => n.id === fastNode.next!)!;
            slow = nextOf(list, slow);
            fast = nextOf(list, fastNext.id);
            showList(
              r,
              list,
              `Move slow 1, fast 2. slow=${slow ?? "null"}, fast=${fast ?? "null"}.`,
              {
                line: 3,
                nodes: [slow, fast].filter(Boolean) as string[],
                vars: { slow, fast },
              },
            );
            if (slow && slow === fast) {
              showList(r, list, "slow === fast — cycle detected!", {
                nodes: [slow],
              });
              r.returnValue(true);
              r.done(true);
              return r.getEvents();
            }
          }
          showList(r, list, "Fast reached end — no cycle.", {});
          r.returnValue(false);
          r.done(false);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 142,
    title: "Linked List Cycle II",
    difficulty: "medium",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 142. Linked List Cycle II

Return the node where the cycle begins, or -1 if none.`,
    testcases: [
      { label: "Example 1", input: { array: [3, 2, 0, -4], pos: 1 } },
      { label: "Example 2", input: { array: [1, 2], pos: 0 } },
    ],
    solutions: [
      sol<ListCycle>({
        id: "142-floyd-entry",
        name: "Floyd Find Entry",
        time: "O(n)",
        space: "O(1)",
        code: `function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) { p = p.next; slow = slow.next; }
      return p;
    }
  }
  return null;
}`,
        execute({ array, pos }) {
          const r = new EventRecorder("142-floyd-entry");
          const list = listWithCycle(array, pos);
          let slow: string | null = list.head;
          let fast: string | null = list.head;
          showList(r, list, "Phase 1: detect meeting point.", {
            nodes: list.head ? [list.head] : [],
          });
          let met: string | null = null;
          while (fast) {
            const fn = list.nodes.find((n) => n.id === fast!)!;
            if (!fn.next) break;
            const fnn = list.nodes.find((n) => n.id === fn.next!)!;
            slow = nextOf(list, slow);
            fast = nextOf(list, fnn.id);
            showList(
              r,
              list,
              `slow=${slow}, fast=${fast}.`,
              { nodes: [slow, fast].filter(Boolean) as string[] },
            );
            if (slow && slow === fast) {
              met = slow;
              break;
            }
          }
          if (!met) {
            showList(r, list, "No meeting — acyclic.", {});
            r.returnValue(-1);
            r.done(-1);
            return r.getEvents();
          }
          showList(r, list, "Phase 2: reset one pointer to head.", {
            nodes: [met],
          });
          let p: string | null = list.head;
          slow = met;
          while (p !== slow) {
            showList(
              r,
              list,
              `Advance p and slow together until they meet at cycle entry.`,
              { nodes: [p!, slow!] },
            );
            p = nextOf(list, p);
            slow = nextOf(list, slow);
          }
          const entryIdx = list.nodes.find((n) => n.id === p!)!.id.replace("n", "");
          showList(r, list, `Cycle begins at index ${entryIdx} (value ${list.nodes.find((n) => n.id === p!)!.value}).`, {
            nodes: [p!],
          });
          r.returnValue(Number(entryIdx));
          r.done(Number(entryIdx));
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 160,
    title: "Intersection of Two Linked Lists",
    difficulty: "easy",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 160. Intersection of Two Linked Lists

Return the value at the intersection node of two lists, or null.`,
    testcases: [
      {
        label: "Example 1",
        input: { array1: [4, 1, 8, 4, 5], array2: [5, 6, 1], skipA: 2, skipB: 2 },
      },
    ],
    solutions: [
      sol<{ array1: number[]; array2: number[]; skipA: number; skipB: number }>({
        id: "160-two-pointer",
        name: "Switching Pointers",
        time: "O(m+n)",
        space: "O(1)",
        code: `function getIntersectionNode(headA, headB) {
  let a = headA, b = headB;
  while (a !== b) {
    a = a ? a.next : headB;
    b = b ? b.next : headA;
  }
  return a;
}`,
        execute({ array1, array2, skipA, skipB }) {
          const r = new EventRecorder("160-two-pointer");
          const { list1, list2 } = intersectLists(array1, array2, skipA, skipB);
          let a: string | null = list1.head;
          let b: string | null = list2.head;
          showList(r, list1, "Two lists sharing a tail.", { vars: { list2Head: list2.head } });
          showList(r, list2, "Walk both; switch heads when reaching end.", {});
          let steps = 0;
          while (a !== b && steps < 20) {
            showList(
              r,
              list1,
              `a=${a ?? "→B"}, b=${b ?? "→A"}. ${a === b ? "Meet!" : "Continue."}`,
              { nodes: [a, b].filter(Boolean) as string[], vars: { a, b } },
            );
            if (a === b) break;
            const aNode = a ? list1.nodes.find((n) => n.id === a) : null;
            const bNode = b ? list2.nodes.find((n) => n.id === b) : null;
            a = aNode?.next ?? list2.head;
            b = bNode?.next ?? list1.head;
            steps++;
          }
          const intersectVal =
            a && b && a === b
              ? (list1.nodes.find((n) => n.id === a)!.value as number)
              : null;
          showList(
            r,
            list1,
            intersectVal !== null
              ? `Intersection at value ${intersectVal}.`
              : "No intersection.",
            { nodes: a ? [a] : [] },
          );
          r.returnValue(intersectVal);
          r.done(intersectVal);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 234,
    title: "Palindrome Linked List",
    difficulty: "easy",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 234. Palindrome Linked List

Return true if the linked list is a palindrome.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 2, 1] } },
      { label: "Example 2", input: { array: [1, 2] } },
    ],
    solutions: [
      sol<ListIn>({
        id: "234-half-reverse",
        name: "Find Mid + Reverse Half",
        time: "O(n)",
        space: "O(1)",
        code: `function isPalindrome(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null;
  while (slow) { const n = slow.next; slow.next = prev; prev = slow; slow = n; }
  while (prev) { if (head.val !== prev.val) return false; head = head.next; prev = prev.next; }
  return true;
}`,
        execute({ array }) {
          const r = new EventRecorder("234-half-reverse");
          const list = listFromArray(array);
          let slow: string | null = list.head;
          let fast: string | null = list.head;
          showList(r, list, "Find middle with slow/fast.", {
            nodes: list.head ? [list.head] : [],
          });
          while (fast) {
            const fn = list.nodes.find((n) => n.id === fast!)!;
            if (!fn.next) break;
            const fnn = list.nodes.find((n) => n.id === fn.next!)!;
            slow = nextOf(list, slow);
            fast = nextOf(list, fnn.id);
            showList(
              r,
              list,
              `slow=${slow}, fast=${fast ?? "end"}.`,
              { nodes: [slow!, fast].filter(Boolean) as string[] },
            );
          }
          let prev: string | null = null;
          let cur: string | null = slow;
          while (cur) {
            const node = list.nodes.find((n) => n.id === cur!)!;
            const next = node.next;
            node.next = prev;
            showList(
              r,
              list,
              `Reverse second half: link ${node.value} back.`,
              { nodes: [cur!], line: 5 },
            );
            prev = cur;
            cur = next;
          }
          let left: string | null = list.head;
          let right: string | null = prev;
          let ok = true;
          while (right) {
            const lv = list.nodes.find((n) => n.id === left!)!.value;
            const rv = list.nodes.find((n) => n.id === right!)!.value;
            showList(
              r,
              list,
              `Compare ${lv} vs ${rv}.`,
              { nodes: [left!, right!] },
            );
            if (lv !== rv) {
              ok = false;
              break;
            }
            left = nextOf(list, left);
            right = nextOf(list, right);
          }
          r.returnValue(ok, { description: ok ? "Palindrome." : "Not palindrome." });
          r.done(ok);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 876,
    title: "Middle of the Linked List",
    difficulty: "easy",
    category: "list",
    tags: ["linked-list", "two-pointers"],
    inputSchema: "array",
    statement: `# 876. Middle of the Linked List

Return the middle node (second middle if even length).`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 4, 5] } },
      { label: "Example 2", input: { array: [1, 2, 3, 4, 5, 6] } },
    ],
    solutions: [
      sol<ListIn>({
        id: "876-slow-fast",
        name: "Slow/Fast Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
        execute({ array }) {
          const r = new EventRecorder("876-slow-fast");
          const list = listFromArray(array);
          let slow: string | null = list.head;
          let fast: string | null = list.head;
          showList(r, list, "Fast moves 2×, slow moves 1×.", {
            nodes: list.head ? [list.head] : [],
          });
          while (fast) {
            const fn = list.nodes.find((n) => n.id === fast!)!;
            if (!fn.next) break;
            const fnn = list.nodes.find((n) => n.id === fn.next!)!;
            slow = nextOf(list, slow);
            fast = nextOf(list, fnn.id);
            showList(
              r,
              list,
              `slow=${slow}, fast=${fast ?? "null"}.`,
              { nodes: [slow!, fast].filter(Boolean) as string[] },
            );
          }
          const midVal = slow
            ? (list.nodes.find((n) => n.id === slow)!.value as number)
            : null;
          showList(r, list, `Middle node value = ${midVal}.`, {
            nodes: slow ? [slow] : [],
          });
          r.returnValue(midVal);
          r.done(midVal);
          return r.getEvents();
        },
      }),
    ],
  }),
];

function walkValues(list: LinkedListData, start: string | null): number[] {
  const out: number[] = [];
  let cur = start;
  const guard = new Set<string>();
  while (cur && !guard.has(cur)) {
    guard.add(cur);
    const node = list.nodes.find((n) => n.id === cur);
    if (!node) break;
    out.push(node.value as number);
    cur = nextOf(list, cur);
  }
  return out;
}
