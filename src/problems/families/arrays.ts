import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, showArrayMap } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type Arr = { array: number[] };
type ArrVal = { array: number[]; val: number };
type ArrTarget = { array: number[]; target: number };

export const arrayFamily: ProblemPackage[] = [
  createProblem({
    id: 27,
    title: "Remove Element",
    difficulty: "easy",
    category: "search",
    tags: ["array", "two-pointers"],
    inputSchema: "array-target",
    statement: `# 27. Remove Element

Given an integer array \`nums\` and an integer \`val\`, remove all occurrences of \`val\` in-place. Return the number of elements remaining.`,
    testcases: [
      { label: "Example 1", input: { array: [3, 2, 2, 3], target: 3 } },
      { label: "Example 2", input: { array: [0, 1, 2, 2, 3, 0, 4, 2], target: 2 } },
    ],
    solutions: [
      sol<ArrTarget>({
        id: "27-two-pointers",
        name: "Two Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function removeElement(nums: number[], val: number): number {
  let k = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== val) nums[k++] = nums[i];
  }
  return k;
}`,
        execute({ array, target: val }) {
          const r = new EventRecorder("27-two-pointers");
          const nums = [...array];
          let k = 0;
          showArray(r, nums, `Remove all ${val}. Write pointer k starts at 0.`, {
            vars: { k, val },
          });
          for (let i = 0; i < nums.length; i++) {
            showArray(
              r,
              nums,
              `Inspect index ${i}: value ${nums[i]}. ${nums[i] === val ? `Equals val ${val} — skip.` : `Keep — write at k=${k}.`}`,
              {
                line: 3,
                kinds: {
                  [i]: "comparing",
                  ...(k < nums.length ? { [k]: "write" as const } : {}),
                },
                vars: { i, k, val },
              },
            );
            if (nums[i] !== val) {
              nums[k] = nums[i];
              showArray(r, nums, `Wrote ${nums[i]} at index ${k}. k → ${k + 1}.`, {
                line: 4,
                kinds: { [k]: "write" },
                vars: { i, k, val },
              });
              k++;
            }
          }
          showArray(r, nums, `Done. First ${k} elements are the answer.`, {
            kinds: Object.fromEntries(
              Array.from({ length: k }, (_, i) => [i, "found" as const]),
            ),
            vars: { k, result: k },
          });
          r.returnValue(k, { description: `Return k = ${k}.` });
          r.done(k);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 26,
    title: "Remove Duplicates from Sorted Array",
    difficulty: "easy",
    category: "search",
    tags: ["array", "two-pointers"],
    inputSchema: "array",
    statement: `# 26. Remove Duplicates from Sorted Array

Remove duplicates in-place from a sorted array so each unique element appears once. Return the count of unique elements.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 1, 2] } },
      { label: "Example 2", input: { array: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] } },
    ],
    solutions: [
      sol<Arr>({
        id: "26-two-pointers",
        name: "Slow/Fast Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function removeDuplicates(nums: number[]): number {
  if (!nums.length) return 0;
  let k = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[k - 1]) nums[k++] = nums[i];
  }
  return k;
}`,
        execute({ array }) {
          const r = new EventRecorder("26-two-pointers");
          const nums = [...array];
          if (!nums.length) {
            r.done(0);
            return r.getEvents();
          }
          let k = 1;
          showArray(r, nums, "Sorted array — unique write pointer k starts at 1.", {
            kinds: { 0: "sorted" },
            vars: { k },
          });
          for (let i = 1; i < nums.length; i++) {
            showArray(
              r,
              nums,
              `Compare nums[${i}]=${nums[i]} with last unique nums[${k - 1}]=${nums[k - 1]}.`,
              {
                line: 4,
                kinds: { [i]: "comparing", [k - 1]: "selected" },
                vars: { i, k },
              },
            );
            if (nums[i] !== nums[k - 1]) {
              nums[k] = nums[i];
              showArray(r, nums, `New unique ${nums[i]} → write at k=${k}.`, {
                line: 5,
                kinds: { [k]: "write" },
                vars: { i, k },
              });
              k++;
            } else {
              showArray(r, nums, `Duplicate ${nums[i]} — skip.`, {
                kinds: { [i]: "swapped" },
                vars: { i, k },
              });
            }
          }
          showArray(r, nums, `Unique prefix length k = ${k}.`, {
            kinds: Object.fromEntries(
              Array.from({ length: k }, (_, i) => [i, "found" as const]),
            ),
            vars: { k },
          });
          r.returnValue(k);
          r.done(k);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 88,
    title: "Merge Sorted Array",
    difficulty: "easy",
    category: "sort",
    tags: ["array", "two-pointers", "sorting"],
    inputSchema: "array",
    statement: `# 88. Merge Sorted Array

