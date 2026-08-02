import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type Arr = { array: number[] };
type GasCost = { gas: number[]; cost: number[] };
type People = { people: number[][] };
type Intervals = { intervals: number[][] };
type Points = { points: number[][] };
type StrIn = { s: string };

export const greedyFamily: ProblemPackage[] = [
  createProblem({
    id: 45,
    title: "Jump Game II",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "array"],
    inputSchema: "array",
    statement: `# 45. Jump Game II

Return the minimum number of jumps to reach the last index.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 3, 1, 1, 4] } },
      { label: "Example 2", input: { array: [2, 3, 0, 1, 4] } },
    ],
    solutions: [
      sol<Arr>({
        id: "45-greedy-bfs",
        name: "Greedy BFS Layers",
        time: "O(n)",
        space: "O(1)",
        code: `function jump(nums: number[]): number {
  let jumps = 0, curEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === curEnd) { jumps++; curEnd = farthest; }
  }
  return jumps;
}`,
        execute({ array }) {
          const r = new EventRecorder("45-greedy-bfs");
          const nums = [...array];
          let jumps = 0;
          let curEnd = 0;
          let farthest = 0;
          showArray(r, nums, "Greedy: extend farthest reach, jump at layer boundary.", {
            vars: { jumps, curEnd, farthest },
          });
          for (let i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            showArray(
              r,
              nums,
              `i=${i}, reach=${i + nums[i]}, farthest=${farthest}.`,
              {
                kinds: { [i]: "current" },
                vars: { i, farthest, curEnd },
              },
            );
            if (i === curEnd) {
              jumps++;
              curEnd = farthest;
              showArray(
                r,
                nums,
                `End of jump layer — jumps=${jumps}, next boundary=${curEnd}.`,
                { vars: { jumps, curEnd } },
              );
            }
          }
          r.returnValue(jumps);
          r.done(jumps);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 55,
    title: "Jump Game",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "array"],
    inputSchema: "array",
    statement: `# 55. Jump Game

