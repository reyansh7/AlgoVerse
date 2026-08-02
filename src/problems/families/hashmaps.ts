import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, showArrayMap } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type StrArr = { strs: string[] };
type StrPair = { s: string; t: string };
type ArrK = { array: number[]; k: number };
type WordPattern = { pattern: string; s: string };
type TwoArr = { nums1: number[]; nums2: number[] };
type Ops380 = { ops: Array<{ op: string; val?: number }> };

export const hashMapFamily: ProblemPackage[] = [
  createProblem({
    id: 49,
    title: "Group Anagrams",
    difficulty: "medium",
    category: "search",
    tags: ["hashmap", "string", "sorting"],
    inputSchema: "array",
    statement: `# 49. Group Anagrams

Group strings that are anagrams of each other.`,
    testcases: [
      {
        label: "Example 1",
        input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] },
      },
    ],
    solutions: [
      sol<StrArr>({
        id: "49-sorted-key",
        name: "Sorted Key Map",
        time: "O(n·k log k)",
        space: "O(n·k)",
        code: `function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const s of strs) {
    const key = [...s].sort().join("");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return [...map.values()];
}`,
        execute({ strs }) {
          const r = new EventRecorder("49-sorted-key");
          const map: Record<string, string> = {};
          const groups: Record<string, string[]> = {};
          showArrayMap(
            r,
            strs,
            map,
            "Use sorted letters as hash key to group anagrams.",
            {},
          );
          for (let i = 0; i < strs.length; i++) {
            const s = strs[i];
            const key = [...s].sort().join("");
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
            map[key] = groups[key].join(", ");
            showArrayMap(
              r,
              strs,
              map,
              `"${s}" → key "${key}" → group [${groups[key].join(", ")}].`,
              {
                line: 3,
                kinds: { [i]: "current" },
                vars: { key, groupSize: groups[key].length },
              },
            );
          }
          const result = Object.values(groups);
          r.returnValue(result, {
            description: `${result.length} anagram groups formed.`,
          });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 128,
    title: "Longest Consecutive Sequence",
    difficulty: "medium",
    category: "search",
    tags: ["hashmap", "array"],
    inputSchema: "array",
    statement: `# 128. Longest Consecutive Sequence

Find the length of the longest consecutive elements sequence in O(n).`,
    testcases: [
      { label: "Example 1", input: { array: [100, 4, 200, 1, 3, 2] } },
      { label: "Example 2", input: { array: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] } },
    ],
    solutions: [
      sol<{ array: number[] }>({
        id: "128-set-streak",
        name: "Hash Set Streaks",
        time: "O(n)",
        space: "O(n)",
        code: `function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (!set.has(x - 1)) {
      let len = 1, cur = x;
      while (set.has(cur + 1)) { cur++; len++; }
      best = Math.max(best, len);
    }
  }
  return best;
}`,
        execute({ array }) {
          const r = new EventRecorder("128-set-streak");
          const nums = [...array];
          const setMap: Record<string, number> = {};
          for (const x of nums) setMap[String(x)] = 1;
          let best = 0;
          showArrayMap(
            r,
            nums,
            setMap,
            "Build set of all numbers. Only start streaks at sequence beginnings.",
            { vars: { best } },
          );
          const seen = new Set(nums);
          for (const x of seen) {
            if (!seen.has(x - 1)) {
              let len = 1;
              let cur = x;
              showArrayMap(
                r,
                nums,
                setMap,
                `${x} is streak start — extend forward.`,
                {
                  line: 4,
                  vars: { start: x, len, cur },
                },
              );
              while (seen.has(cur + 1)) {
                cur++;
                len++;
                showArrayMap(
                  r,
                  nums,
                  setMap,
                  `Extend streak: ${cur} found → length ${len}.`,
                  { line: 6, vars: { cur, len } },
                );
              }
              best = Math.max(best, len);
              showArrayMap(
                r,
                nums,
                setMap,
                `Streak from ${x} has length ${len}. best=${best}.`,
                { vars: { best } },
              );
            }
          }
          r.returnValue(best, { description: `Longest consecutive length = ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 205,
    title: "Isomorphic Strings",
    difficulty: "easy",
    category: "search",
    tags: ["hashmap", "string"],
    inputSchema: "array",
    statement: `# 205. Isomorphic Strings

Two strings are isomorphic if characters in \`s\` can be replaced to get \`t\` with a consistent bijection.`,
    testcases: [
      { label: "Example 1", input: { s: "egg", t: "add" } },
      { label: "Example 2", input: { s: "foo", t: "bar" } },
      { label: "Example 3", input: { s: "paper", t: "title" } },
    ],
    solutions: [
      sol<StrPair>({
        id: "205-two-maps",
        name: "Two Hash Maps",
        time: "O(n)",
        space: "O(1)",
        code: `function isIsomorphic(s: string, t: string): boolean {
  const s2t: Record<string, string> = {};
  const t2s: Record<string, string> = {};
  for (let i = 0; i < s.length; i++) {
    if (s2t[s[i]] !== t2s[t[i]] && (s2t[s[i]] || t2s[t[i]])) return false;
    s2t[s[i]] = t[i]; t2s[t[i]] = s[i];
  }
  return true;
}`,
        execute({ s, t }) {
          const r = new EventRecorder("205-two-maps");
          const sArr = s.split("");
          const tArr = t.split("");
          const s2t: Record<string, string> = {};
          const t2s: Record<string, string> = {};
          const combined = [...sArr, "|", ...tArr];
          showArrayMap(
            r,
            combined,
            s2t,
            "Maintain s→t and t→s mappings for bijection.",
            { vars: { t2s } },
          );
          for (let i = 0; i < s.length; i++) {
            const sc = s[i];
            const tc = t[i];
            const conflict =
              (sc in s2t && s2t[sc] !== tc) || (tc in t2s && t2s[tc] !== sc);
            showArrayMap(
              r,
              combined,
              s2t,
              `Pair s[${i}]='${sc}' ↔ t[${i}]='${tc}'. ${conflict ? "Conflict!" : "Consistent."}`,
              {
                line: 3,
                kinds: { [i]: "comparing", [i + s.length + 1]: "comparing" },
                vars: { i, sc, tc },
              },
            );
            if (conflict) {
              r.returnValue(false, { description: "Mapping conflict — not isomorphic." });
              r.done(false);
              return r.getEvents();
            }
            s2t[sc] = tc;
            t2s[tc] = sc;
            showArrayMap(
              r,
              combined,
              s2t,
              `Record s2t['${sc}']='${tc}', t2s['${tc}']='${sc}'.`,
              { vars: { t2s: { ...t2s } } },
            );
          }
          r.returnValue(true, { description: "All pairs consistent — isomorphic." });
          r.done(true);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 219,
    title: "Contains Duplicate II",
    difficulty: "easy",
    category: "search",
    tags: ["hashmap", "array", "sliding-window"],
    inputSchema: "array-target",
    statement: `# 219. Contains Duplicate II

Return true if there exist indices \`i\` and \`j\` with \`nums[i]==nums[j]\` and \`|i-j| <= k\`.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 1], k: 3 } },
      { label: "Example 2", input: { array: [1, 0, 1, 1], k: 1 } },
      { label: "Example 3", input: { array: [1, 2, 3, 1, 2, 3], k: 2 } },
    ],
    solutions: [
      sol<ArrK>({
        id: "219-last-index",
        name: "Last Index Map",
        time: "O(n)",
        space: "O(n)",
        code: `function containsNearbyDuplicate(nums: number[], k: number): boolean {
  const last = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    if (last.has(nums[i]) && i - last.get(nums[i])! <= k) return true;
    last.set(nums[i], i);
  }
  return false;
}`,
        execute({ array, k }) {
          const r = new EventRecorder("219-last-index");
          const nums = [...array];
          const last: Record<string, number> = {};
          showArrayMap(
            r,
            nums,
            last,
            `Track last seen index per value. Window distance ≤ k=${k}.`,
            { vars: { k } },
          );
          for (let i = 0; i < nums.length; i++) {
            const v = nums[i];
            const key = String(v);
            const prev = last[key];
            const hit = prev !== undefined && i - prev <= k;
            showArrayMap(
              r,
              nums,
              last,
              `i=${i}, value=${v}. ${prev !== undefined ? `Last at ${prev}, distance=${i - prev}.` : "First occurrence."}`,
              {
                line: 3,
                kinds: { [i]: hit ? "found" : "current" },
                vars: { i, v, prev, distance: prev !== undefined ? i - prev : null },
              },
            );
            if (hit) {
              r.returnValue(true, {
                description: `Duplicate ${v} within distance ${i - prev} ≤ ${k}.`,
              });
              r.done(true);
              return r.getEvents();
            }
            last[key] = i;
            showArrayMap(
              r,
              nums,
              last,
              `Update last[${v}] = ${i}.`,
              { line: 4 },
            );
          }
          r.returnValue(false, { description: "No duplicate within k distance." });
          r.done(false);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 242,
    title: "Valid Anagram",
    difficulty: "easy",
    category: "search",
    tags: ["hashmap", "string"],
    inputSchema: "array",
    statement: `# 242. Valid Anagram

Return true if \`t\` is an anagram of \`s\`.`,
    testcases: [
      { label: "Example 1", input: { s: "anagram", t: "nagaram" } },
      { label: "Example 2", input: { s: "rat", t: "car" } },
    ],
    solutions: [
      sol<StrPair>({
        id: "242-freq-map",
        name: "Character Frequency Map",
        time: "O(n)",
        space: "O(1)",
        code: `function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] ?? 0) + 1;
  for (const c of t) {
    if (!freq[c]) return false;
    freq[c]--;
  }
  return true;
}`,
        execute({ s, t }) {
          const r = new EventRecorder("242-freq-map");
          const freq: Record<string, number> = {};
          showArrayMap(
            r,
            s.split(""),
            freq,
            "Count character frequencies in s, then cancel with t.",
            { vars: { t: t.split("") } },
          );
          for (const c of s) {
            freq[c] = (freq[c] ?? 0) + 1;
            showArrayMap(
              r,
              s.split(""),
              freq,
              `Increment freq['${c}'] → ${freq[c]}.`,
              { line: 3 },
            );
          }
          for (const c of t) {
            showArrayMap(
              r,
              t.split(""),
              freq,
              `Decrement with t char '${c}' (freq=${freq[c] ?? 0}).`,
              { line: 5, kinds: {} },
            );
            if (!freq[c]) {
              r.returnValue(false, { description: `'${c}' mismatch — not an anagram.` });
              r.done(false);
              return r.getEvents();
            }
            freq[c]--;
            showArrayMap(r, t.split(""), freq, `freq['${c}'] → ${freq[c]}.`, {
              line: 6,
            });
          }
          r.returnValue(true, { description: "All frequencies balanced — valid anagram." });
          r.done(true);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 290,
    title: "Word Pattern",
    difficulty: "easy",
    category: "search",
    tags: ["hashmap", "string"],
    inputSchema: "array",
    statement: `# 290. Word Pattern

Given \`pattern\` and string \`s\`, check if each pattern letter maps bijectively to a word.`,
    testcases: [
      { label: "Example 1", input: { pattern: "abba", s: "dog cat cat dog" } },
      { label: "Example 2", input: { pattern: "abba", s: "dog cat cat fish" } },
    ],
    solutions: [
      sol<WordPattern>({
        id: "290-word-map",
        name: "Char ↔ Word Map",
        time: "O(n)",
        space: "O(n)",
        code: `function wordPattern(pattern: string, s: string): boolean {
  const words = s.split(" ");
  const p2w: Record<string, string> = {};
  const w2p: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i], w = words[i];
    if (p2w[p] !== w2p[w] && (p2w[p] || w2p[w])) return false;
    p2w[p] = w; w2p[w] = p;
  }
  return true;
}`,
        execute({ pattern, s }) {
          const r = new EventRecorder("290-word-map");
          const words = s.split(" ");
          const p2w: Record<string, string> = {};
          const w2p: Record<string, string> = {};
          showArrayMap(
            r,
            words,
            p2w,
            "Map each pattern char to a word (bijection).",
            { vars: { pattern, w2p } },
          );
          for (let i = 0; i < pattern.length; i++) {
            const p = pattern[i];
            const w = words[i];
            const conflict =
              (p in p2w && p2w[p] !== w) || (w in w2p && w2p[w] !== p);
            showArrayMap(
              r,
              words,
              p2w,
              `pattern[${i}]='${p}' ↔ word '${w}'. ${conflict ? "Conflict!" : "OK."}`,
              {
                line: 4,
                kinds: { [i]: conflict ? "swapped" : "current" },
                vars: { i, p, w },
              },
            );
            if (conflict) {
              r.returnValue(false);
              r.done(false);
              return r.getEvents();
            }
            p2w[p] = w;
            w2p[w] = p;
            showArrayMap(
              r,
              words,
              p2w,
              `Set p2w['${p}']='${w}', w2p['${w}']='${p}'.`,
              { vars: { w2p: { ...w2p } } },
            );
          }
          r.returnValue(true, { description: "Pattern matches words." });
          r.done(true);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 349,
    title: "Intersection of Two Arrays",
    difficulty: "easy",
    category: "search",
    tags: ["hashmap", "array"],
    inputSchema: "array",
    statement: `# 349. Intersection of Two Arrays

Return unique elements appearing in both \`nums1\` and \`nums2\`.`,
    testcases: [
      { label: "Example 1", input: { nums1: [1, 2, 2, 1], nums2: [2, 2] } },
      { label: "Example 2", input: { nums1: [4, 9, 5], nums2: [9, 4, 9, 8, 4] } },
    ],
    solutions: [
      sol<TwoArr>({
        id: "349-set-intersect",
        name: "Set Intersection",
        time: "O(n+m)",
        space: "O(n)",
        code: `function intersection(nums1: number[], nums2: number[]): number[] {
  const set = new Set(nums1);
  const out = new Set<number>();
  for (const x of nums2) if (set.has(x)) out.add(x);
  return [...out];
}`,
        execute({ nums1, nums2 }) {
          const r = new EventRecorder("349-set-intersect");
          const setMap: Record<string, number> = {};
          for (const x of nums1) setMap[String(x)] = 1;
          showArrayMap(
            r,
            nums1,
            setMap,
            "Insert all nums1 values into set.",
            { vars: { nums2 } },
          );
          const out: number[] = [];
          for (let i = 0; i < nums2.length; i++) {
            const x = nums2[i];
            const inSet = String(x) in setMap;
            showArrayMap(
              r,
              nums2,
              setMap,
              `Check nums2[${i}]=${x}: ${inSet ? "in set — add to result." : "not in set."}`,
              {
                line: 3,
                kinds: { [i]: inSet ? "found" : "current" },
                vars: { i, x },
              },
            );
            if (inSet && !out.includes(x)) {
              out.push(x);
              showArrayMap(
                r,
                nums2,
                setMap,
                `Intersection so far: [${out.join(", ")}].`,
                { vars: { out } },
              );
            }
          }
          r.returnValue(out);
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 380,
    title: "Insert Delete GetRandom O(1)",
    difficulty: "medium",
    category: "search",
    tags: ["hashmap", "array", "design"],
    inputSchema: "stack-ops",
    statement: `# 380. Insert Delete GetRandom O(1)

Design a structure supporting insert, remove, and getRandom in average O(1). Animate a sequence of operations.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "insert", val: 1 },
            { op: "insert", val: 2 },
            { op: "insert", val: 3 },
            { op: "getRandom" },
            { op: "remove", val: 2 },
            { op: "insert", val: 4 },
            { op: "getRandom" },
          ],
        },
      },
    ],
    solutions: [
      sol<Ops380>({
        id: "380-array-map",
        name: "Array + Index Map",
        time: "O(1) avg per op",
        space: "O(n)",
        code: `class RandomizedSet {
  arr: number[] = [];
  idx = new Map<number, number>();
  insert(x) { /* push + map */ }
  remove(x) { /* swap with last + pop */ }
  getRandom() { return this.arr[Math.floor(Math.random()*this.arr.length)]; }
}`,
        execute({ ops }) {
          const r = new EventRecorder("380-array-map");
          const arr: number[] = [];
          const idx: Record<string, number> = {};
          const show = (desc: string) => {
            showArrayMap(r, arr, idx, desc, { vars: { arr: [...arr] } });
          };
          show("Start with empty array and index map.");
          const results: unknown[] = [];
          for (const op of ops) {
            if (op.op === "insert" && op.val !== undefined) {
              const x = op.val;
              if (String(x) in idx) {
                show(`insert(${x}): already present — return false.`);
                results.push(false);
                continue;
              }
              idx[String(x)] = arr.length;
              arr.push(x);
              show(`insert(${x}): push to end at index ${arr.length - 1}, map val→index.`);
              results.push(true);
            } else if (op.op === "remove" && op.val !== undefined) {
              const x = op.val;
              if (!(String(x) in idx)) {
                show(`remove(${x}): not found — return false.`);
                results.push(false);
                continue;
              }
              const i = idx[String(x)];
              const last = arr[arr.length - 1];
              arr[i] = last;
              idx[String(last)] = i;
              arr.pop();
              delete idx[String(x)];
              show(`remove(${x}): swap with last ${last}, pop, update map.`);
              results.push(true);
            } else if (op.op === "getRandom") {
              const pick = arr[Math.floor(Math.random() * arr.length)];
              show(`getRandom(): pick index ${idx[String(pick)]} → value ${pick}.`);
              results.push(pick);
            }
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),
];
