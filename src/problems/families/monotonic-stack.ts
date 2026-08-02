import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type StrIn = { s: string };
type StrK = { num: string; k: number };
type Arr = { array: number[] };
type StockOps = { ops: Array<{ op: string; val?: number }> };

function showMonoStack(
  r: EventRecorder,
  array: (number | string)[],
  stack: (number | string)[],
  description: string,
  opts: {
    line?: number;
    kinds?: Record<number, import("@/core/types/execution").HighlightKind>;
    vars?: Record<string, unknown>;
  } = {},
) {
  r.setStructure({ array: [...array], stack: [...stack] }, { line: opts.line, description });
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  r.highlight({ kinds: opts.kinds ?? {}, line: opts.line, description });
}

export const monotonicStackFamily: ProblemPackage[] = [
  createProblem({
    id: 316,
    title: "Remove Duplicate Letters",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "monotonic", "greedy", "string"],
    inputSchema: "array",
    statement: `# 316. Remove Duplicate Letters

Remove duplicate letters so every letter appears once and the result is the smallest lexicographic string.`,
    testcases: [
      { label: "Example 1", input: { s: "bcabc" } },
      { label: "Example 2", input: { s: "cbacdcbc" } },
    ],
    solutions: [
      sol<StrIn>({
        id: "316-mono-greedy",
        name: "Monotonic Stack + Last Index",
        time: "O(n)",
        space: "O(1) alphabet",
        code: `function removeDuplicateLetters(s: string): string {
  const last = new Map<string, number>();
  const st: string[] = [];
  const inStack = new Set<string>();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStack.has(c)) continue;
    while (st.length && st.at(-1)! > c && last.get(st.at(-1)!)! > i) {
      inStack.delete(st.pop()!);
    }
    st.push(c); inStack.add(c);
  }
  return st.join("");
}`,
        execute({ s }) {
          const r = new EventRecorder("316-mono-greedy");
          const chars = s.split("");
          const last: Record<string, number> = {};
          for (let i = 0; i < s.length; i++) last[s[i]] = i;
          const st: string[] = [];
          const inStack = new Set<string>();
          showMonoStack(r, chars, st, "Increasing stack — pop when smaller char appears later.", {
            vars: { last },
          });
          for (let i = 0; i < s.length; i++) {
            const c = s[i];
            showMonoStack(r, chars, st, `i=${i}, char='${c}'.`, {
              line: 5,
              kinds: { [i]: "current" },
              vars: { i, c },
            });
            if (inStack.has(c)) {
              showMonoStack(r, chars, st, `'${c}' already in stack — skip.`, {});
              continue;
            }
            while (st.length && st[st.length - 1] > c && last[st[st.length - 1]] > i) {
              const popped = st.pop()!;
              inStack.delete(popped);
              showMonoStack(
                r,
                chars,
                st,
                `Pop '${popped}' — smaller '${c}' can come first.`,
                { line: 7 },
              );
            }
            st.push(c);
            inStack.add(c);
            showMonoStack(r, chars, st, `Push '${c}'. Stack = "${st.join("")}".`, { line: 9 });
          }
          const result = st.join("");
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 402,
    title: "Remove K Digits",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "monotonic", "greedy"],
    inputSchema: "array",
    statement: `# 402. Remove K Digits

Remove k digits from a number string to form the smallest possible number.`,
    testcases: [
      { label: "Example 1", input: { num: "1432219", k: 3 } },
      { label: "Example 2", input: { num: "10200", k: 1 } },
    ],
    solutions: [
      sol<StrK>({
        id: "402-mono-pop",
        name: "Monotonic Increasing Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function removeKdigits(num: string, k: number): string {
  const st: string[] = [];
  for (const d of num) {
    while (k && st.length && st.at(-1)! > d) { st.pop(); k--; }
    st.push(d);
  }
  while (k--) st.pop();
  return st.join("").replace(/^0+/, "") || "0";
}`,
        execute({ num, k }) {
          const r = new EventRecorder("402-mono-pop");
          const digits = num.split("");
          let rem = k;
          const st: string[] = [];
          showMonoStack(r, digits, st, `Remove ${k} digits — pop larger leading digits.`, {
            vars: { k: rem },
          });
          for (let i = 0; i < digits.length; i++) {
            const d = digits[i];
            showMonoStack(r, digits, st, `Digit '${d}' at i=${i}.`, {
              kinds: { [i]: "current" },
              vars: { i, d, k: rem },
            });
            while (rem > 0 && st.length && st[st.length - 1] > d) {
              const popped = st.pop()!;
              rem--;
              showMonoStack(
                r,
                digits,
                st,
                `Pop '${popped}' > '${d}' — ${rem} removals left.`,
                { vars: { k: rem } },
              );
            }
            st.push(d);
            showMonoStack(r, digits, st, `Push '${d}'.`, {});
          }
          while (rem > 0 && st.length) {
            const popped = st.pop()!;
            rem--;
            showMonoStack(r, digits, st, `Remove trailing '${popped}'. k=${rem}.`, {
              vars: { k: rem },
            });
          }
          let result = st.join("").replace(/^0+/, "") || "0";
          r.returnValue(result, { description: `Smallest number: "${result}".` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 503,
    title: "Next Greater Element II",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "monotonic", "circular"],
    inputSchema: "array",
    statement: `# 503. Next Greater Element II

Given a circular array, return the next greater element for each index.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 1] } },
      { label: "Example 2", input: { array: [1, 2, 3, 4, 3] } },
    ],
    solutions: [
      sol<Arr>({
        id: "503-circular-mono",
        name: "Circular Monotonic Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function nextGreaterElements(nums: number[]): number[] {
  const n = nums.length, ans = Array(n).fill(-1), st: number[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const x = nums[i % n];
    while (st.length && nums[st.at(-1)!] < x) ans[st.pop()!] = x;
    if (i < n) st.push(i);
  }
  return ans;
}`,
        execute({ array }) {
          const r = new EventRecorder("503-circular-mono");
          const nums = [...array];
          const n = nums.length;
          const ans = Array(n).fill(-1);
          const st: number[] = [];
          showMonoStack(
            r,
            nums,
            st.map((i) => nums[i]),
            "Double pass — monotonic decreasing index stack.",
            { vars: { ans: [...ans] } },
          );
          for (let i = 0; i < 2 * n; i++) {
            const x = nums[i % n];
            showMonoStack(
              r,
              nums,
              st.map((ix) => nums[ix]),
              `Pass i=${i}, value=${x} (index ${i % n}).`,
              {
                kinds: { [i % n]: "current" },
                vars: { i, x, circular: i >= n },
              },
            );
            while (st.length && nums[st[st.length - 1]] < x) {
              const j = st.pop()!;
              ans[j] = x;
              showMonoStack(
                r,
                nums,
                st.map((ix) => nums[ix]),
                `NGE(nums[${j}]=${nums[j]}) = ${x}.`,
                { vars: { ans: [...ans] } },
              );
            }
            if (i < n) {
              st.push(i);
              showMonoStack(r, nums, st.map((ix) => nums[ix]), `Push index ${i}.`, {});
            }
          }
          r.returnValue(ans);
          r.done(ans);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 901,
    title: "Online Stock Span",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "monotonic", "design"],
    inputSchema: "stack-ops",
    statement: `# 901. Online Stock Span

Design a class that returns the span of stock prices (consecutive days ≤ today's price).`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "next", val: 100 },
            { op: "next", val: 80 },
            { op: "next", val: 60 },
            { op: "next", val: 70 },
            { op: "next", val: 60 },
            { op: "next", val: 75 },
            { op: "next", val: 85 },
          ],
        },
      },
    ],
    solutions: [
      sol<StockOps>({
        id: "901-mono-span",
        name: "Monotonic Decreasing Stack",
        time: "O(1) amortized",
        space: "O(n)",
        code: `class StockSpanner {
  st: [number, number][] = [];
  next(price) {
    let span = 1;
    while (this.st.length && this.st.at(-1)![0] <= price) span += this.st.pop()![1];
    this.st.push([price, span]);
    return span;
  }
}`,
        execute({ ops }) {
          const r = new EventRecorder("901-mono-span");
          const prices: number[] = [];
          const st: [number, number][] = [];
          const results: number[] = [];
          showMonoStack(
            r,
            prices,
            st.map(([p]) => p),
            "Stack stores [price, span] pairs — pop lower/equal prices.",
            {},
          );
          for (const op of ops) {
            if (op.op !== "next" || op.val === undefined) continue;
            const price = op.val;
            let span = 1;
            showMonoStack(
              r,
              prices,
              st.map(([p]) => p),
              `next(${price}): accumulate span from stack.`,
              { vars: { price, span } },
            );
            while (st.length && st[st.length - 1][0] <= price) {
              const [, prevSpan] = st.pop()!;
              span += prevSpan;
              showMonoStack(
                r,
                prices,
                st.map(([p]) => p),
                `Pop lower price — span grows to ${span}.`,
                { vars: { span } },
              );
            }
            st.push([price, span]);
            prices.push(price);
            results.push(span);
            showMonoStack(
              r,
              prices,
              st.map(([p]) => p),
              `Push [${price}, ${span}] — return span=${span}.`,
              { vars: { span, results: [...results] } },
            );
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),
];