Return true if you can reach the last index starting at index 0.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 3, 1, 1, 4] } },
      { label: "Example 2", input: { array: [3, 2, 1, 0, 4] } },
    ],
    solutions: [
      sol<Arr>({
        id: "55-greedy-reach",
        name: "Max Reach Greedy",
        time: "O(n)",
        space: "O(1)",
        code: `function canJump(nums: number[]): boolean {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}`,
        execute({ array }) {
          const r = new EventRecorder("55-greedy-reach");
          const nums = [...array];
          let reach = 0;
          showArray(r, nums, "Track farthest index reachable from start.", { vars: { reach } });
          for (let i = 0; i < nums.length; i++) {
            showArray(r, nums, `i=${i}: ${i > reach ? "unreachable!" : `reach=${reach}.`}`, {
              kinds: { [i]: i > reach ? "swapped" : "current" },
              vars: { i, reach },
            });
            if (i > reach) {
              r.returnValue(false, { description: `Stuck at ${i} — cannot jump.` });
              r.done(false);
              return r.getEvents();
            }
            reach = Math.max(reach, i + nums[i]);
            showArray(r, nums, `Update reach → ${reach}.`, { vars: { reach } });
          }
          r.returnValue(true);
          r.done(true);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 134,
    title: "Gas Station",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "array"],
    inputSchema: "array",
    statement: `# 134. Gas Station

Find the starting gas station index to complete a circuit, or -1.`,
    testcases: [
      { label: "Example 1", input: { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] } },
      { label: "Example 2", input: { gas: [2, 3, 4], cost: [3, 4, 3] } },
    ],
    solutions: [
      sol<GasCost>({
        id: "134-greedy-tank",
        name: "Single Pass Tank",
        time: "O(n)",
        space: "O(1)",
        code: `function canCompleteCircuit(gas, cost) {
  let tank = 0, start = 0, deficit = 0;
  for (let i = 0; i < gas.length; i++) {
    tank += gas[i] - cost[i];
    if (tank < 0) { deficit += tank; start = i + 1; tank = 0; }
  }
  return deficit + tank >= 0 ? start : -1;
}`,
        execute({ gas, cost }) {
          const r = new EventRecorder("134-greedy-tank");
          let tank = 0;
          let start = 0;
          let deficit = 0;
          showArray(r, gas, "Track running tank — reset start when tank goes negative.", {
            vars: { tank, start, deficit, cost },
          });
          for (let i = 0; i < gas.length; i++) {
            const delta = gas[i] - cost[i];
            tank += delta;
            showArray(
              r,
              gas,
              `Station ${i}: +${gas[i]} -${cost[i]} = ${delta}. tank=${tank}.`,
              {
                kinds: { [i]: "current" },
                vars: { i, delta, tank, start },
              },
            );
            if (tank < 0) {
              deficit += tank;
              start = i + 1;
              tank = 0;
              showArray(
                r,
                gas,
                `Negative tank — skip to start=${start}, deficit=${deficit}.`,
                { vars: { start, deficit, tank } },
              );
            }
          }
          const result = deficit + tank >= 0 ? start : -1;
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 406,
    title: "Queue Reconstruction by Height",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "sorting"],
    inputSchema: "array",
    statement: `# 406. Queue Reconstruction by Height

Reconstruct queue from [height, count] pairs.`,
    testcases: [
      {
        label: "Example 1",
        input: { people: [[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]] },
      },
    ],
    solutions: [
      sol<People>({
        id: "406-greedy-insert",
        name: "Sort + Insert by k",
        time: "O(n²)",
        space: "O(n)",
        code: `function reconstructQueue(people) {
  people.sort((a, b) => a[0] !== b[0] ? b[0] - a[0] : a[1] - b[1]);
  const ans = [];
  for (const p of people) ans.splice(p[1], 0, p);
  return ans;
}`,
        execute({ people }) {
          const r = new EventRecorder("406-greedy-insert");
          const sorted = [...people].sort((a, b) =>
            a[0] !== b[0] ? b[0] - a[0] : a[1] - b[1],
          );
          const ans: number[][] = [];
          showArray(
            r,
            sorted.map(([h, k]) => `${h},${k}`),
            "Sort by height desc, then insert each at index k.",
            {},
          );
          for (let i = 0; i < sorted.length; i++) {
            const [h, k] = sorted[i];
            ans.splice(k, 0, [h, k]);
            showArray(
              r,
              ans.map(([a, b]) => `${a},${b}`),
              `Insert [${h},${k}] at position k=${k}.`,
              { kinds: { [k]: "write" }, vars: { h, k } },
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
    id: 435,
    title: "Non-overlapping Intervals",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "intervals"],
    inputSchema: "array",
    statement: `# 435. Non-overlapping Intervals

Return minimum intervals to remove so the rest don't overlap.`,
    testcases: [
      { label: "Example 1", input: { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] } },
      { label: "Example 2", input: { intervals: [[1, 2], [1, 2], [1, 2]] } },
    ],
    solutions: [
      sol<Intervals>({
        id: "435-greedy-end",
        name: "Sort by End, Greedy Keep",
        time: "O(n log n)",
        space: "O(1)",
        code: `function eraseOverlapIntervals(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);
  let end = -Infinity, removed = 0;
  for (const [s, e] of intervals) {
    if (s >= end) end = e;
    else removed++;
  }
  return removed;
}`,
        execute({ intervals }) {
          const r = new EventRecorder("435-greedy-end");
          const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
          let end = -Infinity;
          let removed = 0;
          showArray(
            r,
            sorted.map(([a, b]) => `${a}-${b}`),
            "Sort by end — keep interval if start ≥ last end.",
            { vars: { end, removed } },
          );
          for (let i = 0; i < sorted.length; i++) {
            const [s, e] = sorted[i];
            showArray(
              r,
              sorted.map(([a, b]) => `${a}-${b}`),
              `[${s},${e}]: ${s >= end ? `keep, end→${e}` : "overlap — remove"}.`,
              {
                kinds: { [i]: s >= end ? "found" : "swapped" },
                vars: { s, e, end, removed },
              },
            );
            if (s >= end) end = e;
            else removed++;
          }
          r.returnValue(removed);
          r.done(removed);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 452,
    title: "Minimum Number of Arrows to Burst Balloons",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "intervals"],
    inputSchema: "array",
    statement: `# 452. Minimum Number of Arrows to Burst Balloons

Return minimum arrows to burst all balloons (intervals on x-axis).`,
    testcases: [
      { label: "Example 1", input: { points: [[10, 16], [2, 8], [1, 6], [7, 12]] } },
      { label: "Example 2", input: { points: [[1, 2], [3, 4], [5, 6], [7, 8]] } },
    ],
    solutions: [
      sol<Points>({
        id: "452-greedy-arrows",
        name: "Sort by End, One Arrow per Cluster",
        time: "O(n log n)",
        space: "O(1)",
        code: `function findMinArrowShots(points) {
  points.sort((a, b) => a[1] - b[1]);
  let arrows = 0, end = -Infinity;
  for (const [s, e] of points) {
    if (s > end) { arrows++; end = e; }
  }
  return arrows;
}`,
        execute({ points }) {
          const r = new EventRecorder("452-greedy-arrows");
          const sorted = [...points].sort((a, b) => a[1] - b[1]);
          let arrows = 0;
          let end = -Infinity;
          showArray(
            r,
            sorted.map(([a, b]) => `${a}-${b}`),
            "Sort balloons by x_end — shoot at end when start > last arrow.",
            { vars: { arrows, end } },
          );
          for (let i = 0; i < sorted.length; i++) {
            const [s, e] = sorted[i];
            if (s > end) {
              arrows++;
              end = e;
              showArray(
                r,
                sorted.map(([a, b]) => `${a}-${b}`),
                `New arrow at x=${e} (balloon ${i}). arrows=${arrows}.`,
                { kinds: { [i]: "found" }, vars: { arrows, end } },
              );
            } else {
              showArray(
                r,
                sorted.map(([a, b]) => `${a}-${b}`),
                `Balloon [${s},${e}] burst by arrow at ${end}.`,
                { kinds: { [i]: "selected" } },
              );
            }
          }
          r.returnValue(arrows);
          r.done(arrows);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 763,
    title: "Partition Labels",
    difficulty: "medium",
    category: "search",
    tags: ["greedy", "string"],
    inputSchema: "array",
    statement: `# 763. Partition Labels

Partition string so each letter appears in at most one part — return part sizes.`,
    testcases: [
      { label: "Example 1", input: { s: "ababcbacadefegdehijhklij" } },
      { label: "Example 2", input: { s: "eccbbbbdec" } },
    ],
    solutions: [
      sol<StrIn>({
        id: "763-greedy-last",
        name: "Last Occurrence Greedy",
        time: "O(n)",
        space: "O(1)",
        code: `function partitionLabels(s: string): number[] {
  const last = new Map<string, number>();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  const ans = []; let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i])!);
    if (i === end) { ans.push(end - start + 1); start = i + 1; }
  }
  return ans;
}`,
        execute({ s }) {
          const r = new EventRecorder("763-greedy-last");
          const chars = s.split("");
          const last: Record<string, number> = {};
          for (let i = 0; i < s.length; i++) last[s[i]] = i;
          const ans: number[] = [];
          let start = 0;
          let end = 0;
          showArray(r, chars, "Extend partition end to last occurrence of each char.", {
            vars: { last, start, end },
          });
          for (let i = 0; i < s.length; i++) {
            end = Math.max(end, last[s[i]]);
            showArray(
              r,
              chars,
              `i=${i} '${s[i]}': end=${end}.`,
              {
                kinds: { [i]: "current", ...Object.fromEntries(Array.from({ length: end - start + 1 }, (_, k) => [start + k, "searching" as const])) },
                vars: { i, end, start },
              },
            );
            if (i === end) {
              const size = end - start + 1;
              ans.push(size);
              showArray(
                r,
                chars,
                `Close partition [${start},${end}] size=${size}.`,
                { vars: { ans: [...ans], start: i + 1 } },
              );
              start = i + 1;
            }
          }
          r.returnValue(ans);
          r.done(ans);
          return r.getEvents();
        },
      }),
    ],
  }),
];