Merge \`nums2\` into \`nums1\` as one sorted array in-place. \`nums1\` has length m+n with trailing zeros as buffer.`,
    testcases: [
      {
        label: "Example 1",
        input: { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
      },
      {
        label: "Example 2",
        input: { nums1: [1], m: 1, nums2: [], n: 0 },
      },
    ],
    solutions: [
      sol<{ nums1: number[]; m: number; nums2: number[]; n: number }>({
        id: "88-backward",
        name: "Backward Merge",
        time: "O(m+n)",
        space: "O(1)",
        code: `function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (j >= 0) {
    nums1[k--] = i >= 0 && nums1[i] > nums2[j] ? nums1[i--] : nums2[j--];
  }
}`,
        execute({ nums1, m, nums2, n }) {
          const r = new EventRecorder("88-backward");
          const a = [...nums1];
          let i = m - 1;
          let j = n - 1;
          let k = m + n - 1;
          showArray(r, a, `Merge nums2 into nums1 from the back. i=${i}, j=${j}, k=${k}.`, {
            vars: { i, j, k, m, n },
            kinds: { [k]: "write" },
          });
          while (j >= 0) {
            if (i >= 0 && a[i] > nums2[j]) {
              showArray(
                r,
                a,
                `nums1[${i}]=${a[i]} > nums2[${j}]=${nums2[j]} → place ${a[i]} at k=${k}.`,
                {
                  kinds: { [i]: "comparing", [k]: "write" },
                  vars: { i, j, k },
                },
              );
              a[k--] = a[i--];
            } else {
              showArray(
                r,
                a,
                `Take nums2[${j}]=${nums2[j]} → place at k=${k}.`,
                {
                  kinds: { [k]: "write" },
                  vars: { i, j, k, from2: nums2[j] },
                },
              );
              a[k--] = nums2[j--];
            }
            showArray(r, a, `After write: array = [${a.join(", ")}].`, {
              kinds: { [k + 1]: "merged" },
              vars: { i, j, k },
            });
          }
          showArray(r, a, "Merge complete — nums1 is fully sorted.", {
            sorted: a.map((_, idx) => idx),
          });
          r.done(a);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 169,
    title: "Majority Element",
    difficulty: "easy",
    category: "search",
    tags: ["array", "hash-table", "counting"],
    inputSchema: "array",
    statement: `# 169. Majority Element

Find the majority element that appears more than ⌊n/2⌋ times.`,
    testcases: [
      { label: "Example 1", input: { array: [3, 2, 3] } },
      { label: "Example 2", input: { array: [2, 2, 1, 1, 1, 2, 2] } },
    ],
    solutions: [
      sol<Arr>({
        id: "169-boyer-moore",
        name: "Boyer-Moore Voting",
        time: "O(n)",
        space: "O(1)",
        code: `function majorityElement(nums: number[]): number {
  let count = 0, candidate = 0;
  for (const x of nums) {
    if (count === 0) candidate = x;
    count += x === candidate ? 1 : -1;
  }
  return candidate;
}`,
        execute({ array }) {
          const r = new EventRecorder("169-boyer-moore");
          const nums = [...array];
          let count = 0;
          let candidate = 0;
          showArray(r, nums, "Boyer-Moore: track a candidate and a vote count.", {
            vars: { count, candidate },
          });
          for (let i = 0; i < nums.length; i++) {
            const x = nums[i];
            if (count === 0) {
              candidate = x;
              showArray(r, nums, `Count is 0 → new candidate = ${x}.`, {
                kinds: { [i]: "selected" },
                vars: { i, count, candidate },
              });
            }
            count += x === candidate ? 1 : -1;
            showArray(
              r,
              nums,
              `${x === candidate ? "Vote +" : "Vote −"}1 for candidate ${candidate}. count = ${count}.`,
              {
                kinds: {
                  [i]: x === candidate ? "found" : "comparing",
                },
                vars: { i, count, candidate },
              },
            );
          }
          showArray(r, nums, `Majority element is ${candidate}.`, {
            kinds: Object.fromEntries(
              nums.map((v, i) => [i, v === candidate ? ("found" as const) : ("searching" as const)]),
            ),
            vars: { candidate },
          });
          r.returnValue(candidate);
          r.done(candidate);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 217,
    title: "Contains Duplicate",
    difficulty: "easy",
    category: "search",
    tags: ["array", "hash-table"],
    inputSchema: "array",
    statement: `# 217. Contains Duplicate

Return true if any value appears at least twice in the array.`,
    testcases: [
      { label: "Has duplicate", input: { array: [1, 2, 3, 1] } },
      { label: "All unique", input: { array: [1, 2, 3, 4] } },
    ],
    solutions: [
      sol<Arr>({
        id: "217-hashset",
        name: "Hash Set",
        time: "O(n)",
        space: "O(n)",
        code: `function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}`,
        execute({ array }) {
          const r = new EventRecorder("217-hashset");
          const nums = [...array];
          const seen: Record<string, number> = {};
          showArrayMap(r, nums, seen, "Scan left→right; store seen values in a set.");
          for (let i = 0; i < nums.length; i++) {
            const x = nums[i];
            showArrayMap(
              r,
              nums,
              seen,
              `Check ${x} at index ${i}. ${x in seen ? "Already seen — duplicate!" : "Not seen yet — insert."}`,
              {
                kinds: { [i]: x in seen ? "found" : "current" },
                vars: { i, x },
              },
            );
            if (x in seen) {
              r.returnValue(true, { description: `Duplicate ${x} found.` });
              r.done(true);
              return r.getEvents();
            }
            seen[String(x)] = i;
            showArrayMap(r, nums, seen, `Add ${x} → index ${i} to the set.`, {
              kinds: { [i]: "write" },
            });
          }
          showArrayMap(r, nums, seen, "No duplicates found.", { vars: { result: false } });
          r.returnValue(false);
          r.done(false);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 238,
    title: "Product of Array Except Self",
    difficulty: "medium",
    category: "search",
    tags: ["array", "prefix-sum"],
    inputSchema: "array",
    statement: `# 238. Product of Array Except Self

Return an array \`answer\` where \`answer[i]\` is the product of all elements except \`nums[i]\`. O(n) without division.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 4] } },
      { label: "With zero", input: { array: [-1, 1, 0, -3, 3] } },
    ],
    solutions: [
      sol<Arr>({
        id: "238-prefix-suffix",
        name: "Prefix × Suffix",
        time: "O(n)",
        space: "O(1) extra",
        code: `function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, out = Array(n).fill(1);
  let left = 1;
  for (let i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
}`,
        execute({ array }) {
          const r = new EventRecorder("238-prefix-suffix");
          const nums = [...array];
          const n = nums.length;
          const out = Array(n).fill(1);
          showArray(r, nums, "Pass 1: fill prefix products into output.", {
            vars: { pass: 1 },
          });
          let left = 1;
          for (let i = 0; i < n; i++) {
            out[i] = left;
            showArray(r, out, `out[${i}] = left product ${left} (excluding nums[${i}]=${nums[i]}).`, {
              kinds: { [i]: "write" },
              vars: { i, left, nums_i: nums[i] },
            });
            left *= nums[i];
          }
          let right = 1;
          showArray(r, out, "Pass 2: multiply by suffix products from the right.", {
            vars: { pass: 2 },
          });
          for (let i = n - 1; i >= 0; i--) {
            out[i] *= right;
            showArray(
              r,
              out,
              `Multiply out[${i}] by right product ${right} → ${out[i]}.`,
              {
                kinds: { [i]: "merged" },
                vars: { i, right },
              },
            );
            right *= nums[i];
          }
          showArray(r, out, `Final answer: [${out.join(", ")}].`, {
            sorted: out.map((_, i) => i),
          });
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 268,
    title: "Missing Number",
    difficulty: "easy",
    category: "search",
    tags: ["array", "bit-manipulation", "math"],
    inputSchema: "array",
    statement: `# 268. Missing Number

Given \`n\` distinct numbers in \`[0, n]\`, return the only missing number.`,
    testcases: [
      { label: "Example 1", input: { array: [3, 0, 1] } },
      { label: "Example 2", input: { array: [0, 1] } },
      { label: "Example 3", input: { array: [9, 6, 4, 2, 3, 5, 7, 0, 1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "268-xor",
        name: "XOR",
        approach: "optimal",
        time: "O(n)",
        space: "O(1)",
        code: `function missingNumber(nums: number[]): number {
  let x = nums.length;
  for (let i = 0; i < nums.length; i++) x ^= i ^ nums[i];
  return x;
}`,
        execute({ array }) {
          const r = new EventRecorder("268-xor");
          const nums = [...array];
          let x = nums.length;
          showArray(r, nums, `XOR trick: start with n=${nums.length}.`, {
            vars: { xor: x },
          });
          for (let i = 0; i < nums.length; i++) {
            x ^= i ^ nums[i];
            showArray(
              r,
              nums,
              `XOR with index ${i} and value ${nums[i]} → running XOR = ${x}.`,
              {
                kinds: { [i]: "current" },
                vars: { i, xor: x },
              },
            );
          }
          showArray(r, nums, `Missing number is ${x}.`, {
            vars: { result: x },
          });
          r.returnValue(x);
          r.done(x);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 283,
    title: "Move Zeroes",
    difficulty: "easy",
    category: "search",
    tags: ["array", "two-pointers"],
    inputSchema: "array",
    statement: `# 283. Move Zeroes

Move all zeroes to the end while preserving the relative order of non-zero elements.`,
    testcases: [
      { label: "Example 1", input: { array: [0, 1, 0, 3, 12] } },
      { label: "Example 2", input: { array: [0] } },
    ],
    solutions: [
      sol<Arr>({
        id: "283-two-pointers",
        name: "Two Pointers",
        time: "O(n)",
        space: "O(1)",
        code: `function moveZeroes(nums: number[]): void {
  let k = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      [nums[k], nums[i]] = [nums[i], nums[k]];
      k++;
    }
  }
}`,
        execute({ array }) {
          const r = new EventRecorder("283-two-pointers");
          const nums = [...array];
          let k = 0;
          showArray(r, nums, "Write pointer k tracks the next non-zero slot.", {
            vars: { k },
          });
          for (let i = 0; i < nums.length; i++) {
            showArray(
              r,
              nums,
              `Index ${i}: ${nums[i] === 0 ? "zero — leave for later." : `non-zero — swap with k=${k}.`}`,
              {
                kinds: { [i]: "comparing", [k]: "write" },
                vars: { i, k },
              },
            );
            if (nums[i] !== 0) {
              if (i !== k) {
                r.swap(i, k, {
                  description: `Swap ${nums[i]} ↔ ${nums[k]} to pack non-zeroes left.`,
                });
                [nums[i], nums[k]] = [nums[k], nums[i]];
              }
              showArray(r, nums, `Non-zero region grows; k → ${k + 1}.`, {
                kinds: { [k]: "sorted" },
                vars: { i, k },
              });
              k++;
            }
          }
          showArray(r, nums, "All zeroes bubbled to the end.", {
            sorted: Array.from({ length: k }, (_, i) => i),
          });
          r.done(nums);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 448,
    title: "Find All Numbers Disappeared in an Array",
    difficulty: "easy",
    category: "search",
    tags: ["array", "hash-table"],
    inputSchema: "array",
    statement: `# 448. Find All Numbers Disappeared in an Array

Given \`nums\` of length n with values in \`[1, n]\`, return all numbers in that range that do not appear.`,
    testcases: [
      { label: "Example 1", input: { array: [4, 3, 2, 7, 8, 2, 3, 1] } },
      { label: "Example 2", input: { array: [1, 1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "448-mark-index",
        name: "Index Marking",
        time: "O(n)",
        space: "O(1)",
        code: `function findDisappearedNumbers(nums: number[]): number[] {
  for (const x of nums) {
    const i = Math.abs(x) - 1;
    if (nums[i] > 0) nums[i] *= -1;
  }
  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) if (nums[i] > 0) out.push(i + 1);
  return out;
}`,
        execute({ array }) {
          const r = new EventRecorder("448-mark-index");
          const nums = [...array];
          showArray(r, nums, "Mark presence by negating nums[value-1].", {});
          for (let i = 0; i < nums.length; i++) {
            const x = Math.abs(nums[i]);
            const idx = x - 1;
            showArray(
              r,
              nums,
              `Value ${x} means index ${idx} should be marked as seen.`,
              {
                kinds: { [i]: "current", [idx]: "selected" },
                vars: { i, x, idx },
              },
            );
            if (nums[idx] > 0) {
              nums[idx] *= -1;
              showArray(r, nums, `Negate nums[${idx}] → ${nums[idx]} (seen ${x}).`, {
                kinds: { [idx]: "write" },
              });
            }
          }
          const out: number[] = [];
          for (let i = 0; i < nums.length; i++) {
            if (nums[i] > 0) {
              out.push(i + 1);
              showArray(r, nums, `nums[${i}] > 0 → ${i + 1} is missing.`, {
                kinds: { [i]: "found" },
                vars: { missing: out },
              });
            }
          }
          r.returnValue(out, { description: `Missing numbers: [${out.join(", ")}].` });
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 724,
    title: "Find Pivot Index",
    difficulty: "easy",
    category: "search",
    tags: ["array", "prefix-sum"],
    inputSchema: "array",
    statement: `# 724. Find Pivot Index

Return the pivot index where left sum equals right sum. If none, return -1.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 7, 3, 6, 5, 6] } },
      { label: "Example 2", input: { array: [1, 2, 3] } },
      { label: "Example 3", input: { array: [2, 1, -1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "724-prefix",
        name: "Prefix Sum",
        time: "O(n)",
        space: "O(1)",
        code: `function pivotIndex(nums: number[]): number {
  const total = nums.reduce((a, b) => a + b, 0);
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    if (left === total - left - nums[i]) return i;
    left += nums[i];
  }
  return -1;
}`,
        execute({ array }) {
          const r = new EventRecorder("724-prefix");
          const nums = [...array];
          const total = nums.reduce((a, b) => a + b, 0);
          let left = 0;
          showArray(r, nums, `Total sum = ${total}. Look for left == right.`, {
            vars: { total, left },
          });
          for (let i = 0; i < nums.length; i++) {
            const right = total - left - nums[i];
            showArray(
              r,
              nums,
              `Index ${i}: left=${left}, mid=${nums[i]}, right=${right}.`,
              {
                kinds: {
                  ...Object.fromEntries(
                    Array.from({ length: i }, (_, j) => [j, "left" as const]),
                  ),
                  [i]: "current",
                  ...Object.fromEntries(
                    Array.from({ length: nums.length - i - 1 }, (_, j) => [
                      i + 1 + j,
                      "right" as const,
                    ]),
                  ),
                },
                vars: { i, left, right, mid: nums[i] },
              },
            );
            if (left === right) {
              showArray(r, nums, `Pivot found at index ${i}.`, {
                kinds: { [i]: "found" },
              });
              r.returnValue(i);
              r.done(i);
              return r.getEvents();
            }
            left += nums[i];
          }
          showArray(r, nums, "No pivot index exists.", {});
          r.returnValue(-1);
          r.done(-1);
          return r.getEvents();
        },
      }),
    ],
  }),
];
