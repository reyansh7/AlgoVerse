import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type SegOps = {
  ops: Array<{ op: string; index?: number; value?: number; left?: number; right?: number }>;
  nums?: number[];
  matrix?: number[][];
};
type Arr = { array: number[] };

function showSegTree(
  r: EventRecorder,
  array: number[],
  tree: number[],
  description: string,
  opts: { vars?: Record<string, unknown>; line?: number } = {},
) {
  r.setStructure(
    { array: [...array], table: [[...tree]] },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

function showBit(
  r: EventRecorder,
  array: (number | string)[],
  bit: number[],
  description: string,
  opts: { vars?: Record<string, unknown> } = {},
) {
  r.setStructure(
    { array: [...array], table: [[...bit]] },
    { description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

export const segmentFenwickFamily: ProblemPackage[] = [
  createProblem({
    id: 307,
    title: "Range Sum Query - Mutable",
    difficulty: "medium",
    category: "segment-tree",
    tags: ["segment-tree", "design"],
    inputSchema: "segment-ops",
    statement: `# 307. Range Sum Query - Mutable

Design a structure supporting point update and range sum query in O(log n).`,
    testcases: [
      {
        label: "Example 1",
        input: {
          nums: [1, 3, 5],
          ops: [
            { op: "sumRange", left: 0, right: 2 },
            { op: "update", index: 1, value: 2 },
            { op: "sumRange", left: 0, right: 2 },
          ],
        },
      },
    ],
    solutions: [
      sol<SegOps>({
        id: "307-segment-tree",
        name: "Segment Tree",
        time: "O(log n) per op",
        space: "O(n)",
        code: `class NumArray {
  tree: number[]; n: number;
  update(i, val) { /* point update */ }
  sumRange(l, r) { /* range query */ }
}`,
        execute({ nums = [], ops }) {
          const r = new EventRecorder("307-segment-tree");
          const arr = [...nums];
          const n = arr.length;
          const tree = Array(n * 4).fill(0);
          const results: unknown[] = [];

          function build(i: number, lo: number, hi: number) {
            if (lo === hi) {
              tree[i] = arr[lo];
              return;
            }
            const mid = (lo + hi) >> 1;
            build(i * 2, lo, mid);
            build(i * 2 + 1, mid + 1, hi);
            tree[i] = tree[i * 2] + tree[i * 2 + 1];
          }
          build(1, 0, n - 1);
          showSegTree(r, arr, tree, "Build segment tree from initial array.");

          function update(i: number, lo: number, hi: number, idx: number, val: number) {
            if (lo === hi) {
              arr[idx] = val;
              tree[i] = val;
              showSegTree(r, arr, tree, `Leaf update index ${idx} → ${val}.`, {
                vars: { idx, val },
              });
              return;
            }
            const mid = (lo + hi) >> 1;
            if (idx <= mid) update(i * 2, lo, mid, idx, val);
            else update(i * 2 + 1, mid + 1, hi, idx, val);
            tree[i] = tree[i * 2] + tree[i * 2 + 1];
            showSegTree(r, arr, tree, `Recompute node ${i} = ${tree[i]}.`, {});
          }

          function query(i: number, lo: number, hi: number, l: number, rr: number): number {
            if (rr < lo || hi < l) return 0;
            if (l <= lo && hi <= rr) {
              showSegTree(r, arr, tree, `Fully covered [${lo},${hi}] → ${tree[i]}.`, {});
              return tree[i];
            }
            const mid = (lo + hi) >> 1;
            return query(i * 2, lo, mid, l, rr) + query(i * 2 + 1, mid + 1, hi, l, rr);
          }

          for (const op of ops) {
            if (op.op === "update" && op.index !== undefined && op.value !== undefined) {
              update(1, 0, n - 1, op.index, op.value);
            } else if (op.op === "sumRange" && op.left !== undefined && op.right !== undefined) {
              const s = query(1, 0, n - 1, op.left, op.right);
              results.push(s);
              showSegTree(r, arr, tree, `sumRange(${op.left},${op.right}) = ${s}.`, {
                vars: { result: s },
              });
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
    id: 308,
    title: "Range Sum Query 2D - Mutable",
    difficulty: "hard",
    category: "segment-tree",
    tags: ["segment-tree", "2d"],
    inputSchema: "segment-ops",
    statement: `# 308. Range Sum Query 2D - Mutable

2D mutable range sum using row-wise Fenwick trees.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          matrix: [
            [3, 0, 1, 4, 2],
            [5, 6, 3, 2, 1],
            [1, 2, 0, 1, 5],
            [4, 1, 0, 1, 7],
            [1, 0, 3, 0, 5],
          ],
          ops: [
            { op: "sumRegion", left: 2, right: 1, index: 3, value: 4 },
          ],
        },
      },
    ],
    solutions: [
      sol<SegOps & { row1?: number; col1?: number; row2?: number; col2?: number }>({
        id: "308-2d-bit",
        name: "2D Fenwick Tree",
        time: "O(log m·log n)",
        space: "O(m·n)",
        code: `class NumMatrix {
  bit: number[][]; rows; cols;
  update(row, col, val) {}
  sumRegion(r1,c1,r2,c2) {}
}`,
        execute({ matrix = [], ops }) {
          const r = new EventRecorder("308-2d-bit");
          const m = matrix.length;
          const n = matrix[0]?.length ?? 0;
          const mat = matrix.map((row) => [...row]);
          const bit: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

          const add = (row: number, col: number, delta: number) => {
            for (let i = row + 1; i <= m; i += i & -i) {
              for (let j = col + 1; j <= n; j += j & -j) {
                bit[i][j] += delta;
              }
            }
          };
          const prefix = (row: number, col: number) => {
            let s = 0;
            for (let i = row + 1; i > 0; i -= i & -i) {
              for (let j = col + 1; j > 0; j -= j & -j) s += bit[i][j];
            }
            return s;
          };

          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) add(i, j, mat[i][j]);
          }
          showSegTree(
            r,
            mat.flat(),
            bit.flat(),
            `Build 2D BIT for ${m}×${n} matrix.`,
            {},
          );

          const results: unknown[] = [];
          for (const op of ops) {
            if (op.op === "update" && op.index !== undefined && op.value !== undefined && op.left !== undefined) {
              const row = op.index;
              const col = op.left;
              const delta = op.value - mat[row][col];
              mat[row][col] = op.value;
              add(row, col, delta);
              showSegTree(r, mat.flat(), bit.flat(), `Update (${row},${col}) by ${delta}.`, {});
            } else if (op.op === "sumRegion") {
              const row1 = op.left ?? 0;
              const col1 = op.index ?? 0;
              const row2 = op.right ?? m - 1;
              const col2 = op.value ?? n - 1;
              const s =
                prefix(row2, col2) -
                prefix(row1 - 1, col2) -
                prefix(row2, col1 - 1) +
                prefix(row1 - 1, col1 - 1);
              results.push(s);
              showSegTree(
                r,
                mat.flat(),
                bit.flat(),
                `sumRegion(${row1},${col1},${row2},${col2}) = ${s}.`,
                { vars: { s } },
              );
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
    id: 315,
    title: "Count of Smaller Numbers After Self",
    difficulty: "hard",
    category: "segment-tree",
    tags: ["fenwick", "merge-sort"],
    inputSchema: "array",
    statement: `# 315. Count of Smaller Numbers After Self

For each nums[i], count how many nums[j] (j > i) are smaller.`,
    testcases: [
      { label: "Example 1", input: { array: [5, 2, 6, 1] } },
      { label: "Example 2", input: { array: [-1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "315-bit-rank",
        name: "Coordinate Compress + BIT",
        time: "O(n log n)",
        space: "O(n)",
        code: `function countSmaller(nums) {
  // rank compress, iterate right-to-left, BIT query prefix
}`,
        execute({ array }) {
          const r = new EventRecorder("315-bit-rank");
          const nums = [...array];
          const sorted = [...new Set(nums)].sort((a, b) => a - b);
          const rank = (x: number) => sorted.indexOf(x) + 1;
          const n = sorted.length;
          const bit = Array(n + 1).fill(0);
          const ans = Array(nums.length).fill(0);

          const add = (i: number) => {
            for (; i <= n; i += i & -i) bit[i]++;
          };
          const sum = (i: number) => {
            let s = 0;
            for (; i > 0; i -= i & -i) s += bit[i];
            return s;
          };

          showBit(r, nums.map(String), bit, "Process right-to-left — BIT counts smaller ranks seen.", {});

          for (let i = nums.length - 1; i >= 0; i--) {
            const rk = rank(nums[i]);
            ans[i] = sum(rk - 1);
            add(rk);
            showBit(
              r,
              ans.map(String),
              bit,
              `i=${i}, nums[${i}]=${nums[i]} rank=${rk}: ${ans[i]} smaller to the right.`,
              { vars: { i, rk, count: ans[i] } },
            );
          }
          r.returnValue(ans);
          r.done(ans);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 327,
    title: "Count of Range Sum",
    difficulty: "hard",
    category: "segment-tree",
    tags: ["merge-sort", "fenwick"],
    inputSchema: "array",
    statement: `# 327. Count of Range Sum

Count range sums in [lower, upper] inclusive.`,
    testcases: [
      { label: "Example 1", input: { array: [-2, 5, -1], lower: -2, upper: 2 } },
    ],
    solutions: [
      sol<{ array: number[]; lower: number; upper: number }>({
        id: "327-merge-bit",
        name: "Prefix Sum + Merge Sort",
        time: "O(n log n)",
        space: "O(n)",
        code: `function countRangeSum(nums, lower, upper) {
  // prefix sums + merge sort count pairs in range
}`,
        execute({ array, lower, upper }) {
          const r = new EventRecorder("327-merge-bit");
          const nums = array;
          const prefix = [0];
          for (const x of nums) prefix.push(prefix[prefix.length - 1] + x);
          showArray(r, prefix, `Prefix sums — count pairs with sum in [${lower}, ${upper}].`, {
            vars: { lower, upper },
          });

          let count = 0;
          function mergeSort(arr: number[], lo: number, hi: number): number[] {
            if (hi - lo <= 1) return arr.slice(lo, hi);
            const mid = (lo + hi) >> 1;
            const left = mergeSort(arr, lo, mid);
            const right = mergeSort(arr, mid, hi);
            const merged: number[] = [];
            let i = 0;
            let j = 0;
            for (let k = lo; k < hi; k++) {
              let added = 0;
              while (i < left.length && j < right.length) {
                const targetLo = left[i] + lower;
                const targetHi = left[i] + upper;
                while (j < right.length && right[j] < targetLo) j++;
                let t = j;
                while (t < right.length && right[t] <= targetHi) {
                  added++;
                  t++;
                }
                if (left[i] <= right[j]) merged.push(left[i++]);
                else merged.push(right[j++]);
              }
              count += added;
              showArray(r, merged, `Merge step: +${added} range sums in [${lower},${upper}]. count=${count}.`, {
                vars: { count },
              });
            }
            while (i < left.length) merged.push(left[i++]);
            while (j < right.length) merged.push(right[j++]);
            for (let k = lo; k < hi; k++) arr[k] = merged[k - lo];
            return merged;
          }

          mergeSort(prefix, 0, prefix.length);
          r.returnValue(count);
          r.done(count);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 493,
    title: "Reverse Pairs",
    difficulty: "hard",
    category: "segment-tree",
    tags: ["merge-sort", "divide-and-conquer"],
    inputSchema: "array",
    statement: `# 493. Reverse Pairs

Count pairs i < j where nums[i] > 2 * nums[j].`,
    testcases: [
      { label: "Example 1", input: { array: [1, 3, 2, 3, 1] } },
      { label: "Example 2", input: { array: [2, 4, 3, 5, 1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "493-merge-count",
        name: "Merge Sort Count",
        time: "O(n log n)",
        space: "O(n)",
        code: `function reversePairs(nums) {
  let count = 0;
  function sort(arr) {
    if (arr.length <= 1) return arr;
    // split, count cross pairs, merge
  }
}`,
        execute({ array }) {
          const r = new EventRecorder("493-merge-count");
          let count = 0;

          function sort(arr: number[]): number[] {
            if (arr.length <= 1) return arr;
            const mid = arr.length >> 1;
            const left = sort(arr.slice(0, mid));
            const right = sort(arr.slice(mid));
            showArray(r, arr, `Divide [${left.join(",")}|${right.join(",")}].`, { vars: { count } });

            let j = 0;
            for (let i = 0; i < left.length; i++) {
              while (j < right.length && left[i] > 2 * right[j]) j++;
              const added = j;
              count += added;
              if (added > 0) {
                showArray(
                  r,
                  arr,
                  `left[${i}]=${left[i]} > 2×right[0..${j - 1}] → +${added} pairs. total=${count}.`,
                  { vars: { count } },
                );
              }
            }

            const merged: number[] = [];
            let i = 0;
            j = 0;
            while (i < left.length && j < right.length) {
              merged.push(left[i] <= right[j] ? left[i++] : right[j++]);
            }
            while (i < left.length) merged.push(left[i++]);
            while (j < right.length) merged.push(right[j++]);
            showArray(r, merged, `Merged sorted half.`, {});
            return merged;
          }

          sort([...array]);
          r.returnValue(count);
          r.done(count);
          return r.getEvents();
        },
      }),
    ],
  }),
];
