import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, showArrayMap, kindsRange } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type Arr = { array: number[] };
type StrPair = { s: string; t: string };
type ArrTarget = { array: number[]; target: number };
type ArrK = { array: number[]; k: number };

function windowKinds(left: number, right: number) {
  return {
    ...kindsRange(left, right, "searching"),
    [left]: "left" as const,
    [right]: "right" as const,
  };
}

function showWindow(
  r: EventRecorder,
  chars: string[],
  left: number,
  right: number,
  description: string,
  extra: { hashmap?: Record<string, number | string | null>; vars?: Record<string, unknown>; line?: number } = {},
) {
  const structures = extra.hashmap
    ? { array: [...chars], hashmap: { ...extra.hashmap } }
    : { array: [...chars] };
  r.setStructure(structures, { line: extra.line, description });
  if (extra.vars) {
    for (const [k, v] of Object.entries(extra.vars)) r.updateVariable(k, v);
  }
  r.movePointer("left", left);
  r.movePointer("right", right);
  r.highlight({
    kinds: windowKinds(left, right),
    line: extra.line,
    description,
  });
}

export const slidingWindowFamily: ProblemPackage[] = [
  createProblem({
    id: 76,
    title: "Minimum Window Substring",
    difficulty: "hard",
    category: "sliding-window",
    tags: ["string", "sliding-window", "hash-table"],
    inputSchema: "window",
    statement: `# 76. Minimum Window Substring

Return the smallest substring of \`s\` that contains all characters of \`t\` (including duplicates).`,
    testcases: [
      { label: "Example 1", input: { s: "ADOBECODEBANC", t: "ABC" } },
      { label: "Example 2", input: { s: "a", t: "a" } },
      { label: "Example 3", input: { s: "a", t: "aa" } },
    ],
    solutions: [
      sol<StrPair>({
        id: "76-min-window",
        name: "Expand / Shrink Window",
        time: "O(|s|+|t|)",
        space: "O(|Σ|)",
        code: `function minWindow(s: string, t: string): string {
  const need: Record<string, number> = {};
  for (const c of t) need[c] = (need[c] ?? 0) + 1;
  let formed = 0, required = Object.keys(need).length;
  let left = 0, bestL = 0, bestLen = Infinity;
  const have: Record<string, number> = {};
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    have[c] = (have[c] ?? 0) + 1;
    if (need[c] && have[c] === need[c]) formed++;
    while (formed === required) {
      if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestL = left; }
      const lc = s[left];
      have[lc]--;
      if (need[lc] && have[lc] < need[lc]) formed--;
      left++;
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);
}`,
        execute({ s, t }) {
          const r = new EventRecorder("76-min-window");
          const chars = s.split("");
          const need: Record<string, number> = {};
          for (const c of t) need[c] = (need[c] ?? 0) + 1;
          const required = Object.keys(need).length;
          const have: Record<string, number> = {};
          let formed = 0;
          let left = 0;
          let bestL = 0;
          let bestLen = Infinity;
          showArrayMap(
            r,
            chars,
            need,
            `Need counts for t="${t}". Expand right, shrink when valid.`,
            { vars: { required, formed, bestLen: "∞" } },
          );
          for (let right = 0; right < chars.length; right++) {
            const c = chars[right];
            have[c] = (have[c] ?? 0) + 1;
            if (need[c] && have[c] === need[c]) formed++;
            showWindow(
              r,
              chars,
              left,
              right,
              `Expand to '${c}'. Window "${s.slice(left, right + 1)}" — formed ${formed}/${required}.`,
              { hashmap: { ...need, ...Object.fromEntries(Object.entries(have).map(([k, v]) => [`have:${k}`, v])) }, vars: { formed, required } },
            );
            while (formed === required) {
              const len = right - left + 1;
              if (len < bestLen) {
                bestLen = len;
                bestL = left;
                showWindow(
                  r,
                  chars,
                  left,
                  right,
                  `Valid window len=${len} — new best "${s.slice(bestL, bestL + bestLen)}".`,
                  { vars: { bestLen, best: s.slice(bestL, bestL + bestLen) } },
                );
              } else {
                showWindow(
                  r,
                  chars,
                  left,
                  right,
                  `Valid window len=${len}, but best remains ${bestLen}.`,
                  { vars: { bestLen } },
                );
              }
              const lc = chars[left];
              have[lc] = (have[lc] ?? 0) - 1;
              if (need[lc] && have[lc] < need[lc]) formed--;
              showWindow(
                r,
                chars,
                left,
                right,
                `Shrink: remove '${lc}' from left. formed=${formed}.`,
                { vars: { formed, removed: lc } },
              );
              left++;
            }
          }
          const result = bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);
          showArray(r, chars, result ? `Minimum window: "${result}".` : "No valid window.", {
            vars: { result },
          });
          r.returnValue(result, { description: result ? `Return "${result}".` : "Return empty string." });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 209,
    title: "Minimum Size Subarray Sum",
    difficulty: "medium",
    category: "sliding-window",
    tags: ["array", "sliding-window", "binary-search"],
    inputSchema: "array-target",
    statement: `# 209. Minimum Size Subarray Sum

Return the minimal length of a contiguous subarray whose sum is ≥ \`target\`. Return 0 if none exists.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 3, 1, 2, 4, 3], target: 7 } },
      { label: "Example 2", input: { array: [1, 4, 4], target: 4 } },
      { label: "Example 3", input: { array: [1, 1, 1, 1, 1, 1, 1, 1], target: 11 } },
    ],
    solutions: [
      sol<ArrTarget>({
        id: "209-shrink-window",
        name: "Sliding Window Sum",
        time: "O(n)",
        space: "O(1)",
        code: `function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0, sum = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}`,
        execute({ array, target }) {
          const r = new EventRecorder("209-shrink-window");
          const nums = [...array];
          let left = 0;
          let sum = 0;
          let best = Infinity;
          showArray(r, nums, `Find shortest subarray with sum ≥ ${target}.`, {
            vars: { target, sum, best: "∞" },
          });
          for (let right = 0; right < nums.length; right++) {
            sum += nums[right];
            showArray(
              r,
              nums,
              `Add nums[${right}]=${nums[right]} → sum=${sum}. Window [${left}, ${right}].`,
              {
                line: 3,
                kinds: windowKinds(left, right),
                vars: { left, right, sum },
              },
            );
            while (sum >= target) {
              const len = right - left + 1;
              best = Math.min(best, len);
              showArray(
                r,
                nums,
                `sum=${sum} ≥ ${target}. Length ${len} — best=${best === Infinity ? "∞" : best}. Shrink left.`,
                {
                  line: 5,
                  kinds: windowKinds(left, right),
                  vars: { best, len },
                },
              );
              sum -= nums[left];
              showArray(r, nums, `Remove nums[${left}]=${nums[left]} — sum=${sum}.`, {
                kinds: { [left]: "swapped" },
                vars: { sum, removed: nums[left] },
              });
              left++;
            }
          }
          const result = best === Infinity ? 0 : best;
          showArray(r, nums, result ? `Minimum length = ${result}.` : "No subarray reaches target.", {
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
    id: 239,
    title: "Sliding Window Maximum",
    difficulty: "hard",
    category: "sliding-window",
    tags: ["array", "sliding-window", "deque", "heap"],
    inputSchema: "array",
    statement: `# 239. Sliding Window Maximum

Return the maximum value in each sliding window of size \`k\` over \`nums\`.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 } },
      { label: "Example 2", input: { array: [1], k: 1 } },
    ],
    solutions: [
      sol<ArrK>({
        id: "239-monotonic-deque",
        name: "Monotonic Deque",
        time: "O(n)",
        space: "O(k)",
        code: `function maxSlidingWindow(nums: number[], k: number): number[] {
  const dq: number[] = [], out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && dq[0] <= i - k) dq.shift();
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) out.push(nums[dq[0]]);
  }
  return out;
}`,
        execute({ array, k }) {
          const r = new EventRecorder("239-monotonic-deque");
          const nums = [...array];
          const dq: number[] = [];
          const out: number[] = [];
          showArray(r, nums, `Window size k=${k}. Deque stores indices of candidates (front = max).`, {
            vars: { k, deque: [] as number[] },
          });
          r.setStructure({ array: nums, queue: [] }, { description: "Empty monotonic deque." });

          for (let i = 0; i < nums.length; i++) {
            while (dq.length && dq[0] <= i - k) {
              const expired = dq.shift()!;
              r.dequeue(nums[expired], {
                description: `Front index ${expired} left window — dequeue.`,
              });
              r.setStructure(
                { array: nums, queue: dq.map((idx) => nums[idx]) },
                { description: `Deque after expiring index ${expired}.` },
              );
              showArray(
                r,
                nums,
                `Index ${expired} expired (outside window ending at ${i}).`,
                {
                  kinds: { [expired]: "swapped", ...windowKinds(Math.max(0, i - k + 1), i) },
                  vars: { deque: dq.map((idx) => nums[idx]) },
                },
              );
            }
            while (dq.length && nums[dq[dq.length - 1]!] <= nums[i]) {
              const popped = dq.pop()!;
              r.dequeue(nums[popped], {
                description: `Pop smaller back index ${popped} (${nums[popped]} ≤ ${nums[i]}).`,
              });
              r.setStructure(
                { array: nums, queue: dq.map((idx) => nums[idx]) },
                { description: `Maintain decreasing deque before pushing ${nums[i]}.` },
              );
              showArray(r, nums, `Drop index ${popped} — ${nums[popped]} cannot be max.`, {
                kinds: { [popped]: "minimum", [i]: "current" },
              });
            }
            dq.push(i);
            r.enqueue(nums[i], { description: `Push index ${i} (value ${nums[i]}) to deque back.` });
            r.setStructure(
              { array: nums, queue: dq.map((idx) => nums[idx]) },
              { description: `Deque indices [${dq.join(", ")}] → values [${dq.map((idx) => nums[idx]).join(", ")}].` },
            );
            showArray(
              r,
              nums,
              `Added index ${i}. Deque front is index ${dq[0]} (value ${nums[dq[0]!]}).`,
              {
                kinds: {
                  [i]: "current",
                  [dq[0]!]: "found",
                  ...kindsRange(Math.max(0, i - k + 1), i, "searching"),
                },
                vars: { i, dequeIndices: dq, dequeValues: dq.map((idx) => nums[idx]) },
              },
            );
            if (i >= k - 1) {
              const maxVal = nums[dq[0]!];
              out.push(maxVal);
              const winL = i - k + 1;
              showArray(
                r,
                nums,
                `Window [${winL}, ${i}] max = ${maxVal}. Answer so far: [${out.join(", ")}].`,
                {
                  kinds: windowKinds(winL, i),
                  vars: { windowMax: maxVal, result: out },
                },
              );
            }
          }
          showArray(r, nums, `All window maxima: [${out.join(", ")}].`, {
            vars: { result: out },
          });
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 424,
    title: "Longest Repeating Character Replacement",
    difficulty: "medium",
    category: "sliding-window",
    tags: ["string", "sliding-window", "hash-table"],
    inputSchema: "window",
    statement: `# 424. Longest Repeating Character Replacement

Return the length of the longest substring containing the same letter after at most \`k\` replacements.`,
    testcases: [
      { label: "Example 1", input: { s: "ABAB", k: 2 } },
      { label: "Example 2", input: { s: "AABABBA", k: 1 } },
    ],
    solutions: [
      sol<{ s: string; k: number }>({
        id: "424-window",
        name: "Max Frequency Window",
        time: "O(n)",
        space: "O(1)",
        code: `function characterReplacement(s: string, k: number): number {
  const count: Record<string, number> = {};
  let left = 0, best = 0, maxFreq = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    count[c] = (count[c] ?? 0) + 1;
    maxFreq = Math.max(maxFreq, count[c]);
    while (right - left + 1 - maxFreq > k) {
      count[s[left]]--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
        execute({ s, k }) {
          const r = new EventRecorder("424-window");
          const chars = s.split("");
          const count: Record<string, number> = {};
          let left = 0;
          let best = 0;
          let maxFreq = 0;
          showArrayMap(r, chars, count, `At most k=${k} replacements — track char frequencies.`, {
            vars: { k, best },
          });
          for (let right = 0; right < chars.length; right++) {
            const c = chars[right];
            count[c] = (count[c] ?? 0) + 1;
            maxFreq = Math.max(maxFreq, count[c]);
            showWindow(
              r,
              chars,
              left,
              right,
              `Add '${c}'. maxFreq=${maxFreq}, window len=${right - left + 1}, replacements needed=${right - left + 1 - maxFreq}.`,
              { hashmap: { ...count }, vars: { maxFreq, k } },
            );
            while (right - left + 1 - maxFreq > k) {
              const lc = chars[left];
              count[lc] = (count[lc] ?? 0) - 1;
              showWindow(
                r,
                chars,
                left,
                right,
                `Too many replacements — shrink left, remove '${lc}'.`,
                { hashmap: { ...count }, vars: { removed: lc } },
              );
              left++;
              maxFreq = Math.max(...Object.values(count));
            }
            best = Math.max(best, right - left + 1);
            showWindow(
              r,
              chars,
              left,
              right,
              `Valid window "${s.slice(left, right + 1)}" — best length=${best}.`,
              { hashmap: { ...count }, vars: { best } },
            );
          }
          showArray(r, chars, `Longest length after ≤${k} replacements: ${best}.`, { vars: { best } });
          r.returnValue(best);
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 567,
    title: "Permutation in String",
    difficulty: "medium",
    category: "sliding-window",
    tags: ["string", "sliding-window", "hash-table"],
    inputSchema: "window",
    statement: `# 567. Permutation in String

Return true if \`s2\` contains a permutation of \`s1\`.`,
    testcases: [
      { label: "Example 1", input: { s: "ab", t: "eidbaooo" } },
      { label: "Example 2", input: { s: "ab", t: "eidboaoo" } },
    ],
    solutions: [
      sol<StrPair>({
        id: "567-fixed-window",
        name: "Fixed Window Match",
        time: "O(|s1|+|s2|)",
        space: "O(1)",
        code: `function checkInclusion(s1: string, s2: string): boolean {
  if (s1.length > s2.length) return false;
  const need = Array(26).fill(0), have = Array(26).fill(0);
  const idx = (c: string) => c.charCodeAt(0) - 97;
  for (const c of s1) need[idx(c)]++;
  for (let i = 0; i < s2.length; i++) {
    have[idx(s2[i])]++;
    if (i >= s1.length) have[idx(s2[i - s1.length])]--;
    if (i >= s1.length - 1 && need.every((v, j) => v === have[j])) return true;
  }
  return false;
}`,
        execute({ s: s1, t: s2 }) {
          const r = new EventRecorder("567-fixed-window");
          const chars = s2.split("");
          const need: Record<string, number> = {};
          for (const c of s1) need[c] = (need[c] ?? 0) + 1;
          const have: Record<string, number> = {};
          const win = s1.length;
          showArrayMap(
            r,
            chars,
            need,
            `Slide window of length |s1|=${win} over s2. Compare frequency maps.`,
            { vars: { s1, windowSize: win } },
          );
          if (win > chars.length) {
            showArray(r, chars, `s1 longer than s2 — impossible.`, {});
            r.returnValue(false);
            r.done(false);
            return r.getEvents();
          }
          for (let i = 0; i < chars.length; i++) {
            const c = chars[i];
            have[c] = (have[c] ?? 0) + 1;
            const left = Math.max(0, i - win + 1);
            if (i >= win) {
              const out = chars[i - win];
              have[out] = (have[out] ?? 0) - 1;
              if (have[out] === 0) delete have[out];
            }
            const match = Object.keys(need).every((ch) => (have[ch] ?? 0) === need[ch]) &&
              Object.keys(have).every((ch) => (need[ch] ?? 0) === have[ch]);
            showWindow(
              r,
              chars,
              left,
              i,
              `Window "${s2.slice(left, i + 1)}" — ${match ? "permutation match!" : "counts differ."}`,
              {
                hashmap: {
                  ...Object.fromEntries(Object.entries(need).map(([k, v]) => [`need:${k}`, v])),
                  ...Object.fromEntries(Object.entries(have).map(([k, v]) => [`have:${k}`, v])),
                },
                vars: { i, left, match },
              },
            );
            if (i >= win - 1 && match) {
              showArray(r, chars, `Found permutation of "${s1}" at [${left}, ${i}].`, {
                kinds: windowKinds(left, i),
              });
              r.returnValue(true, { description: "Permutation found." });
              r.done(true);
              return r.getEvents();
            }
          }
          showArray(r, chars, `No permutation of "${s1}" in s2.`, {});
          r.returnValue(false);
          r.done(false);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 643,
    title: "Maximum Average Subarray I",
    difficulty: "easy",
    category: "sliding-window",
    tags: ["array", "sliding-window"],
    inputSchema: "array",
    statement: `# 643. Maximum Average Subarray I

Find the maximum average of a contiguous subarray of length \`k\`.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 12, -5, -6, 50, 3], k: 4 } },
      { label: "Example 2", input: { array: [5], k: 1 } },
    ],
    solutions: [
      sol<ArrK>({
        id: "643-fixed-window",
        name: "Fixed Window Average",
        time: "O(n)",
        space: "O(1)",
        code: `function findMaxAverage(nums: number[], k: number): number {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let bestSum = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    bestSum = Math.max(bestSum, sum);
  }
  return bestSum / k;
}`,
        execute({ array, k }) {
          const r = new EventRecorder("643-fixed-window");
          const nums = [...array];
          let sum = 0;
          for (let i = 0; i < k; i++) sum += nums[i];
          let bestSum = sum;
          showArray(
            r,
            nums,
            `Initial window [0, ${k - 1}] sum=${sum}, avg=${(sum / k).toFixed(2)}.`,
            {
              kinds: windowKinds(0, k - 1),
              vars: { sum, k, bestAvg: sum / k },
            },
          );
          for (let i = k; i < nums.length; i++) {
            sum += nums[i] - nums[i - k];
            bestSum = Math.max(bestSum, sum);
            const left = i - k + 1;
            showArray(
              r,
              nums,
              `Slide: +${nums[i]} −${nums[i - k]} → sum=${sum}, avg=${(sum / k).toFixed(2)}. Best avg=${(bestSum / k).toFixed(2)}.`,
              {
                line: 5,
                kinds: windowKinds(left, i),
                vars: { sum, bestSum, bestAvg: bestSum / k },
              },
            );
          }
          const result = bestSum / k;
          showArray(r, nums, `Maximum average = ${result}.`, { vars: { result } });
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 904,
    title: "Fruit Into Baskets",
    difficulty: "medium",
    category: "sliding-window",
    tags: ["array", "sliding-window", "hash-table"],
    inputSchema: "array",
    statement: `# 904. Fruit Into Baskets

Each tree has a fruit type. Pick from any two types only. Return the maximum number of fruits you can collect.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 1] } },
      { label: "Example 2", input: { array: [0, 1, 2, 2] } },
      { label: "Example 3", input: { array: [1, 2, 3, 2, 2] } },
    ],
    solutions: [
      sol<Arr>({
        id: "904-at-most-two",
        name: "At Most 2 Types",
        time: "O(n)",
        space: "O(1)",
        code: `function totalFruit(fruits: number[]): number {
  const count: Record<number, number> = {};
  let left = 0, best = 0;
  for (let right = 0; right < fruits.length; right++) {
    count[fruits[right]] = (count[fruits[right]] ?? 0) + 1;
    while (Object.keys(count).length > 2) {
      count[fruits[left]]--;
      if (count[fruits[left]] === 0) delete count[fruits[left]];
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
        execute({ array }) {
          const r = new EventRecorder("904-at-most-two");
          const fruits = [...array];
          const count: Record<string, number> = {};
          let left = 0;
          let best = 0;
          showArrayMap(r, fruits, count, "Longest subarray with at most 2 distinct fruit types.", {
            vars: { best, types: 0 },
          });
          for (let right = 0; right < fruits.length; right++) {
            const t = fruits[right];
            count[String(t)] = (count[String(t)] ?? 0) + 1;
            showArray(
              r,
              fruits,
              `Add fruit type ${t} at index ${right}. Types in window: ${Object.keys(count).length}.`,
              {
                kinds: windowKinds(left, right),
                vars: { types: Object.keys(count).length, count: { ...count } },
              },
            );
            while (Object.keys(count).length > 2) {
              const lt = fruits[left];
              count[String(lt)] = (count[String(lt)] ?? 0) - 1;
              if (count[String(lt)] === 0) delete count[String(lt)];
              showArray(
                r,
                fruits,
                `More than 2 types — remove index ${left} (type ${lt}).`,
                {
                  kinds: { [left]: "swapped", ...windowKinds(left + 1, right) },
                  vars: { types: Object.keys(count).length },
                },
              );
              left++;
            }
            best = Math.max(best, right - left + 1);
            showArray(
              r,
              fruits,
              `Valid window [${left}, ${right}] length=${right - left + 1}. Best=${best}.`,
              {
                kinds: windowKinds(left, right),
                vars: { best, types: Object.keys(count) },
              },
            );
          }
          showArray(r, fruits, `Maximum fruits collectible = ${best}.`, { vars: { best } });
          r.returnValue(best);
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),
];
