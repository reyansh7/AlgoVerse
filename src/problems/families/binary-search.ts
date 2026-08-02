import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, kindsRange } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";
import type { HighlightKind } from "@/core/types/execution";

type ArrTarget = { array: number[]; target: number };
type Arr = { array: number[] };
type SqrtInput = { x: number };
type MatrixTarget = { matrix: number[][]; target: number };
type BadVersionInput = { n: number; bad: number };
type KokoInput = { piles: number[]; h: number };
type ShipInput = { weights: number[]; days: number };

function windowKinds(
  length: number,
  left: number,
  right: number,
  mid: number | null = null,
): Record<number, HighlightKind> {
  const kinds: Record<number, HighlightKind> = {};
  for (let i = 0; i < length; i++) {
    if (i < left || i > right) continue;
    if (i === left) kinds[i] = "left";
    else if (i === right) kinds[i] = "right";
    else kinds[i] = "searching";
  }
  if (mid !== null && mid >= left && mid <= right) kinds[mid] = "current";
  return kinds;
}

function flattenMatrix(matrix: number[][]): number[] {
  return matrix.flat();
}

function buildSqrtRange(x: number): number[] {
  const cap = Math.min(x, 20);
  return Array.from({ length: cap + 1 }, (_, i) => i);
}

function versionArray(n: number, bad: number): string[] {
  return Array.from({ length: n }, (_, i) => (i + 1 >= bad ? "bad" : "good"));
}

