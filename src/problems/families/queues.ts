import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import type { ProblemPackage } from "@/problems/types";

type Ops = { ops: Array<{ op: string; val?: number }> };

function showQueueStack(
  r: EventRecorder,
  queue: (number | string)[],
  stack: (number | string)[],
  description: string,
  opts: { vars?: Record<string, unknown>; line?: number } = {},
) {
  r.setStructure(
    { queue: [...queue], stack: [...stack], array: [...queue, ...stack] },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

export const queuesFamily: ProblemPackage[] = [
  createProblem({
    id: 225,
    title: "Implement Stack using Queues",
    difficulty: "easy",
    category: "queue",
    tags: ["queue", "stack", "design"],
    inputSchema: "stack-ops",
    statement: `# 225. Implement Stack using Queues

Implement LIFO stack using only queue operations. Animate push/pop/top.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "push", val: 1 },
            { op: "push", val: 2 },
            { op: "top" },
            { op: "pop" },
            { op: "empty" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops>({
        id: "225-queue-stack",
        name: "Rotate on Push",
        time: "O(n) push, O(1) pop",
        space: "O(n)",
        code: `class MyStack {
  q: number[] = [];
  push(x) { this.q.push(x); for (let i = 0; i < this.q.length - 1; i++) this.q.push(this.q.shift()!); }
  pop() { return this.q.shift()!; }
  top() { return this.q[0]; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("225-queue-stack");
          const q: number[] = [];
          const results: unknown[] = [];
          showQueueStack(r, q, [], "Single queue — rotate after each push for LIFO.", {});
          for (const op of ops) {
            if (op.op === "push" && op.val !== undefined) {
              q.push(op.val);
              showQueueStack(r, q, [], `push(${op.val}): enqueue then rotate.`, {});
              for (let i = 0; i < q.length - 1; i++) {
                const front = q.shift()!;
                q.push(front);
                showQueueStack(
                  r,
                  q,
                  [],
                  `Rotate ${i + 1}/${q.length - 1}: move ${front} to back.`,
                  { line: 2 },
                );
              }
              showQueueStack(r, q, [], `Top of stack at queue front: ${q[0]}.`, {});
            } else if (op.op === "pop") {
              const v = q.shift()!;
              r.dequeue(v, { description: `pop(): dequeue front → ${v}.` });
              showQueueStack(r, q, [], `pop() returned ${v}.`, {});
              results.push(v);
            } else if (op.op === "top") {
              showQueueStack(r, q, [], `top(): ${q[0]}.`, {});
              results.push(q[0]);
            } else if (op.op === "empty") {
              const e = q.length === 0;
              showQueueStack(r, q, [], `empty(): ${e}.`, {});
              results.push(e);
            }
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 232,
    title: "Implement Queue using Stacks",
    difficulty: "easy",
    category: "queue",
    tags: ["queue", "stack", "design"],
    inputSchema: "stack-ops",
    statement: `# 232. Implement Queue using Stacks

Implement FIFO queue using only stack push/pop. Animate operations.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "push", val: 1 },
            { op: "push", val: 2 },
            { op: "peek" },
            { op: "pop" },
            { op: "empty" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops>({
        id: "232-stack-queue",
        name: "In + Out Stacks",
        time: "O(1) amortized",
        space: "O(n)",
        code: `class MyQueue {
  in: number[] = []; out: number[] = [];
  push(x) { this.in.push(x); }
  pop() { if (!this.out.length) while (this.in.length) this.out.push(this.in.pop()!); return this.out.pop()!; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("232-stack-queue");
          const inSt: number[] = [];
          const outSt: number[] = [];
          const results: unknown[] = [];
          showQueueStack(r, inSt, outSt, "in stack for enqueue, out stack for dequeue.", {});
          for (const op of ops) {
            if (op.op === "push" && op.val !== undefined) {
              inSt.push(op.val);
              r.push(op.val, { description: `push(${op.val}) onto in stack.` });
              showQueueStack(r, inSt, outSt, `in=[${inSt.join(",")}].`, { line: 2 });
            } else if (op.op === "pop" || op.op === "peek") {
              if (!outSt.length) {
                showQueueStack(r, inSt, outSt, "out empty — pour in → out.", { line: 3 });
                while (inSt.length) {
                  const v = inSt.pop()!;
                  outSt.push(v);
                  r.pop(v, { description: `Transfer ${v} from in to out.` });
                  showQueueStack(r, inSt, outSt, `Moved ${v}.`, {});
                }
              }
              if (op.op === "pop") {
                const v = outSt.pop()!;
                r.pop(v, { description: `pop(): ${v}.` });
                showQueueStack(r, inSt, outSt, `pop returned ${v}.`, {});
                results.push(v);
              } else {
                const v = outSt[outSt.length - 1];
                showQueueStack(r, inSt, outSt, `peek(): front is ${v}.`, {});
                results.push(v);
              }
            } else if (op.op === "empty") {
              const e = inSt.length === 0 && outSt.length === 0;
              showQueueStack(r, inSt, outSt, `empty(): ${e}.`, {});
              results.push(e);
            }
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 622,
    title: "Design Circular Queue",
    difficulty: "medium",
    category: "queue",
    tags: ["queue", "design", "array"],
    inputSchema: "stack-ops",
    statement: `# 622. Design Circular Queue

Fixed-size circular buffer with enQueue, deQueue, Front, Rear, isEmpty, isFull.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "init", val: 3 },
            { op: "enQueue", val: 1 },
            { op: "enQueue", val: 2 },
            { op: "enQueue", val: 3 },
            { op: "enQueue", val: 4 },
            { op: "Rear" },
            { op: "isFull" },
            { op: "deQueue" },
            { op: "enQueue", val: 4 },
            { op: "Rear" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops>({
        id: "622-circular-queue",
        name: "Ring Buffer",
        time: "O(1) per op",
        space: "O(k)",
        code: `class MyCircularQueue {
  buf: number[]; head = 0; tail = 0; size = 0;
  enQueue(v) { if (this.isFull()) return false; this.buf[this.tail] = v; this.tail = (this.tail+1)%this.buf.length; this.size++; return true; }
  deQueue() { if (this.isEmpty()) return false; this.head = (this.head+1)%this.buf.length; this.size--; return true; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("622-circular-queue");
          let k = 0;
          let buf: (number | null)[] = [];
          let head = 0;
          let tail = 0;
          let size = 0;
          const results: unknown[] = [];
          const show = (desc: string) => {
            r.setStructure(
              { array: buf.map((v) => v ?? "_"), queue: buf.filter((v) => v !== null) as number[] },
              { description: desc },
            );
            r.updateVariable("head", head);
            r.updateVariable("tail", tail);
            r.updateVariable("size", size);
          };
          show("Circular queue with head/tail pointers.");
          for (const op of ops) {
            if (op.op === "init" && op.val !== undefined) {
              k = op.val;
              buf = Array(k).fill(null);
              head = 0;
              tail = 0;
              size = 0;
              show(`Initialize capacity k=${k}.`);
            } else if (op.op === "enQueue" && op.val !== undefined) {
              if (size === k) {
                show(`enQueue(${op.val}): full — return false.`);
                results.push(false);
              } else {
                buf[tail] = op.val;
                show(`enQueue(${op.val}) at tail index ${tail}.`);
                tail = (tail + 1) % k;
                size++;
                show(`tail → ${tail}, size=${size}.`);
                results.push(true);
              }
            } else if (op.op === "deQueue") {
              if (size === 0) {
                show("deQueue: empty — return false.");
                results.push(false);
              } else {
                show(`deQueue: remove at head index ${head}.`);
                buf[head] = null;
                head = (head + 1) % k;
                size--;
                show(`head → ${head}, size=${size}.`);
                results.push(true);
              }
            } else if (op.op === "Front") {
              const v = size ? buf[head] : -1;
              show(`Front(): ${v}.`);
              results.push(v);
            } else if (op.op === "Rear") {
              const rearIdx = (tail - 1 + k) % k;
              const v = size ? buf[rearIdx] : -1;
              show(`Rear(): index ${rearIdx} → ${v}.`);
              results.push(v);
            } else if (op.op === "isEmpty") {
              const e = size === 0;
              show(`isEmpty(): ${e}.`);
              results.push(e);
            } else if (op.op === "isFull") {
              const f = size === k;
              show(`isFull(): ${f}.`);
              results.push(f);
            }
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 641,
    title: "Design Circular Deque",
    difficulty: "medium",
    category: "queue",
    tags: ["queue", "deque", "design"],
    inputSchema: "stack-ops",
    statement: `# 641. Design Circular Deque

Double-ended queue with insert/delete at front and rear on a circular buffer.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "init", val: 3 },
            { op: "insertLast", val: 1 },
            { op: "insertLast", val: 2 },
            { op: "insertFront", val: 3 },
            { op: "insertFront", val: 4 },
            { op: "getRear" },
            { op: "isFull" },
            { op: "deleteLast" },
            { op: "insertFront", val: 4 },
            { op: "getFront" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops>({
        id: "641-circular-deque",
        name: "Circular Deque",
        time: "O(1) per op",
        space: "O(k)",
        code: `class MyCircularDeque {
  buf: number[]; front = 0; rear = 0; size = 0;
  insertFront(v) { /* dec front mod k */ }
  insertLast(v) { /* inc rear mod k */ }
}`,
        execute({ ops }) {
          const r = new EventRecorder("641-circular-deque");
          let k = 0;
          let buf: (number | null)[] = [];
          let front = 0;
          let rear = 0;
          let size = 0;
          const results: unknown[] = [];
          const show = (desc: string) => {
            r.setStructure(
              { array: buf.map((v) => v ?? "_"), queue: buf.filter((v) => v !== null) as number[] },
              { description: desc },
            );
            r.updateVariable("front", front);
            r.updateVariable("rear", rear);
            r.updateVariable("size", size);
          };
          show("Circular deque — insert/delete at both ends.");
          for (const op of ops) {
            if (op.op === "init" && op.val !== undefined) {
              k = op.val;
              buf = Array(k).fill(null);
              front = 0;
              rear = 0;
              size = 0;
              show(`Init capacity k=${k}.`);
            } else if (op.op === "insertLast" && op.val !== undefined) {
              if (size === k) {
                show(`insertLast(${op.val}): full.`);
                results.push(false);
              } else {
                buf[rear] = op.val;
                show(`insertLast(${op.val}) at rear index ${rear}.`);
                rear = (rear + 1) % k;
                size++;
                show(`rear → ${rear}, size=${size}.`);
                results.push(true);
              }
            } else if (op.op === "insertFront" && op.val !== undefined) {
              if (size === k) {
                show(`insertFront(${op.val}): full.`);
                results.push(false);
              } else {
                front = (front - 1 + k) % k;
                buf[front] = op.val;
                show(`insertFront(${op.val}) at front index ${front}.`);
                size++;
                show(`front → ${front}, size=${size}.`);
                results.push(true);
              }
            } else if (op.op === "deleteLast") {
              if (size === 0) {
                show("deleteLast: empty.");
                results.push(false);
              } else {
                rear = (rear - 1 + k) % k;
                show(`deleteLast at index ${rear}.`);
                buf[rear] = null;
                size--;
                results.push(true);
              }
            } else if (op.op === "deleteFront") {
              if (size === 0) {
                show("deleteFront: empty.");
                results.push(false);
              } else {
                show(`deleteFront at index ${front}.`);
                buf[front] = null;
                front = (front + 1) % k;
                size--;
                results.push(true);
              }
            } else if (op.op === "getFront") {
              const v = size ? buf[front] : -1;
              show(`getFront(): ${v}.`);
              results.push(v);
            } else if (op.op === "getRear") {
              const idx = (rear - 1 + k) % k;
              const v = size ? buf[idx] : -1;
              show(`getRear(): index ${idx} → ${v}.`);
              results.push(v);
            } else if (op.op === "isEmpty") {
              show(`isEmpty(): ${size === 0}.`);
              results.push(size === 0);
            } else if (op.op === "isFull") {
              show(`isFull(): ${size === k}.`);
              results.push(size === k);
            }
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),
];
