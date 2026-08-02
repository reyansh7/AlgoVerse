import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { listFromArray, showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type ListsIn = { lists: number[][] };
type Ops = { ops: Array<{ op: string; val?: number }> };
type ArrK = { array: number[]; k: number };
type MatrixK = { matrix: number[][]; k: number };
type TasksN = { tasks: string[]; n: number };
type PointsK = { points: number[][]; k: number };

function showHeap(
  r: EventRecorder,
  heap: number[],
  description: string,
  opts: {
    line?: number;
    kinds?: Record<number, import("@/core/types/execution").HighlightKind>;
    vars?: Record<string, unknown>;
    array?: (number | string)[];
  } = {},
) {
  r.setStructure(
    {
      array: [...heap],
      stack: [...heap],
      ...(opts.array ? { queue: [...opts.array] } : {}),
    },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  r.highlight({ kinds: opts.kinds ?? {}, line: opts.line, description });
}

function heapPush(heap: number[], val: number, max = false) {
  heap.push(val);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    const ok = max ? heap[p] >= heap[i] : heap[p] <= heap[i];
    if (ok) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(heap: number[], max = false): number {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length) {
    heap[0] = last;
    let i = 0;
    while (true) {
      let best = i;
      const l = 2 * i + 1;
      const rt = 2 * i + 2;
      if (l < heap.length && (max ? heap[l] > heap[best] : heap[l] < heap[best])) best = l;
      if (rt < heap.length && (max ? heap[rt] > heap[best] : heap[rt] < heap[best])) best = rt;
      if (best === i) break;
      [heap[i], heap[best]] = [heap[best], heap[i]];
      i = best;
    }
  }
  return top;
}

export const heapsFamily: ProblemPackage[] = [
  createProblem({
    id: 23,
    title: "Merge k Sorted Lists",
    difficulty: "hard",
    category: "heap",
    tags: ["heap", "linked-list", "divide-and-conquer"],
    inputSchema: "array",
    statement: `# 23. Merge k Sorted Lists

Merge k sorted linked lists into one sorted list using a min-heap.`,
    testcases: [
      { label: "Example 1", input: { lists: [[1, 4, 5], [1, 3, 4], [2, 6]] } },
      { label: "Empty", input: { lists: [] } },
    ],
    solutions: [
      sol<ListsIn>({
        id: "23-min-heap",
        name: "Min-Heap Merge",
        time: "O(N log k)",
        space: "O(k)",
        code: `function mergeKLists(lists): ListNode {
  const heap = new MinHeap();
  for (const head of lists) if (head) heap.push(head);
  const dummy = new ListNode(0);
  while (heap.size()) {
    const node = heap.pop();
    dummy.next = node;
    if (node.next) heap.push(node.next);
  }
  return dummy.next;
}`,
        execute({ lists }) {
          const r = new EventRecorder("23-min-heap");
          const heads = lists.map((arr) => listFromArray(arr));
          const indices = heads.map(() => 0);
          const heap: { val: number; listIdx: number }[] = [];
          const merged: number[] = [];

          showHeap(r, [], "Initialize min-heap with first node from each list.", {
            vars: { k: lists.length },
          });

          for (let i = 0; i < heads.length; i++) {
            if (lists[i].length) {
              heap.push({ val: lists[i][0], listIdx: i });
              heap.sort((a, b) => a.val - b.val);
              showHeap(
                r,
                heap.map((x) => x.val),
                `Push ${lists[i][0]} from list ${i}.`,
                { line: 3 },
              );
            }
          }

          while (heap.length) {
            heap.sort((a, b) => a.val - b.val);
            const { val, listIdx } = heap.shift()!;
            merged.push(val);
            r.pop(val, { description: `Pop smallest ${val} from heap.` });
            showHeap(r, heap.map((x) => x.val), `Append ${val} → [${merged.join(", ")}].`, {
              array: merged,
              vars: { merged: [...merged] },
            });
            indices[listIdx] += 1;
            const nextIdx = indices[listIdx];
            if (nextIdx < lists[listIdx].length) {
              const nextVal = lists[listIdx][nextIdx];
              heap.push({ val: nextVal, listIdx });
              heap.sort((a, b) => a.val - b.val);
              r.push(nextVal, { description: `Push next ${nextVal} from list ${listIdx}.` });
              showHeap(r, heap.map((x) => x.val), `Heap after pushing ${nextVal}.`, {});
            }
          }

          r.returnValue(merged, { description: `Merged: [${merged.join(", ")}].` });
          r.done(merged);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 295,
    title: "Find Median from Data Stream",
    difficulty: "hard",
    category: "heap",
    tags: ["heap", "design"],
    inputSchema: "stack-ops",
    statement: `# 295. Find Median from Data Stream

Support addNum and findMedian using two heaps (max-heap for lower half, min-heap for upper).`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "addNum", val: 1 },
            { op: "addNum", val: 2 },
            { op: "findMedian" },
            { op: "addNum", val: 3 },
            { op: "findMedian" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops>({
        id: "295-two-heaps",
        name: "Two-Heap Median",
        time: "O(log n) add",
        space: "O(n)",
        code: `class MedianFinder {
  lo: MaxHeap = []; hi: MinHeap = [];
  addNum(n) { /* balance sizes */ }
  findMedian() { return lo.length > hi.length ? lo[0] : (lo[0]+hi[0])/2; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("295-two-heaps");
          const lo: number[] = [];
          const hi: number[] = [];
          const results: unknown[] = [];

          function rebalance() {
            while (lo.length > hi.length + 1) {
              const v = heapPop(lo, true);
              heapPush(hi, v);
              r.pop(v, { description: `Move ${v} from lo (max) to hi (min).` });
            }
            while (hi.length > lo.length) {
              const v = heapPop(hi);
              heapPush(lo, v, true);
              r.pop(v, { description: `Move ${v} from hi (min) to lo (max).` });
            }
          }

          showHeap(r, lo, "lo = max-heap (lower half); hi = min-heap (upper half).", {
            vars: { lo: [], hi: [] },
          });

          for (const op of ops) {
            if (op.op === "addNum" && op.val !== undefined) {
              const n = op.val;
              if (!lo.length || n <= lo[0]) {
                heapPush(lo, n, true);
                r.push(n, { description: `addNum(${n}) → lo max-heap.` });
              } else {
                heapPush(hi, n);
                r.push(n, { description: `addNum(${n}) → hi min-heap.` });
              }
              rebalance();
              showHeap(r, lo, `After addNum(${n}): lo=[${lo.join(",")}] hi=[${hi.join(",")}].`, {
                vars: { lo: [...lo], hi: [...hi], array: [...hi] },
              });
            } else if (op.op === "findMedian") {
              rebalance();
              const med =
                lo.length > hi.length ? lo[0] : (lo[0] + hi[0]) / 2;
              showHeap(r, lo, `findMedian() → ${med} (lo top=${lo[0]}, hi top=${hi[0] ?? "—"}).`, {
                vars: { median: med },
              });
              results.push(med);
            }
          }

          r.returnValue(results, { description: `Medians: ${results.join(", ")}.` });
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 347,
    title: "Top K Frequent Elements",
    difficulty: "medium",
    category: "heap",
    tags: ["heap", "hashmap"],
    inputSchema: "array",
    statement: `# 347. Top K Frequent Elements

Return the k most frequent elements.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 1, 1, 2, 2, 3], k: 2 } },
      { label: "Example 2", input: { array: [1], k: 1 } },
    ],
    solutions: [
      sol<ArrK>({
        id: "347-freq-heap",
        name: "Min-Heap of Size k",
        time: "O(n log k)",
        space: "O(n)",
        code: `function topKFrequent(nums, k): number[] {
  const freq = count frequencies;
  maintain min-heap of size k by frequency;
  return heap values;
}`,
        execute({ array, k }) {
          const r = new EventRecorder("347-freq-heap");
          const freq = new Map<number, number>();
          for (const n of array) freq.set(n, (freq.get(n) ?? 0) + 1);
          showArray(r, array, "Count frequencies, then keep k most frequent in min-heap.", {
            vars: { k, freq: Object.fromEntries(freq) },
          });

          const heap: { val: number; f: number }[] = [];
          for (const [val, f] of freq) {
            heap.push({ val, f });
            heap.sort((a, b) => a.f - b.f);
            showHeap(
              r,
              heap.map((x) => x.val),
              `Consider ${val} (freq=${f}).`,
              { vars: { freq: f, val } },
            );
            if (heap.length > k) {
              const removed = heap.shift()!;
              r.pop(removed.val, {
                description: `Heap size > k — evict least frequent ${removed.val} (f=${removed.f}).`,
              });
              showHeap(r, heap.map((x) => x.val), `Heap holds top ${k} by frequency.`, {});
            }
          }

          const result = heap.map((x) => x.val);
          showHeap(r, result, `Top ${k} frequent: [${result.join(", ")}].`, {});
          r.returnValue(result, { description: `Result: [${result.join(", ")}].` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 378,
    title: "Kth Smallest Element in a Sorted Matrix",
    difficulty: "medium",
    category: "heap",
    tags: ["heap", "matrix"],
    inputSchema: "array",
    statement: `# 378. Kth Smallest Element in a Sorted Matrix

Each row and column is sorted. Return the k-th smallest element.`,
    testcases: [
      { label: "Example 1", input: { matrix: [[1, 5, 9], [10, 11, 13], [12, 13, 15]], k: 8 } },
      { label: "Small", input: { matrix: [[-5]], k: 1 } },
    ],
    solutions: [
      sol<MatrixK>({
        id: "378-matrix-heap",
        name: "Min-Heap Row Scan",
        time: "O(k log n)",
        space: "O(n)",
        code: `function kthSmallest(matrix, k): number {
  const heap = min-heap of (value, row, col) for row 0;
  pop k-1 times pushing (row, col+1);
  return heap.top;
}`,
        execute({ matrix, k }) {
          const r = new EventRecorder("378-matrix-heap");
          const n = matrix.length;
          type Entry = { val: number; row: number; col: number };
          const heap: Entry[] = [];
          for (let row = 0; row < n; row++) {
            heap.push({ val: matrix[row][0], row, col: 0 });
          }
          heap.sort((a, b) => a.val - b.val);
          showHeap(
            r,
            heap.map((x) => x.val),
            `Seed heap with first column of each row; find k=${k}.`,
            { vars: { k } },
          );

          let result = 0;
          for (let step = 1; step <= k; step++) {
            heap.sort((a, b) => a.val - b.val);
            const { val, row, col } = heap.shift()!;
            result = val;
            r.pop(val, { description: `Step ${step}/${k}: pop smallest ${val}.` });
            showHeap(r, heap.map((x) => x.val), `Current smallest = ${val}.`, {
              vars: { step, val },
            });
            if (col + 1 < n) {
              const next = { val: matrix[row][col + 1], row, col: col + 1 };
              heap.push(next);
              heap.sort((a, b) => a.val - b.val);
              r.push(next.val, {
                description: `Push next in row ${row}: ${next.val}.`,
              });
              showHeap(r, heap.map((x) => x.val), `Heap after pushing ${next.val}.`, {});
            }
          }

          showHeap(r, heap.map((x) => x.val), `${k}-th smallest = ${result}.`, { vars: { answer: result } });
          r.returnValue(result, { description: `Kth smallest: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 621,
    title: "Task Scheduler",
    difficulty: "medium",
    category: "heap",
    tags: ["heap", "greedy"],
    inputSchema: "array",
    statement: `# 621. Task Scheduler

Schedule tasks with cooling interval n between identical tasks. Return minimum intervals.`,
    testcases: [
      { label: "Example 1", input: { tasks: ["A", "A", "A", "B", "B", "B"], n: 2 } },
      { label: "Example 2", input: { tasks: ["A", "A", "A", "B", "B", "B"], n: 0 } },
    ],
    solutions: [
      sol<TasksN>({
        id: "621-max-heap",
        name: "Max-Heap + Cooldown Queue",
        time: "O(n)",
        space: "O(1)",
        code: `function leastInterval(tasks, n): number {
  count freq; max-heap by freq;
  each step: pop max, schedule, push back after n cooldown;
}`,
        execute({ tasks, n }) {
          const r = new EventRecorder("621-max-heap");
          const freq = new Map<string, number>();
          for (const t of tasks) freq.set(t, (freq.get(t) ?? 0) + 1);
          const heap: { task: string; count: number }[] = [...freq.entries()].map(([task, count]) => ({
            task,
            count,
          }));
          heap.sort((a, b) => b.count - a.count);
          const schedule: string[] = [];
          let time = 0;

          showHeap(
            r,
            heap.map((x) => x.count),
            `Max-heap by task frequency; cooldown n=${n}.`,
            { vars: { n, tasks: tasks.join("") } },
          );

          type CoolEntry = { task: string; count: number; readyAt: number };
          const cooldown: CoolEntry[] = [];

          while (heap.length || cooldown.length) {
            time += 1;
            const ready = cooldown.filter((c) => c.readyAt <= time);
            cooldown.splice(
              0,
              cooldown.length,
              ...cooldown.filter((c) => c.readyAt > time),
            );
            for (const c of ready) {
              heap.push({ task: c.task, count: c.count });
            }
            heap.sort((a, b) => b.count - a.count);

            if (!heap.length) {
              showHeap(r, heap.map((x) => x.count), `Idle at t=${time} (cooldown).`, {
                vars: { time, schedule: schedule.join("") },
              });
              continue;
            }

            const top = heap.shift()!;
            schedule.push(top.task);
            r.pop(top.count, { description: `t=${time}: run '${top.task}' (${top.count - 1} left).` });
            showHeap(r, heap.map((x) => x.count), `Schedule: ${schedule.join(" ")}.`, {
              vars: { time, lastTask: top.task },
            });
            if (top.count - 1 > 0) {
              cooldown.push({ task: top.task, count: top.count - 1, readyAt: time + n + 1 });
              showHeap(r, heap.map((x) => x.count), `'${top.task}' cools until t=${time + n + 1}.`, {});
            }
          }

          r.returnValue(time, { description: `Minimum intervals: ${time}.` });
          r.done(time);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 703,
    title: "Kth Largest Element in a Stream",
    difficulty: "easy",
    category: "heap",
    tags: ["heap", "design"],
    inputSchema: "stack-ops",
    statement: `# 703. Kth Largest Element in a Stream

Maintain a min-heap of size k; kth largest is the heap minimum.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "init", val: 3 },
            { op: "add", val: 3 },
            { op: "add", val: 5 },
            { op: "add", val: 10 },
            { op: "add", val: 9 },
            { op: "add", val: 4 },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops>({
        id: "703-k-stream",
        name: "Size-k Min-Heap",
        time: "O(log k) per add",
        space: "O(k)",
        code: `class KthLargest {
  k; heap: MinHeap;
  add(val) { push; if size>k pop min; return heap[0]; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("703-k-stream");
          let k = 0;
          const heap: number[] = [];
          const results: unknown[] = [];

          for (const op of ops) {
            if (op.op === "init" && op.val !== undefined) {
              k = op.val;
              showHeap(r, heap, `Initialize k=${k} stream tracker (min-heap).`, { vars: { k } });
            } else if (op.op === "add" && op.val !== undefined) {
              heapPush(heap, op.val);
              r.push(op.val, { description: `add(${op.val}) to min-heap.` });
              showHeap(r, heap, `Heap after add(${op.val}).`, {});
              if (heap.length > k) {
                const removed = heapPop(heap);
                r.pop(removed, { description: `Size > k — remove smallest ${removed}.` });
                showHeap(r, heap, `Trim heap to size k=${k}.`, {});
              }
              const kth = heap[0];
              showHeap(r, heap, `${k}-th largest = min of heap = ${kth}.`, { vars: { kthLargest: kth } });
              results.push(kth);
            }
          }

          r.returnValue(results, { description: `Kth largest sequence: ${results.join(", ")}.` });
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 973,
    title: "K Closest Points to Origin",
    difficulty: "medium",
    category: "heap",
    tags: ["heap", "geometry"],
    inputSchema: "array",
    statement: `# 973. K Closest Points to Origin

Return the k points closest to the origin (0, 0).`,
    testcases: [
      { label: "Example 1", input: { points: [[1, 3], [-2, 2]], k: 1 } },
      { label: "Example 2", input: { points: [[3, 3], [5, -1], [-2, 4]], k: 2 } },
    ],
    solutions: [
      sol<PointsK>({
        id: "973-max-heap",
        name: "Size-k Max-Heap by Distance",
        time: "O(n log k)",
        space: "O(k)",
        code: `function kClosest(points, k): number[][] {
  max-heap of size k by squared distance;
  return heap points;
}`,
        execute({ points, k }) {
          const r = new EventRecorder("973-max-heap");
          const dist = (p: number[]) => p[0] * p[0] + p[1] * p[1];
          type Entry = { point: number[]; d: number };
          const heap: Entry[] = [];

          showArray(
            r,
            points.map((p) => `${p[0]},${p[1]}`),
            `Keep k=${k} closest points using max-heap by distance².`,
            { vars: { k } },
          );

          for (const p of points) {
            const d = dist(p);
            heap.push({ point: p, d });
            heap.sort((a, b) => b.d - a.d);
            showHeap(
              r,
              heap.map((x) => x.d),
              `Point [${p}] distance²=${d}.`,
              { vars: { point: p, dist2: d } },
            );
            if (heap.length > k) {
              const removed = heap.shift()!;
              r.pop(removed.d, {
                description: `Evict farthest [${removed.point}] (d²=${removed.d}).`,
              });
              showHeap(r, heap.map((x) => x.d), `Heap holds ${k} closest distances.`, {});
            }
          }

          const result = heap.map((x) => x.point);
          showArray(
            r,
            result.map((p) => `${p[0]},${p[1]}`),
            `K closest: ${result.map((p) => `[${p}]`).join(", ")}.`,
            {},
          );
          r.returnValue(result, { description: `${k} closest points selected.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),
];