export const binarySearchFamily: ProblemPackage[] = [
  createProblem({
    id: 35,
    title: "Search Insert Position",
    difficulty: "easy",
    category: "search",
    tags: ["binary-search", "array"],
    inputSchema: "array-target",
    statement: `# 35. Search Insert Position

Given a sorted array of distinct integers and a \`target\`, return the index if found; otherwise return the index where it would be inserted in order. You must write an algorithm with \`O(log n)\` runtime.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 3, 5, 6], target: 5 } },
      { label: "Example 2", input: { array: [1, 3, 5, 6], target: 2 } },
      { label: "Insert at end", input: { array: [1, 3, 5, 6], target: 7 } },
    ],
    solutions: [
      sol<ArrTarget>({
        id: "35-binary-search",
        name: "Binary Search",
        time: "O(log n)",
        space: "O(1)",
        code: `function searchInsert(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return lo;
}`,
        execute({ array, target }) {
          const r = new EventRecorder("35-binary-search");
          const nums = [...array];
          let lo = 0;
          let hi = nums.length - 1;
          showArray(
            r,
            nums,
            `Find insert position for ${target}. Search window [${lo}, ${hi}].`,
            { kinds: windowKinds(nums.length, lo, hi), vars: { lo, hi, target } },
          );
          while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            showArray(
              r,
              nums,
              `Mid index ${mid} → value ${nums[mid]}. Compare with target ${target}.`,
              {
                line: 4,
                kinds: windowKinds(nums.length, lo, hi, mid),
                vars: { lo, hi, mid, midVal: nums[mid], target },
              },
            );
            if (nums[mid] === target) {
              showArray(r, nums, `Exact match at index ${mid}.`, {
                kinds: { [mid]: "found" },
                vars: { result: mid },
              });
              r.returnValue(mid, { description: `Target found at index ${mid}.` });
              r.done(mid);
              return r.getEvents();
            }
            if (nums[mid] < target) {
              lo = mid + 1;
              showArray(
                r,
                nums,
                `${nums[mid]} < ${target} → target must be to the right. lo → ${lo}.`,
                {
                  line: 6,
                  kinds: windowKinds(nums.length, lo, hi),
                  vars: { lo, hi, target },
                },
              );
            } else {
              hi = mid - 1;
              showArray(
                r,
                nums,
                `${nums[mid]} > ${target} → target must be to the left. hi → ${hi}.`,
                {
                  line: 7,
                  kinds: windowKinds(nums.length, lo, hi),
                  vars: { lo, hi, target },
                },
              );
            }
          }
          showArray(
            r,
            nums,
            `Window empty. Insert position is lo = ${lo} (first index where nums[i] ≥ target).`,
            {
              kinds: { ...(lo < nums.length ? { [lo]: "write" } : {}), ...kindsRange(0, lo - 1, "sorted") },
              vars: { lo, result: lo },
            },
          );
          r.returnValue(lo, { description: `Return insert index ${lo}.` });
          r.done(lo);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 69,
    title: "Sqrt(x)",
    difficulty: "easy",
    category: "search",
    tags: ["binary-search", "math"],
    inputSchema: "window",
    statement: `# 69. Sqrt(x)

Given a non-negative integer \`x\`, return the square root of \`x\` rounded down to the nearest integer.`,
    testcases: [
      { label: "Example 1", input: { x: 4 } },
      { label: "Example 2", input: { x: 8 } },
      { label: "Zero", input: { x: 0 } },
    ],
    solutions: [
      sol<SqrtInput>({
        id: "69-binary-search",
        name: "Binary Search on Answer",
        time: "O(log x)",
        space: "O(1)",
        code: `function mySqrt(x: number): number {
  if (x < 2) return x;
  let lo = 1, hi = Math.floor(x / 2);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const sq = mid * mid;
    if (sq === x) return mid;
    if (sq < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi;
}`,
        execute({ x }) {
          const r = new EventRecorder("69-binary-search");
          if (x < 2) {
            const range = buildSqrtRange(Math.max(x, 1));
            showArray(r, range, `x = ${x} < 2 → answer is ${x} immediately.`, {
              vars: { x, result: x },
            });
            r.returnValue(x, { description: `Return ${x}.` });
            r.done(x);
            return r.getEvents();
          }
          const range = buildSqrtRange(x);
          let lo = 1;
          let hi = Math.floor(x / 2);
          showArray(
            r,
            range,
            `Find floor(√${x}). Binary search candidates in [${lo}, ${hi}] on this range axis.`,
            { kinds: windowKinds(range.length, lo, Math.min(hi, range.length - 1)), vars: { lo, hi, x } },
          );
          while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            const sq = mid * mid;
            const hiClamped = Math.min(hi, range.length - 1);
            showArray(
              r,
              range,
              `Try mid = ${mid}: ${mid}² = ${sq}. Compare with x = ${x}.`,
              {
                line: 5,
                kinds: windowKinds(range.length, lo, hiClamped, Math.min(mid, range.length - 1)),
                vars: { lo, hi, mid, sq, x },
              },
            );
            if (sq === x) {
              showArray(r, range, `Exact square root ${mid} found.`, {
                kinds: { [Math.min(mid, range.length - 1)]: "found" },
                vars: { result: mid },
              });
              r.returnValue(mid, { description: `Return exact sqrt ${mid}.` });
              r.done(mid);
              return r.getEvents();
            }
            if (sq < x) {
              lo = mid + 1;
              showArray(
                r,
                range,
                `${sq} < ${x} → sqrt is larger. Move lo to ${lo}.`,
                {
                  line: 8,
                  kinds: windowKinds(range.length, lo, hiClamped),
                  vars: { lo, hi, x },
                },
              );
            } else {
              hi = mid - 1;
              showArray(
                r,
                range,
                `${sq} > ${x} → sqrt is smaller. Move hi to ${hi}.`,
                {
                  line: 9,
                  kinds: windowKinds(range.length, lo, Math.min(hi, range.length - 1)),
                  vars: { lo, hi, x },
                },
              );
            }
          }
          showArray(r, range, `Best floor sqrt is hi = ${hi} (${hi}² = ${hi * hi} ≤ ${x}).`, {
            kinds: { [Math.min(hi, range.length - 1)]: "found" },
            vars: { hi, result: hi },
          });
          r.returnValue(hi, { description: `Return floor sqrt ${hi}.` });
          r.done(hi);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 74,
    title: "Search a 2D Matrix",
    difficulty: "medium",
    category: "search",
    tags: ["binary-search", "array", "matrix"],
    inputSchema: "array-target",
    statement: `# 74. Search a 2D Matrix

Write an efficient algorithm to search for a \`target\` value in an \`m × n\` matrix. Integers in each row are sorted left to right; the first integer of each row is greater than the last integer of the previous row.`,
    testcases: [
      {
        label: "Example 1 — found",
        input: {
          matrix: [
            [1, 3, 5, 7],
            [10, 11, 16, 20],
            [23, 30, 34, 60],
          ],
          target: 3,
        },
      },
      {
        label: "Example 2 — not found",
        input: {
          matrix: [
            [1, 3, 5, 7],
            [10, 11, 16, 20],
            [23, 30, 34, 60],
          ],
          target: 13,
        },
      },
    ],
    solutions: [
      sol<MatrixTarget>({
        id: "74-flatten-bs",
        name: "Flatten + Binary Search",
        time: "O(log(mn))",
        space: "O(1)",
        code: `function searchMatrix(matrix: number[][], target: number): boolean {
  const flat = matrix.flat();
  let lo = 0, hi = flat.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (flat[mid] === target) return true;
    if (flat[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}`,
        execute({ matrix, target }) {
          const r = new EventRecorder("74-flatten-bs");
          const flat = flattenMatrix(matrix);
          const rows = matrix.map((row) => row.join(", ")).join(" | ");
          let lo = 0;
          let hi = flat.length - 1;
          showArray(
            r,
            flat,
            `Matrix rows: [${rows}]. Flattened row-major → [${flat.join(", ")}]. Search for ${target}.`,
            { kinds: windowKinds(flat.length, lo, hi), vars: { lo, hi, target, rows: matrix.length, cols: matrix[0]?.length ?? 0 } },
          );
          while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            const row = Math.floor(mid / matrix[0].length);
            const col = mid % matrix[0].length;
            showArray(
              r,
              flat,
              `Mid flat index ${mid} → matrix[${row}][${col}] = ${flat[mid]}. Compare with ${target}.`,
              {
                line: 5,
                kinds: windowKinds(flat.length, lo, hi, mid),
                vars: { lo, hi, mid, row, col, midVal: flat[mid], target },
              },
            );
            if (flat[mid] === target) {
              showArray(r, flat, `Found ${target} at flat index ${mid} (row ${row}, col ${col}).`, {
                kinds: { [mid]: "found" },
                vars: { result: true },
              });
              r.returnValue(true, { description: `Target ${target} found.` });
              r.done(true);
              return r.getEvents();
            }
            if (flat[mid] < target) {
              lo = mid + 1;
              showArray(
                r,
                flat,
                `${flat[mid]} < ${target} → search right half. lo → ${lo}.`,
                {
                  line: 7,
                  kinds: windowKinds(flat.length, lo, hi),
                  vars: { lo, hi, target },
                },
              );
            } else {
              hi = mid - 1;
              showArray(
                r,
                flat,
                `${flat[mid]} > ${target} → search left half. hi → ${hi}.`,
                {
                  line: 8,
                  kinds: windowKinds(flat.length, lo, hi),
                  vars: { lo, hi, target },
                },
              );
            }
          }
          showArray(r, flat, `Target ${target} not present in matrix.`, {
            vars: { result: false },
          });
          r.returnValue(false, { description: `Return false — not found.` });
          r.done(false);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 153,
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "medium",
    category: "search",
    tags: ["binary-search", "array"],
    inputSchema: "array",
    statement: `# 153. Find Minimum in Rotated Sorted Array

Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times. Find the minimum element. You must write an algorithm that runs in \`O(log n)\` time.`,
    testcases: [
      { label: "Example 1", input: { array: [3, 4, 5, 1, 2] } },
      { label: "Example 2", input: { array: [4, 5, 6, 7, 0, 1, 2] } },
      { label: "Not rotated", input: { array: [1, 2, 3, 4, 5] } },
    ],
    solutions: [
      sol<Arr>({
        id: "153-rotated-min",
        name: "Binary Search on Rotation",
        time: "O(log n)",
        space: "O(1)",
        code: `function findMin(nums: number[]): number {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}`,
        execute({ array }) {
          const r = new EventRecorder("153-rotated-min");
          const nums = [...array];
          let lo = 0;
          let hi = nums.length - 1;
          showArray(
            r,
            nums,
            `Rotated sorted array — find minimum via binary search on [${lo}, ${hi}].`,
            { kinds: windowKinds(nums.length, lo, hi), vars: { lo, hi } },
          );
          while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            showArray(
              r,
              nums,
              `Mid ${mid}: nums[${mid}]=${nums[mid]} vs nums[hi]=${nums[hi]} (right end).`,
              {
                line: 4,
                kinds: {
                  ...windowKinds(nums.length, lo, hi, mid),
                  [hi]: "right",
                },
                vars: { lo, hi, mid, midVal: nums[mid], hiVal: nums[hi] },
              },
            );
            if (nums[mid] > nums[hi]) {
              lo = mid + 1;
              showArray(
                r,
                nums,
                `Mid value ${nums[mid]} > right ${nums[hi]} → min is in right half. lo → ${lo}.`,
                {
                  line: 5,
                  kinds: windowKinds(nums.length, lo, hi),
                  vars: { lo, hi },
                },
              );
            } else {
              hi = mid;
              showArray(
                r,
                nums,
                `Mid value ${nums[mid]} ≤ right ${nums[hi]} → min is at mid or left. hi → ${hi}.`,
                {
                  line: 6,
                  kinds: windowKinds(nums.length, lo, hi, mid),
                  vars: { lo, hi },
                },
              );
            }
          }
          showArray(r, nums, `Minimum is nums[${lo}] = ${nums[lo]}.`, {
            kinds: { [lo]: "minimum" },
            vars: { lo, result: nums[lo] },
          });
          r.returnValue(nums[lo], { description: `Return minimum ${nums[lo]}.` });
          r.done(nums[lo]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 162,
    title: "Find Peak Element",
    difficulty: "medium",
    category: "search",
    tags: ["binary-search", "array"],
    inputSchema: "array",
    statement: `# 162. Find Peak Element

A peak element is strictly greater than its neighbors. Given a \`0-indexed\` integer array \`nums\`, find a peak element and return its index. You must write an algorithm that runs in \`O(log n)\` time.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 1] } },
      { label: "Example 2", input: { array: [1, 2, 1, 3, 5, 6, 4] } },
      { label: "Single peak", input: { array: [1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "162-peak-bs",
        name: "Binary Search on Slope",
        time: "O(log n)",
        space: "O(1)",
        code: `function findPeakElement(nums: number[]): number {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`,
        execute({ array }) {
          const r = new EventRecorder("162-peak-bs");
          const nums = [...array];
          let lo = 0;
          let hi = nums.length - 1;
          showArray(
            r,
            nums,
            `Find a peak (local maximum). Binary search on indices [${lo}, ${hi}].`,
            { kinds: windowKinds(nums.length, lo, hi), vars: { lo, hi } },
          );
          while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            const leftVal = nums[mid];
            const rightVal = nums[mid + 1];
            showArray(
              r,
              nums,
              `Mid ${mid}: nums[${mid}]=${leftVal} vs neighbor nums[${mid + 1}]=${rightVal}.`,
              {
                line: 4,
                kinds: {
                  ...windowKinds(nums.length, lo, hi, mid),
                  [mid + 1]: "comparing",
                },
                vars: { lo, hi, mid, leftVal, rightVal },
              },
            );
            if (leftVal < rightVal) {
              lo = mid + 1;
              showArray(
                r,
                nums,
                `Ascending at mid → peak must be to the right. lo → ${lo}.`,
                {
                  line: 5,
                  kinds: windowKinds(nums.length, lo, hi),
                  vars: { lo, hi },
                },
              );
            } else {
              hi = mid;
              showArray(
                r,
                nums,
                `Descending at mid → peak is at mid or left. hi → ${hi}.`,
                {
                  line: 6,
                  kinds: windowKinds(nums.length, lo, hi, mid),
                  vars: { lo, hi },
                },
              );
            }
          }
          showArray(r, nums, `Peak at index ${lo} with value ${nums[lo]}.`, {
            kinds: { [lo]: "found" },
            vars: { lo, result: lo },
          });
          r.returnValue(lo, { description: `Return peak index ${lo}.` });
          r.done(lo);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 278,
    title: "First Bad Version",
    difficulty: "easy",
    category: "search",
    tags: ["binary-search"],
    inputSchema: "window",
    statement: `# 278. First Bad Version

You are a product manager and currently leading a team to develop a new product. Since each version is developed based on the previous version, all versions after a bad version are also bad. Find the first bad version minimizing \`isBadVersion\` calls.`,
    testcases: [
      { label: "Example 1", input: { n: 5, bad: 4 } },
      { label: "First is bad", input: { n: 1, bad: 1 } },
      { label: "Late bad", input: { n: 10, bad: 8 } },
    ],
    solutions: [
      sol<BadVersionInput>({
        id: "278-version-bs",
        name: "Binary Search on Versions",
        time: "O(log n)",
        space: "O(1)",
        code: `function firstBadVersion(n: number): number {
  let lo = 1, hi = n;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (isBadVersion(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
        execute({ n, bad }) {
          const r = new EventRecorder("278-version-bs");
          const isBad = (v: number) => v >= bad;
          const labels = versionArray(n, bad);
          let lo = 1;
          let hi = n;
          showArray(
            r,
            labels,
            `Versions 1..${n} (index 0 = v1). First bad version is ≥ ${bad}. Search [${lo}, ${hi}].`,
            {
              kinds: windowKinds(n, lo - 1, hi - 1),
              vars: { lo, hi, bad, n },
            },
          );
          while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            const badMid = isBad(mid);
            showArray(
              r,
              labels,
              `Call isBadVersion(${mid}) → ${badMid ? "true (bad)" : "false (good)"}.`,
              {
                line: 4,
                kinds: {
                  ...windowKinds(n, lo - 1, hi - 1, mid - 1),
                  [mid - 1]: badMid ? "found" : "current",
                },
                vars: { lo, hi, mid, isBad: badMid },
              },
            );
            if (badMid) {
              hi = mid;
              showArray(
                r,
                labels,
                `Version ${mid} is bad → first bad is at ${mid} or earlier. hi → ${hi}.`,
                {
                  line: 5,
                  kinds: windowKinds(n, lo - 1, hi - 1),
                  vars: { lo, hi },
                },
              );
            } else {
              lo = mid + 1;
              showArray(
                r,
                labels,
                `Version ${mid} is good → first bad is after ${mid}. lo → ${lo}.`,
                {
                  line: 6,
                  kinds: windowKinds(n, lo - 1, hi - 1),
                  vars: { lo, hi },
                },
              );
            }
          }
          showArray(r, labels, `First bad version is ${lo}.`, {
            kinds: { [lo - 1]: "found", ...kindsRange(0, lo - 2, "sorted") },
            vars: { lo, result: lo },
          });
          r.returnValue(lo, { description: `Return first bad version ${lo}.` });
          r.done(lo);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 540,
    title: "Single Element in a Sorted Array",
    difficulty: "medium",
    category: "search",
    tags: ["binary-search", "array"],
    inputSchema: "array",
    statement: `# 540. Single Element in a Sorted Array

You are given a sorted array consisting of only integers where every element appears exactly twice, except for one element which appears exactly once. Find the single element in \`O(log n)\` time.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 1, 2, 3, 3, 4, 4, 8, 8] } },
      { label: "Example 2", input: { array: [3, 3, 7, 7, 10, 11, 11] } },
      { label: "Single at start", input: { array: [1, 2, 2] } },
    ],
    solutions: [
      sol<Arr>({
        id: "540-pair-bs",
        name: "Binary Search on Pairs",
        time: "O(log n)",
        space: "O(1)",
        code: `function singleNonDuplicate(nums: number[]): number {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (mid % 2 === 1) mid--;
    if (nums[mid] === nums[mid + 1]) lo = mid + 2;
    else hi = mid;
  }
  return nums[lo];
}`,
        execute({ array }) {
          const r = new EventRecorder("540-pair-bs");
          const nums = [...array];
          let lo = 0;
          let hi = nums.length - 1;
          showArray(
            r,
            nums,
            `Every value appears twice except one. Search window [${lo}, ${hi}].`,
            { kinds: windowKinds(nums.length, lo, hi), vars: { lo, hi } },
          );
          while (lo < hi) {
            let mid = Math.floor((lo + hi) / 2);
            if (mid % 2 === 1) {
              mid--;
              showArray(
                r,
                nums,
                `Adjust mid ${mid + 1} → even index ${mid} so pairs align.`,
                {
                  line: 4,
                  kinds: windowKinds(nums.length, lo, hi, mid),
                  vars: { lo, hi, mid },
                },
              );
            }
            showArray(
              r,
              nums,
              `Check pair at indices ${mid}, ${mid + 1}: ${nums[mid]} and ${nums[mid + 1]}.`,
              {
                line: 5,
                kinds: {
                  ...windowKinds(nums.length, lo, hi, mid),
                  [mid + 1]: "comparing",
                },
                vars: { lo, hi, mid, a: nums[mid], b: nums[mid + 1] },
              },
            );
            if (nums[mid] === nums[mid + 1]) {
              lo = mid + 2;
              showArray(
                r,
                nums,
                `Pair matches → single is to the right. lo → ${lo}.`,
                {
                  line: 6,
                  kinds: windowKinds(nums.length, lo, hi),
                  vars: { lo, hi },
                },
              );
            } else {
              hi = mid;
              showArray(
                r,
                nums,
                `Pair broken → single is at mid or left. hi → ${hi}.`,
                {
                  line: 7,
                  kinds: windowKinds(nums.length, lo, hi, mid),
                  vars: { lo, hi },
                },
              );
            }
          }
          showArray(r, nums, `Single element is nums[${lo}] = ${nums[lo]}.`, {
            kinds: { [lo]: "found" },
            vars: { lo, result: nums[lo] },
          });
          r.returnValue(nums[lo], { description: `Return single value ${nums[lo]}.` });
          r.done(nums[lo]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 875,
    title: "Koko Eating Bananas",
    difficulty: "medium",
    category: "search",
    tags: ["binary-search", "array"],
    inputSchema: "window",
    statement: `# 875. Koko Eating Bananas

Koko loves bananas. There are \`n\` piles; the \`i\`-th pile has \`piles[i]\` bananas. The guards return in \`h\` hours. Koko decides her eating speed \`k\` (bananas per hour). Find the minimum \`k\` to finish all piles within \`h\` hours.`,
    testcases: [
      { label: "Example 1", input: { piles: [3, 6, 7, 11], h: 8 } },
      { label: "Example 2", input: { piles: [30, 11, 23, 4, 20], h: 5 } },
      { label: "Example 3", input: { piles: [30, 11, 23, 4, 20], h: 6 } },
    ],
    solutions: [
      sol<KokoInput>({
        id: "875-speed-bs",
        name: "Binary Search on Speed",
        time: "O(n log m)",
        space: "O(1)",
        code: `function minEatingSpeed(piles: number[], h: number): number {
  const hours = (k: number) => piles.reduce((s, p) => s + Math.ceil(p / k), 0);
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (hours(mid) <= h) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
        execute({ piles, h }) {
          const r = new EventRecorder("875-speed-bs");
          const nums = [...piles];
          const hours = (k: number) =>
            nums.reduce((s, p) => s + Math.ceil(p / k), 0);
          let lo = 1;
          let hi = Math.max(...nums);
          showArray(
            r,
            nums,
            `Find minimum eating speed k to finish in ≤ ${h} hours. Search k in [${lo}, ${hi}].`,
            { kinds: kindsRange(0, nums.length - 1, "searching"), vars: { lo, hi, h } },
          );
          while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            const need = hours(mid);
            showArray(
              r,
              nums,
              `Try speed k = ${mid}. Hours needed: ${need} (each pile takes ⌈pile/k⌉ hours).`,
              {
                line: 4,
                kinds: nums.reduce(
                  (acc, p, i) => {
                    acc[i] = "comparing";
                    return acc;
                  },
                  {} as Record<number, HighlightKind>,
                ),
                vars: { lo, hi, mid, hoursNeeded: need, h, limit: h },
              },
            );
            for (let i = 0; i < nums.length; i++) {
              const pileHours = Math.ceil(nums[i] / mid);
              showArray(
                r,
                nums,
                `Pile ${i}: ${nums[i]} bananas ÷ ${mid}/hr = ${pileHours} hour(s).`,
                {
                  kinds: { [i]: "current" },
                  vars: { i, pile: nums[i], k: mid, pileHours, runningTotal: need },
                },
              );
            }
            if (need <= h) {
              hi = mid;
              showArray(
                r,
                nums,
                `${need} ≤ ${h} hours → speed ${mid} works. Try smaller k. hi → ${hi}.`,
                {
                  line: 5,
                  kinds: kindsRange(0, nums.length - 1, "searching"),
                  vars: { lo, hi, mid, hoursNeeded: need },
                },
              );
            } else {
              lo = mid + 1;
              showArray(
                r,
                nums,
                `${need} > ${h} hours → too slow. Need faster eating. lo → ${lo}.`,
                {
                  line: 6,
                  kinds: kindsRange(0, nums.length - 1, "searching"),
                  vars: { lo, hi, mid, hoursNeeded: need },
                },
              );
            }
          }
          showArray(r, nums, `Minimum speed k = ${lo} finishes within ${h} hours.`, {
            kinds: { [0]: "found" },
            vars: { lo, result: lo, finalHours: hours(lo) },
          });
          r.returnValue(lo, { description: `Return minimum speed ${lo}.` });
          r.done(lo);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 1011,
    title: "Capacity To Ship Packages Within D Days",
    difficulty: "medium",
    category: "search",
    tags: ["binary-search", "array"],
    inputSchema: "window",
    statement: `# 1011. Capacity To Ship Packages Within D Days

A conveyor belt ships packages; the \`i\`-th package weighs \`weights[i]\`. Ship all packages within \`days\` days. Capacity is the maximum total weight per day. Find the minimum ship capacity.`,
    testcases: [
      { label: "Example 1", input: { weights: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], days: 5 } },
      { label: "Example 2", input: { weights: [3, 2, 2, 4, 1, 4], days: 3 } },
      { label: "Example 3", input: { weights: [1, 2, 3, 1, 1], days: 4 } },
    ],
    solutions: [
      sol<ShipInput>({
        id: "1011-capacity-bs",
        name: "Binary Search on Capacity",
        time: "O(n log W)",
        space: "O(1)",
        code: `function shipWithinDays(weights: number[], days: number): number {
  const canShip = (cap: number) => {
    let d = 1, cur = 0;
    for (const w of weights) {
      if (cur + w > cap) { d++; cur = 0; }
      cur += w;
    }
    return d <= days;
  };
  let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (canShip(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
        execute({ weights, days }) {
          const r = new EventRecorder("1011-capacity-bs");
          const nums = [...weights];
          const canShip = (cap: number) => {
            let d = 1;
            let cur = 0;
            for (const w of nums) {
              if (cur + w > cap) {
                d++;
                cur = 0;
              }
              cur += w;
            }
            return d <= days;
          };
          let lo = Math.max(...nums);
          let hi = nums.reduce((a, b) => a + b, 0);
          showArray(
            r,
            nums,
            `Ship within ${days} days. Search capacity in [${lo}, ${hi}] (min = max weight, max = total).`,
            { kinds: kindsRange(0, nums.length - 1, "searching"), vars: { lo, hi, days } },
          );
          while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            showArray(
              r,
              nums,
              `Try capacity = ${mid}. Greedy pack day by day without exceeding cap.`,
              {
                line: 8,
                kinds: kindsRange(0, nums.length - 1, "searching"),
                vars: { lo, hi, mid, days },
              },
            );
            let d = 1;
            let cur = 0;
            for (let i = 0; i < nums.length; i++) {
              const w = nums[i];
              if (cur + w > mid) {
                showArray(
                  r,
                  nums,
                  `Day ${d} load ${cur} + package ${w} > ${mid} → start day ${d + 1}.`,
                  {
                    kinds: { [i]: "write" },
                    vars: { day: d, cur, next: w, cap: mid },
                  },
                );
                d++;
                cur = 0;
              }
              cur += w;
              showArray(
                r,
                nums,
                `Day ${d}: add package ${w} → running load ${cur} / ${mid}.`,
                {
                  kinds: { [i]: "current" },
                  vars: { day: d, cur, cap: mid },
                },
              );
            }
            const ok = d <= days;
            showArray(
              r,
              nums,
              `Capacity ${mid} uses ${d} day(s). ${ok ? `≤ ${days} days — feasible.` : `> ${days} days — too small.`}`,
              {
                kinds: ok ? kindsRange(0, nums.length - 1, "sorted") : kindsRange(0, nums.length - 1, "searching"),
                vars: { mid, daysUsed: d, days, feasible: ok },
              },
            );
            if (ok) {
              hi = mid;
              showArray(
                r,
                nums,
                `Feasible → try smaller capacity. hi → ${hi}.`,
                { vars: { lo, hi, mid } },
              );
            } else {
              lo = mid + 1;
              showArray(
                r,
                nums,
                `Not feasible → need more capacity. lo → ${lo}.`,
                { vars: { lo, hi, mid } },
              );
            }
          }
          showArray(r, nums, `Minimum capacity = ${lo} ships all packages in ≤ ${days} days.`, {
            kinds: { [nums.length - 1]: "found" },
            vars: { lo, result: lo },
          });
          r.returnValue(lo, { description: `Return minimum capacity ${lo}.` });
          r.done(lo);
          return r.getEvents();
        },
      }),
    ],
  }),
];
