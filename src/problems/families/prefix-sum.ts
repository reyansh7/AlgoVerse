import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, showArrayMap, kindsRange } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type Arr = { array: number[] };
type ArrK = { array: number[]; k: number };
type ArrGoal = { array: number[]; goal: number };
type Prefix303 = {
  nums: number[];
  queries: Array<{ left: number; right: number }>;
};
type Prefix304 = {
  matrix: number[][];
  queries: Array<{ row1: number; col1: number; row2: number; col2: number }>;
};

export const prefixSumFamily: ProblemPackage[] = [
  createProblem({
    id: 53,
    title: "Maximum Subarray",
    difficulty: "medium",
    category: "search",
    tags: ["array", "prefix-sum", "kadane"],
    inputSchema: "array",
    statement: `# 53. Maximum Subarray

Given an integer array \`nums\`, find the contiguous subarray with the largest sum and return that sum (Kadane's algorithm).`,
    testcases: [
      { label: "Example 1", input: { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] } },
      { label: "Example 2", input: { array: [1] } },
      { label: "Example 3", input: { array: [5, 4, -1, 7, 8] } },
    ],
    solutions: [
      sol<Arr>({
        id: "53-kadane",
        name: "Kadane's Algorithm",
        time: "O(n)",
        space: "O(1)",
        code: `function maxSubArray(nums: number[]): number {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
        execute({ array }) {
          const r = new EventRecorder("53-kadane");
          const nums = [...array];
          let cur = nums[0];
          let best = nums[0];
          showArray(r, nums, `Start Kadane: cur=best=${cur} at index 0.`, {
            kinds: { 0: "current" },
            vars: { cur, best },
          });
          for (let i = 1; i < nums.length; i++) {
            const extend = cur + nums[i];
            const fresh = nums[i];
            showArray(
              r,
              nums,
              `Index ${i}: extend cur+nums[${i}]=${extend} vs fresh start ${fresh}.`,
              {
                line: 3,
                kinds: { [i]: "comparing" },
                vars: { i, cur, extend, fresh },
              },
            );
            cur = Math.max(fresh, extend);
            best = Math.max(best, cur);
            showArray(
              r,
              nums,
              `cur → ${cur}, best → ${best}. ${cur === fresh ? "Restart subarray here." : "Extend previous subarray."}`,
              {
                line: 4,
                kinds: { [i]: cur === fresh ? "found" : "active" },
                vars: { cur, best },
              },
            );
          }
          showArray(r, nums, `Maximum subarray sum = ${best}.`, {
            kinds: { [nums.length - 1]: "found" },
            vars: { best },
          });
          r.returnValue(best, { description: `Return ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 303,
    title: "Range Sum Query - Immutable",
    difficulty: "easy",
    category: "search",
    tags: ["array", "prefix-sum", "design"],
    inputSchema: "array",
    statement: `# 303. Range Sum Query - Immutable

Build a prefix-sum array, then answer \`sumRange(left, right)\` in O(1).`,
    testcases: [
      {
        label: "Example 1",
        input: {
          nums: [-2, 0, 3, -5, 2, -1],
          queries: [
            { left: 0, right: 2 },
            { left: 2, right: 5 },
            { left: 0, right: 5 },
          ],
        },
      },
    ],
    solutions: [
      sol<Prefix303>({
        id: "303-prefix-build",
        name: "Prefix Sum Build & Query",
        time: "O(n) build, O(1) query",
        space: "O(n)",
        code: `class NumArray {
  prefix: number[];
  constructor(nums: number[]) {
    this.prefix = [0];
    for (const x of nums) this.prefix.push(this.prefix.at(-1)! + x);
  }
  sumRange(l: number, r: number) {
    return this.prefix[r + 1] - this.prefix[l];
  }
}`,
        execute({ nums, queries }) {
          const r = new EventRecorder("303-prefix-build");
          const prefix: number[] = [0];
          showArray(r, nums, "Build prefix[i] = sum of nums[0..i-1]. prefix[0]=0.", {
            vars: { prefix: [...prefix] },
          });
          for (let i = 0; i < nums.length; i++) {
            prefix.push(prefix[prefix.length - 1] + nums[i]);
            showArray(
              r,
              nums,
              `Add nums[${i}]=${nums[i]} → prefix[${i + 1}]=${prefix[i + 1]}.`,
              {
                line: 3,
                kinds: { [i]: "write" },
                vars: { i, prefix: [...prefix] },
              },
            );
          }
          const results: number[] = [];
          for (const q of queries) {
            const sum = prefix[q.right + 1] - prefix[q.left];
            results.push(sum);
            showArray(
              r,
              nums,
              `sumRange(${q.left},${q.right}) = prefix[${q.right + 1}]-prefix[${q.left}] = ${sum}.`,
              {
                line: 6,
                kinds: kindsRange(q.left, q.right, "found"),
                vars: { left: q.left, right: q.right, sum, results },
              },
            );
          }
          r.returnValue(results, { description: `Query results: [${results.join(", ")}].` });
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 304,
    title: "Range Sum Query 2D - Immutable",
    difficulty: "medium",
    category: "search",
    tags: ["array", "prefix-sum", "matrix"],
    inputSchema: "array",
    statement: `# 304. Range Sum Query 2D - Immutable

Build a 2D prefix table so any submatrix sum is O(1).`,
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
          queries: [{ row1: 2, col1: 1, row2: 4, col2: 3 }],
        },
      },
    ],
    solutions: [
      sol<Prefix304>({
        id: "304-2d-prefix",
        name: "2D Prefix Table",
        time: "O(mn) build, O(1) query",
        space: "O(mn)",
        code: `class NumMatrix {
  P: number[][];
  constructor(matrix: number[][]) { /* build 2D prefix */ }
  sumRegion(r1,c1,r2,c2) {
    return P[r2+1][c2+1]-P[r1][c2+1]-P[r2+1][c1]+P[r1][c1];
  }
}`,
        execute({ matrix, queries }) {
          const r = new EventRecorder("304-2d-prefix");
          const m = matrix.length;
          const n = matrix[0]?.length ?? 0;
          const P: number[][] = Array.from({ length: m + 1 }, () =>
            Array(n + 1).fill(0),
          );
          r.setStructure(
            { table: matrix.map((row) => [...row]), array: matrix.flat() },
            { description: "Build 2D prefix table P with extra top/left zero row/col." },
          );
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              P[i + 1][j + 1] =
                matrix[i][j] +
                P[i][j + 1] +
                P[i + 1][j] -
                P[i][j];
              r.setStructure(
                { table: P.map((row) => [...row]) },
                {
                  line: 2,
                  description: `P[${i + 1}][${j + 1}] = ${P[i + 1][j + 1]} (cell ${matrix[i][j]} + neighbors).`,
                },
              );
              r.updateVariable("i", i);
              r.updateVariable("j", j);
            }
          }
          const results: number[] = [];
          for (const q of queries) {
            const sum =
              P[q.row2 + 1][q.col2 + 1] -
              P[q.row1][q.col2 + 1] -
              P[q.row2 + 1][q.col1] +
              P[q.row1][q.col1];
            results.push(sum);
            r.setStructure(
              { table: P.map((row) => [...row]) },
              {
                line: 5,
                description: `Region (${q.row1},${q.col1})→(${q.row2},${q.col2}) sum = ${sum}.`,
              },
            );
            r.updateVariable("sum", sum);
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 525,
    title: "Contiguous Array",
    difficulty: "medium",
    category: "search",
    tags: ["array", "prefix-sum", "hashmap"],
    inputSchema: "array",
    statement: `# 525. Contiguous Array

Given a binary array, find the maximum length of a contiguous subarray with equal number of 0 and 1. Treat 0 as -1 in a running balance.`,
    testcases: [
      { label: "Example 1", input: { array: [0, 1] } },
      { label: "Example 2", input: { array: [0, 1, 0] } },
      { label: "Example 3", input: { array: [0, 1, 1, 0, 1, 1, 1, 0] } },
    ],
    solutions: [
      sol<Arr>({
        id: "525-balance-map",
        name: "Prefix Balance + Map",
        time: "O(n)",
        space: "O(n)",
        code: `function findMaxLength(nums: number[]): number {
  const map = new Map<number, number>();
  map.set(0, -1);
  let bal = 0, best = 0;
  for (let i = 0; i < nums.length; i++) {
    bal += nums[i] === 1 ? 1 : -1;
    if (map.has(bal)) best = Math.max(best, i - map.get(bal)!);
    else map.set(bal, i);
  }
  return best;
}`,
        execute({ array }) {
          const r = new EventRecorder("525-balance-map");
          const nums = [...array];
          const map: Record<string, number> = { "0": -1 };
          let bal = 0;
          let best = 0;
          showArrayMap(
            r,
            nums,
            map,
            "Map stores first index each balance was seen. Start balance 0 at index -1.",
            { vars: { bal, best } },
          );
          for (let i = 0; i < nums.length; i++) {
            bal += nums[i] === 1 ? 1 : -1;
            showArrayMap(
              r,
              nums,
              map,
              `Index ${i}: value ${nums[i]} → balance ${bal}.`,
              {
                line: 4,
                kinds: { [i]: "current" },
                vars: { i, bal },
              },
            );
            const key = String(bal);
            if (key in map) {
              const len = i - map[key];
              best = Math.max(best, len);
              showArrayMap(
                r,
                nums,
                map,
                `Balance ${bal} seen before at ${map[key]} → subarray length ${len}, best=${best}.`,
                {
                  line: 5,
                  kinds: kindsRange(map[key] + 1, i, "found"),
                  vars: { best, len },
                },
              );
            } else {
              map[key] = i;
              showArrayMap(
                r,
                nums,
                map,
                `First time balance ${bal} — record index ${i}.`,
                { line: 6, vars: { i } },
              );
            }
          }
          r.returnValue(best, { description: `Max equal 0/1 length = ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 560,
    title: "Subarray Sum Equals K",
    difficulty: "medium",
    category: "search",
    tags: ["array", "prefix-sum", "hashmap"],
    inputSchema: "array-target",
    statement: `# 560. Subarray Sum Equals K

Return the total number of contiguous subarrays whose sum equals \`k\`.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 1, 1], k: 2 } },
      { label: "Example 2", input: { array: [1, 2, 3], k: 3 } },
    ],
    solutions: [
      sol<ArrK>({
        id: "560-prefix-map",
        name: "Prefix Sum + Frequency Map",
        time: "O(n)",
        space: "O(n)",
        code: `function subarraySum(nums: number[], k: number): number {
  const freq = new Map<number, number>();
  freq.set(0, 1);
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    count += freq.get(sum - k) ?? 0;
    freq.set(sum, (freq.get(sum) ?? 0) + 1);
  }
  return count;
}`,
        execute({ array, k }) {
          const r = new EventRecorder("560-prefix-map");
          const nums = [...array];
          const freq: Record<string, number> = { "0": 1 };
          let sum = 0;
          let count = 0;
          showArrayMap(
            r,
            nums,
            freq,
            `Count subarrays summing to k=${k}. freq[0]=1 for empty prefix.`,
            { vars: { sum, count, k } },
          );
          for (let i = 0; i < nums.length; i++) {
            sum += nums[i];
            const need = String(sum - k);
            const add = freq[need] ?? 0;
            count += add;
            showArrayMap(
              r,
              nums,
              freq,
              `i=${i}: sum=${sum}. Need prefix sum ${sum - k} → +${add} subarrays.`,
              {
                line: 5,
                kinds: { [i]: "current" },
                vars: { i, sum, count, need: sum - k },
              },
            );
            const key = String(sum);
            freq[key] = (freq[key] ?? 0) + 1;
            showArrayMap(
              r,
              nums,
              freq,
              `Record prefix sum ${sum} with frequency ${freq[key]}.`,
              { line: 6, vars: { count } },
            );
          }
          r.returnValue(count, { description: `${count} subarrays sum to ${k}.` });
          r.done(count);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 930,
    title: "Binary Subarrays With Sum",
    difficulty: "medium",
    category: "search",
    tags: ["array", "prefix-sum", "sliding-window"],
    inputSchema: "array-target",
    statement: `# 930. Binary Subarrays With Sum

Given a binary array and \`goal\`, return the number of non-empty subarrays with sum equal to \`goal\`.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 0, 1, 0, 1], goal: 2 } },
      { label: "Example 2", input: { array: [0, 0, 0, 0, 0], goal: 0 } },
    ],
    solutions: [
      sol<ArrGoal>({
        id: "930-prefix-count",
        name: "Prefix Sum Count",
        time: "O(n)",
        space: "O(n)",
        code: `function numSubarraysWithSum(nums: number[], goal: number): number {
  const freq = new Map<number, number>();
  freq.set(0, 1);
  let sum = 0, ans = 0;
  for (const x of nums) {
    sum += x;
    ans += freq.get(sum - goal) ?? 0;
    freq.set(sum, (freq.get(sum) ?? 0) + 1);
  }
  return ans;
}`,
        execute({ array, goal }) {
          const r = new EventRecorder("930-prefix-count");
          const nums = [...array];
          const freq: Record<string, number> = { "0": 1 };
          let sum = 0;
          let ans = 0;
          showArrayMap(
            r,
            nums,
            freq,
            `Binary subarrays with sum goal=${goal}. Same prefix technique as 560.`,
            { vars: { sum, ans, goal } },
          );
          for (let i = 0; i < nums.length; i++) {
            sum += nums[i];
            const need = String(sum - goal);
            const add = freq[need] ?? 0;
            ans += add;
            showArrayMap(
              r,
              nums,
              freq,
              `i=${i}: running sum ${sum}. Prefix ${sum - goal} seen ${add} times → ans=${ans}.`,
              {
                line: 5,
                kinds: { [i]: "current" },
                vars: { i, sum, ans },
              },
            );
            const key = String(sum);
            freq[key] = (freq[key] ?? 0) + 1;
            showArrayMap(
              r,
              nums,
              freq,
              `Increment freq[${sum}] to ${freq[key]}.`,
              { line: 6 },
            );
          }
          r.returnValue(ans, { description: `${ans} binary subarrays sum to ${goal}.` });
          r.done(ans);
          return r.getEvents();
        },
      }),
    ],
  }),
];
