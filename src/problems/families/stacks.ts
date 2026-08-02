import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type PathIn = { path: string };
type Arr = { array: number[] };
type RpnIn = { tokens: string[] };
type CalcIn = { s: string };
type DecodeIn = { s: string };
type NgeIn = { nums1: number[]; nums2: number[] };
type Ops155 = { ops: Array<{ op: string; val?: number }> };

function showStack(
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

export const stacksFamily: ProblemPackage[] = [
  createProblem({
    id: 71,
    title: "Simplify Path",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "string"],
    inputSchema: "array",
    statement: `# 71. Simplify Path

Canonicalize a Unix-style absolute path using a stack.`,
    testcases: [
      { label: "Example 1", input: { path: "/home/" } },
      { label: "Example 2", input: { path: "/../" } },
      { label: "Example 3", input: { path: "/home//foo/" } },
    ],
    solutions: [
      sol<PathIn>({
        id: "71-path-stack",
        name: "Component Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function simplifyPath(path: string): string {
  const stack: string[] = [];
  for (const part of path.split("/")) {
    if (part === "..") stack.pop();
    else if (part && part !== ".") stack.push(part);
  }
  return "/" + stack.join("/");
}`,
        execute({ path }) {
          const r = new EventRecorder("71-path-stack");
          const parts = path.split("/");
          const stack: string[] = [];
          showStack(r, parts, stack, "Split path by '/' and process each part.", {
            vars: { path },
          });
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            showStack(
              r,
              parts,
              stack,
              `Part[${i}]='${part}'.`,
              { line: 3, kinds: { [i]: "current" }, vars: { i, part } },
            );
            if (part === "..") {
              const popped = stack.pop();
              showStack(
                r,
                parts,
                stack,
                popped ? `Pop '${popped}' for '..'.` : "Stack empty — ignore '..'.",
                { line: 4 },
              );
            } else if (part && part !== ".") {
              stack.push(part);
              showStack(r, parts, stack, `Push '${part}'.`, { line: 5 });
            } else {
              showStack(r, parts, stack, `Skip empty or '.'.`, {});
            }
          }
          const result = "/" + stack.join("/");
          r.returnValue(result, { description: `Simplified: ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 84,
    title: "Largest Rectangle in Histogram",
    difficulty: "hard",
    category: "stack",
    tags: ["stack", "monotonic"],
    inputSchema: "array",
    statement: `# 84. Largest Rectangle in Histogram

Find the largest rectangle area in a histogram using a monotonic stack.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 1, 5, 6, 2, 3] } },
      { label: "Example 2", input: { array: [2, 4] } },
    ],
    solutions: [
      sol<Arr>({
        id: "84-mono-stack",
        name: "Monotonic Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function largestRectangleArea(heights: number[]): number {
  const st: number[] = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (st.length && heights[st.at(-1)!] > h) {
      const idx = st.pop()!;
      best = Math.max(best, heights[idx] * (i - idx - (st.at(-1) ?? -1) - 1));
    }
    st.push(i);
  }
  return best;
}`,
        execute({ array }) {
          const r = new EventRecorder("84-mono-stack");
          const heights = [...array];
          const st: number[] = [];
          let best = 0;
          showStack(r, heights, st.map((i) => heights[i]), "Monotonic increasing index stack.", {
            vars: { best },
          });
          for (let i = 0; i <= heights.length; i++) {
            const h = i === heights.length ? 0 : heights[i];
            showStack(
              r,
              heights,
              st.map((idx) => heights[idx]),
              `i=${i}, height=${h}. Compare with stack top.`,
              { line: 4, kinds: i < heights.length ? { [i]: "current" } : {}, vars: { i, h } },
            );
            while (st.length && heights[st[st.length - 1]] > h) {
              const idx = st.pop()!;
              const width = i - idx - (st[st.length - 1] ?? -1) - 1;
              const area = heights[idx] * width;
              best = Math.max(best, area);
              showStack(
                r,
                heights,
                st.map((ix) => heights[ix]),
                `Pop index ${idx} (h=${heights[idx]}), width=${width}, area=${area}, best=${best}.`,
                { line: 6, vars: { idx, area, best } },
              );
            }
            if (i < heights.length) {
              st.push(i);
              showStack(r, heights, st.map((ix) => heights[ix]), `Push index ${i}.`, {
                line: 9,
              });
            }
          }
          r.returnValue(best);
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 150,
    title: "Evaluate Reverse Polish Notation",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "math"],
    inputSchema: "array",
    statement: `# 150. Evaluate Reverse Polish Notation

Evaluate an arithmetic expression in Reverse Polish Notation.`,
    testcases: [
      { label: "Example 1", input: { tokens: ["2", "1", "+", "3", "*"] } },
      { label: "Example 2", input: { tokens: ["4", "13", "5", "/", "+"] } },
    ],
    solutions: [
      sol<RpnIn>({
        id: "150-rpn-stack",
        name: "Operand Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function evalRPN(tokens: string[]): number {
  const st: number[] = [];
  for (const t of tokens) {
    if ("+-*/".includes(t)) {
      const b = st.pop()!, a = st.pop()!;
      st.push(t === "+" ? a+b : t === "-" ? a-b : t === "*" ? a*b : (a/b)|0);
    } else st.push(+t);
  }
  return st[0];
}`,
        execute({ tokens }) {
          const r = new EventRecorder("150-rpn-stack");
          const st: number[] = [];
          showStack(r, tokens, st, "Process tokens left to right.", {});
          for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            showStack(r, tokens, st, `Token '${t}'.`, {
              line: 3,
              kinds: { [i]: "current" },
              vars: { i, t },
            });
            if ("+-*/".includes(t)) {
              const b = st.pop()!;
              const a = st.pop()!;
              const res =
                t === "+"
                  ? a + b
                  : t === "-"
                    ? a - b
                    : t === "*"
                      ? a * b
                      : Math.trunc(a / b);
              st.push(res);
              showStack(
                r,
                tokens,
                st,
                `Apply ${a} ${t} ${b} = ${res}, push result.`,
                { line: 5 },
              );
            } else {
              st.push(+t);
              showStack(r, tokens, st, `Push operand ${+t}.`, { line: 7 });
            }
          }
          r.returnValue(st[0]);
          r.done(st[0]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 155,
    title: "Min Stack",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "design"],
    inputSchema: "stack-ops",
    statement: `# 155. Min Stack

Design a stack that supports push, pop, top, and getMin in O(1). Animate operations.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "push", val: -2 },
            { op: "push", val: 0 },
            { op: "push", val: -3 },
            { op: "getMin" },
            { op: "pop" },
            { op: "top" },
            { op: "getMin" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops155>({
        id: "155-min-pair-stack",
        name: "Value + Min Stack",
        time: "O(1) per op",
        space: "O(n)",
        code: `class MinStack {
  stack: number[] = [];
  mins: number[] = [];
  push(x) { this.stack.push(x); this.mins.push(Math.min(x, this.mins.at(-1) ?? x)); }
  pop() { this.stack.pop(); this.mins.pop(); }
  getMin() { return this.mins.at(-1)!; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("155-min-pair-stack");
          const stack: number[] = [];
          const mins: number[] = [];
          const results: unknown[] = [];
          const show = (desc: string) =>
            showStack(r, mins, stack, desc, { vars: { mins: [...mins], results } });
          show("Parallel stacks: values and running minimums.");
          for (const op of ops) {
            if (op.op === "push" && op.val !== undefined) {
              stack.push(op.val);
              mins.push(Math.min(op.val, mins[mins.length - 1] ?? op.val));
              show(`push(${op.val}): mins top = ${mins[mins.length - 1]}.`);
            } else if (op.op === "pop") {
              const v = stack.pop();
              mins.pop();
              show(`pop(): removed ${v}.`);
            } else if (op.op === "top") {
              const v = stack[stack.length - 1];
              show(`top(): ${v}.`);
              results.push(v);
            } else if (op.op === "getMin") {
              const m = mins[mins.length - 1];
              show(`getMin(): ${m}.`);
              results.push(m);
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
    id: 224,
    title: "Basic Calculator",
    difficulty: "hard",
    category: "stack",
    tags: ["stack", "string", "math"],
    inputSchema: "array",
    statement: `# 224. Basic Calculator

Evaluate a string with +, -, parentheses, and digits using a stack.`,
    testcases: [
      { label: "Example 1", input: { s: "1 + 1" } },
      { label: "Example 2", input: { s: " 2-1 + 2 " } },
      { label: "Example 3", input: { s: "(1+(4+5+2)-3)+(6+8)" } },
    ],
    solutions: [
      sol<CalcIn>({
        id: "224-calc-stack",
        name: "Sign Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function calculate(s: string): number {
  let num = 0, sign = 1, total = 0;
  const st: number[] = [];
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") num = num * 10 + +ch;
    else if (ch === "+") { total += sign * num; num = 0; sign = 1; }
    else if (ch === "-") { total += sign * num; num = 0; sign = -1; }
    else if (ch === "(") { st.push(total, sign); total = 0; sign = 1; num = 0; }
    else if (ch === ")") { total += sign * num; num = 0; total *= st.pop()!; total += st.pop()!; }
  }
  return total + sign * num;
}`,
        execute({ s }) {
          const r = new EventRecorder("224-calc-stack");
          const chars = s.split("");
          let num = 0;
          let sign = 1;
          let total = 0;
          const st: number[] = [];
          showStack(r, chars, st, "Stack stores (total, sign) at '('.", {
            vars: { num, sign, total },
          });
          for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            if (ch === " ") continue;
            showStack(r, chars, st, `Process '${ch}'.`, {
              line: 4,
              kinds: { [i]: "current" },
              vars: { ch, num, sign, total },
            });
            if (ch >= "0" && ch <= "9") {
              num = num * 10 + +ch;
              showStack(r, chars, st, `Build num → ${num}.`, { vars: { num } });
            } else if (ch === "+") {
              total += sign * num;
              num = 0;
              sign = 1;
              showStack(r, chars, st, `Flush + term. total=${total}.`, { vars: { total } });
            } else if (ch === "-") {
              total += sign * num;
              num = 0;
              sign = -1;
              showStack(r, chars, st, `Flush − term. total=${total}, sign=-1.`, {
                vars: { total, sign },
              });
            } else if (ch === "(") {
              st.push(total, sign);
              total = 0;
              sign = 1;
              num = 0;
              showStack(r, chars, st, `Push (${st[st.length - 2]}, ${st[st.length - 1]}), reset.`, {
                vars: { st: [...st] },
              });
            } else if (ch === ")") {
              total += sign * num;
              num = 0;
              const prevSign = st.pop()!;
              const prevTotal = st.pop()!;
              total = prevTotal + prevSign * total;
              showStack(r, chars, st, `Close paren: total=${total}.`, { vars: { total } });
            }
          }
          const result = total + sign * num;
          r.returnValue(result, { description: `Result = ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 394,
    title: "Decode String",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "string"],
    inputSchema: "array",
    statement: `# 394. Decode String

Decode strings like \`3[a2[c]]\` using stacks for counts and segments.`,
    testcases: [
      { label: "Example 1", input: { s: "3[a]2[bc]" } },
      { label: "Example 2", input: { s: "3[a2[c]]" } },
    ],
    solutions: [
      sol<DecodeIn>({
        id: "394-decode-stack",
        name: "Count + String Stacks",
        time: "O(n)",
        space: "O(n)",
        code: `function decodeString(s: string): string {
  const counts: number[] = [], strs: string[] = [""];
  let num = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") num = num * 10 + +ch;
    else if (ch === "[") { counts.push(num); strs.push(""); num = 0; }
    else if (ch === "]") {
      const k = counts.pop()!, prev = strs.pop()!;
      strs[strs.length - 1] += prev + strs[strs.length - 1].slice(-1).repeat(k);
    } else strs[strs.length - 1] += ch;
  }
  return strs[0];
}`,
        execute({ s }) {
          const r = new EventRecorder("394-decode-stack");
          const chars = s.split("");
          const counts: number[] = [];
          const strs: string[] = [""];
          let num = 0;
          showStack(r, chars, strs, "Stacks: repeat counts and partial strings.", {
            vars: { counts: [...counts], current: strs[strs.length - 1] },
          });
          for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            showStack(r, chars, strs, `Char '${ch}'.`, {
              kinds: { [i]: "current" },
              vars: { ch, num },
            });
            if (ch >= "0" && ch <= "9") {
              num = num * 10 + +ch;
              showStack(r, chars, strs, `Build repeat count → ${num}.`, { vars: { num } });
            } else if (ch === "[") {
              counts.push(num);
              strs.push("");
              num = 0;
              showStack(r, chars, strs, `Push count ${counts[counts.length - 1]}, start segment.`, {
                vars: { counts: [...counts] },
              });
            } else if (ch === "]") {
              const k = counts.pop()!;
              const inner = strs.pop()!;
              strs[strs.length - 1] += inner.repeat(k);
              showStack(
                r,
                chars,
                strs,
                `Repeat '${inner}' × ${k} → append to outer.`,
                { vars: { built: strs[strs.length - 1] } },
              );
            } else {
              strs[strs.length - 1] += ch;
              showStack(r, chars, strs, `Append '${ch}' to current segment.`, {
                vars: { current: strs[strs.length - 1] },
              });
            }
          }
          r.returnValue(strs[0]);
          r.done(strs[0]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 496,
    title: "Next Greater Element I",
    difficulty: "easy",
    category: "stack",
    tags: ["stack", "monotonic", "hashmap"],
    inputSchema: "array",
    statement: `# 496. Next Greater Element I

For each element in \`nums1\`, find the next greater element in \`nums2\`.`,
    testcases: [
      { label: "Example 1", input: { nums1: [4, 1, 2], nums2: [1, 3, 4, 2] } },
    ],
    solutions: [
      sol<NgeIn>({
        id: "496-mono-map",
        name: "Monotonic Stack + Map",
        time: "O(n+m)",
        space: "O(n)",
        code: `function nextGreaterElement(nums1, nums2) {
  const map = new Map<number, number>();
  const st: number[] = [];
  for (const x of nums2) {
    while (st.length && st.at(-1)! < x) map.set(st.pop()!, x);
    st.push(x);
  }
  return nums1.map(x => map.get(x) ?? -1);
}`,
        execute({ nums1, nums2 }) {
          const r = new EventRecorder("496-mono-map");
          const map: Record<string, number> = {};
          const st: number[] = [];
          showStack(r, nums2, st, "Build next-greater map from nums2.", { vars: { map } });
          for (let i = 0; i < nums2.length; i++) {
            const x = nums2[i];
            showStack(r, nums2, st, `x=${x}. Pop smaller stack tops.`, {
              kinds: { [i]: "current" },
              vars: { x },
            });
            while (st.length && st[st.length - 1] < x) {
              const popped = st.pop()!;
              map[String(popped)] = x;
              showStack(
                r,
                nums2,
                st,
                `NGE(${popped}) = ${x}.`,
                { vars: { map: { ...map } } },
              );
            }
            st.push(x);
            showStack(r, nums2, st, `Push ${x}.`, {});
          }
          const result = nums1.map((x) => map[String(x)] ?? -1);
          showArray(r, nums1, `Answer for nums1: [${result.join(", ")}].`, {
            vars: { result },
          });
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 739,
    title: "Daily Temperatures",
    difficulty: "medium",
    category: "stack",
    tags: ["stack", "monotonic"],
    inputSchema: "array",
    statement: `# 739. Daily Temperatures

Return days until a warmer temperature for each day.`,
    testcases: [
      { label: "Example 1", input: { array: [73, 74, 75, 71, 69, 72, 76, 73] } },
    ],
    solutions: [
      sol<Arr>({
        id: "739-mono-stack",
        name: "Monotonic Decreasing Stack",
        time: "O(n)",
        space: "O(n)",
        code: `function dailyTemperatures(t: number[]): number[] {
  const ans = Array(t.length).fill(0);
  const st: number[] = [];
  for (let i = 0; i < t.length; i++) {
    while (st.length && t[st.at(-1)!] < t[i]) {
      const j = st.pop()!;
      ans[j] = i - j;
    }
    st.push(i);
  }
  return ans;
}`,
        execute({ array }) {
          const r = new EventRecorder("739-mono-stack");
          const t = [...array];
          const ans = Array(t.length).fill(0);
          const st: number[] = [];
          showStack(
            r,
            t,
            st.map((i) => t[i]),
            "Stack holds indices waiting for warmer day.",
            { vars: { ans: [...ans] } },
          );
          for (let i = 0; i < t.length; i++) {
            showStack(r, t, st.map((ix) => t[ix]), `Day ${i}: temp ${t[i]}.`, {
              line: 4,
              kinds: { [i]: "current" },
              vars: { i },
            });
            while (st.length && t[st[st.length - 1]] < t[i]) {
              const j = st.pop()!;
              ans[j] = i - j;
              showStack(
                r,
                t,
                st.map((ix) => t[ix]),
                `Warmer at ${i}: ans[${j}] = ${i - j} days.`,
                { line: 5, vars: { ans: [...ans] } },
              );
            }
            st.push(i);
            showStack(r, t, st.map((ix) => t[ix]), `Push index ${i}.`, { line: 8 });
          }
          r.returnValue(ans);
          r.done(ans);
          return r.getEvents();
        },
      }),
    ],
  }),
];
