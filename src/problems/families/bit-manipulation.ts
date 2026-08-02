import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type Arr = { array: number[] };
type NumIn = { n: number };
type TwoNum = { a: number; b: number };

export const bitFamily: ProblemPackage[] = [
  createProblem({
    id: 136,
    title: "Single Number",
    difficulty: "easy",
    category: "search",
    tags: ["bit-manipulation", "xor"],
    inputSchema: "array",
    statement: `# 136. Single Number

Every element appears twice except one — find it in O(n) time, O(1) space.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 2, 1] } },
      { label: "Example 2", input: { array: [4, 1, 2, 1, 2] } },
    ],
    solutions: [
      sol<Arr>({
        id: "136-xor",
        name: "XOR Cancel Pairs",
        time: "O(n)",
        space: "O(1)",
        code: `function singleNumber(nums: number[]): number {
  let x = 0;
  for (const n of nums) x ^= n;
  return x;
}`,
        execute({ array }) {
          const r = new EventRecorder("136-xor");
          let x = 0;
          showArray(r, array, "XOR accumulator x starts at 0.", { vars: { x: x.toString(2).padStart(8, "0") } });
          for (let i = 0; i < array.length; i++) {
            const n = array[i];
            const prev = x;
            x ^= n;
            showArray(
              r,
              array,
              `x ^= ${n}: ${prev} XOR ${n} → ${x}. Pairs cancel to 0.`,
              {
                line: 2,
                kinds: { [i]: "current" },
                vars: { x, n, xor: `${prev} ^ ${n} = ${x}` },
              },
            );
          }
          r.returnValue(x);
          r.done(x);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 137,
    title: "Single Number II",
    difficulty: "medium",
    category: "search",
    tags: ["bit-manipulation"],
    inputSchema: "array",
    statement: `# 137. Single Number II

Every element appears three times except one.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 2, 3, 2] } },
      { label: "Example 2", input: { array: [0, 1, 0, 1, 0, 1, 99] } },
    ],
    solutions: [
      sol<Arr>({
        id: "137-bit-count",
        name: "Count Bits mod 3",
        time: "O(n)",
        space: "O(1)",
        code: `function singleNumber(nums: number[]): number {
  let ones = 0, twos = 0;
  for (const n of nums) {
    ones = (ones ^ n) & ~twos;
    twos = (twos ^ n) & ~ones;
  }
  return ones;
}`,
        execute({ array }) {
          const r = new EventRecorder("137-bit-count");
          let ones = 0;
          let twos = 0;
          showArray(r, array, "Track bit counts mod 3 with ones/twos registers.", {
            vars: { ones, twos },
          });
          for (let i = 0; i < array.length; i++) {
            const n = array[i];
            const prevO = ones;
            const prevT = twos;
            ones = (ones ^ n) & ~twos;
            twos = (twos ^ n) & ~ones;
            showArray(
              r,
              array,
              `n=${n}: update ones ${prevO}→${ones}, twos ${prevT}→${twos}.`,
              {
                kinds: { [i]: "current" },
                vars: { n, ones, twos },
              },
            );
          }
          r.returnValue(ones);
          r.done(ones);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 190,
    title: "Reverse Bits",
    difficulty: "easy",
    category: "search",
    tags: ["bit-manipulation"],
    inputSchema: "array",
    statement: `# 190. Reverse Bits

Reverse bits of a 32-bit unsigned integer.`,
    testcases: [
      { label: "Example 1", input: { n: 43261596 } },
      { label: "Example 2", input: { n: 2147483644 } },
    ],
    solutions: [
      sol<NumIn>({
        id: "190-reverse-bits",
        name: "Bit-by-Bit Reverse",
        time: "O(32)",
        space: "O(1)",
        code: `function reverseBits(n: number): number {
  let ans = 0;
  for (let i = 0; i < 32; i++) {
    ans = (ans << 1) | (n & 1);
    n >>>= 1;
  }
  return ans >>> 0;
}`,
        execute({ n }) {
          const r = new EventRecorder("190-reverse-bits");
          let num = n >>> 0;
          let ans = 0;
          showArray(
            r,
            num.toString(2).padStart(32, "0").split("").map(Number),
            `Reverse 32 bits of ${n}.`,
            { vars: { n, ans } },
          );
          for (let i = 0; i < 32; i++) {
            const bit = num & 1;
            ans = (ans << 1) | bit;
            num >>>= 1;
            showArray(
              r,
              ans.toString(2).padStart(32, "0").split("").map(Number),
              `Bit ${i}: shift ans left, append bit ${bit}.`,
              { line: 3, vars: { i, bit, ans: ans >>> 0 } },
            );
          }
          const result = ans >>> 0;
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 191,
    title: "Number of 1 Bits",
    difficulty: "easy",
    category: "search",
    tags: ["bit-manipulation"],
    inputSchema: "array",
    statement: `# 191. Number of 1 Bits

Return the number of set bits in a 32-bit integer (Hamming weight).`,
    testcases: [
      { label: "Example 1", input: { n: 11 } },
      { label: "Example 2", input: { n: 128 } },
    ],
    solutions: [
      sol<NumIn>({
        id: "191-hamming",
        name: "Brian Kernighan",
        time: "O(set bits)",
        space: "O(1)",
        code: `function hammingWeight(n: number): number {
  let count = 0;
  while (n) { n &= n - 1; count++; }
  return count;
}`,
        execute({ n }) {
          const r = new EventRecorder("191-hamming");
          let num = n >>> 0;
          let count = 0;
          showArray(
            r,
            num.toString(2).padStart(8, "0").split("").map(Number),
            `Count 1-bits in ${n} using n &= n-1.`,
            { vars: { count } },
          );
          while (num) {
            const prev = num;
            num &= num - 1;
            count++;
            showArray(
              r,
              num.toString(2).padStart(8, "0").split("").map(Number),
              `Clear lowest set bit: ${prev} & ${prev - 1} → ${num}. count=${count}.`,
              { vars: { count, cleared: prev - (prev & (prev - 1)) } },
            );
          }
          r.returnValue(count);
          r.done(count);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 231,
    title: "Power of Two",
    difficulty: "easy",
    category: "search",
    tags: ["bit-manipulation"],
    inputSchema: "array",
    statement: `# 231. Power of Two

Return true if n is a power of two.`,
    testcases: [
      { label: "Example 1", input: { n: 1 } },
      { label: "Example 2", input: { n: 16 } },
      { label: "Example 3", input: { n: 3 } },
    ],
    solutions: [
      sol<NumIn>({
        id: "231-power-two",
        name: "Single Bit Check",
        time: "O(1)",
        space: "O(1)",
        code: `function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}`,
        execute({ n }) {
          const r = new EventRecorder("231-power-two");
          showArray(
            r,
            n.toString(2).padStart(8, "0").split("").map(Number),
            `Power of 2 iff exactly one set bit: n & (n-1) === 0.`,
            { vars: { n } },
          );
          const nMinus1 = n - 1;
          const and = n & nMinus1;
          showArray(
            r,
            and.toString(2).padStart(8, "0").split("").map(Number),
            `${n} & ${nMinus1} = ${and}. ${n > 0 && and === 0 ? "Single bit — power of 2." : "Not power of 2."}`,
            { vars: { nMinus1, and } },
          );
          const result = n > 0 && and === 0;
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 338,
    title: "Counting Bits",
    difficulty: "easy",
    category: "search",
    tags: ["bit-manipulation", "dp"],
    inputSchema: "array",
    statement: `# 338. Counting Bits

Return an array ans where ans[i] is the number of 1's in the binary representation of i.`,
    testcases: [
      { label: "Example 1", input: { n: 2 } },
      { label: "Example 2", input: { n: 5 } },
    ],
    solutions: [
      sol<NumIn>({
        id: "338-dp-bits",
        name: "DP from i >> 1",
        time: "O(n)",
        space: "O(n)",
        code: `function countBits(n: number): number[] {
  const ans = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) ans[i] = ans[i >> 1] + (i & 1);
  return ans;
}`,
        execute({ n }) {
          const r = new EventRecorder("338-dp-bits");
          const ans = Array(n + 1).fill(0);
          showArray(r, ans, `ans[i] = ans[i>>1] + (i&1) for i=1..${n}.`, {});
          for (let i = 1; i <= n; i++) {
            const half = i >> 1;
            const lsb = i & 1;
            ans[i] = ans[half] + lsb;
            showArray(
              r,
              ans,
              `ans[${i}] = ans[${half}](${ans[half]}) + (${lsb}) = ${ans[i]}.`,
              {
                line: 2,
                kinds: { [i]: "write" },
                vars: { i, half, lsb },
              },
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
    id: 371,
    title: "Sum of Two Integers",
    difficulty: "medium",
    category: "search",
    tags: ["bit-manipulation"],
    inputSchema: "array",
    statement: `# 371. Sum of Two Integers

Calculate a + b without using + or - operators.`,
    testcases: [
      { label: "Example 1", input: { a: 1, b: 2 } },
      { label: "Example 2", input: { a: 2, b: 3 } },
    ],
    solutions: [
      sol<TwoNum>({
        id: "371-bit-add",
        name: "XOR + Carry",
        time: "O(32)",
        space: "O(1)",
        code: `function getSum(a: number, b: number): number {
  while (b) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}`,
        execute({ a, b }) {
          const r = new EventRecorder("371-bit-add");
          let x = a;
          let y = b;
          showArray(r, [x, y], `Add ${a}+${b} using XOR sum and AND carry.`, {
            vars: { a: x, b: y },
          });
          let step = 0;
          while (y) {
            const carry = (x & y) << 1;
            showArray(
              r,
              [x, y],
              `Step ${step}: carry = (a&b)<<1 = ${carry}.`,
              { vars: { carry } },
            );
            x = x ^ y;
            y = carry;
            showArray(
              r,
              [x, y],
              `a = a^b → ${x}, b = carry → ${y}.`,
              { line: 2, vars: { a: x, b: y } },
            );
            step++;
          }
          r.returnValue(x);
          r.done(x);
          return r.getEvents();
        },
      }),
    ],
  }),
];
