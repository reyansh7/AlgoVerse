import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type DigitsIn = { digits: string };
type ParensIn = { n: number };
type CombSumIn = { candidates: number[]; target: number };
type PermIn = { nums: number[] };
type NQueensIn = { n: number };
type SubsetsIn = { nums: number[] };
type PalPartIn = { s: string };
type CombSum3In = { k: number; n: number };

function showPath(
  r: EventRecorder,
  path: (number | string)[],
  description: string,
  opts: { vars?: Record<string, unknown>; line?: number } = {},
) {
  showArray(r, path.length ? path : ["∅"], description, {
    line: opts.line,
    vars: opts.vars,
    kinds: path.length ? Object.fromEntries(path.map((_, i) => [i, "active"])) : {},
  });
}

export const backtrackingFamily: ProblemPackage[] = [
  createProblem({
    id: 17,
    title: "Letter Combinations of a Phone Number",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "string"],
    inputSchema: "array",
    statement: `# 17. Letter Combinations of a Phone Number

Map digits to phone letters; generate all combinations.`,
    testcases: [
      { label: "Example 1", input: { digits: "23" } },
      { label: "Example 2", input: { digits: "" } },
    ],
    solutions: [
      sol<DigitsIn>({
        id: "17-phone-backtrack",
        name: "Backtracking",
        time: "O(4^n)",
        space: "O(n)",
        code: `function letterCombinations(digits): string[] {
  const map = {2:"abc",3:"def",...};
  function backtrack(i, path) { ... }
}`,
        execute({ digits }) {
          const r = new EventRecorder("17-phone-backtrack");
          const map: Record<string, string> = {
            "2": "abc",
            "3": "def",
            "4": "ghi",
            "5": "jkl",
            "6": "mno",
            "7": "pqrs",
            "8": "tuv",
            "9": "wxyz",
          };
          const result: string[] = [];
          const path: string[] = [];
          if (!digits.length) {
            r.returnValue([]);
            r.done([]);
            return r.getEvents();
          }
          showPath(r, path, `Build combinations for digits "${digits}".`, { vars: { digits } });
          function backtrack(i: number) {
            if (i === digits.length) {
              result.push(path.join(""));
              showPath(r, path, `Complete combination "${path.join("")}".`, {
                vars: { result: result.length },
              });
              return;
            }
            const letters = map[digits[i]] ?? "";
            for (const ch of letters) {
              path.push(ch);
              showPath(r, path, `Digit ${digits[i]} → choose '${ch}'.`, {
                vars: { i, ch },
              });
              backtrack(i + 1);
              path.pop();
              showPath(r, path, `Backtrack after '${ch}'.`, {});
            }
          }
          backtrack(0);
          r.returnValue(result, { description: `${result.length} combination(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 22,
    title: "Generate Parentheses",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "string"],
    inputSchema: "array",
    statement: `# 22. Generate Parentheses

Generate all valid combinations of \`n\` pairs of parentheses.`,
    testcases: [
      { label: "Example 1", input: { n: 3 } },
      { label: "Example 2", input: { n: 1 } },
    ],
    solutions: [
      sol<ParensIn>({
        id: "22-parens-backtrack",
        name: "Backtracking",
        time: "O(4^n / √n)",
        space: "O(n)",
        code: `function generateParenthesis(n): string[] {
  function bt(open, close, path) {
    if (path.length === 2*n) result.push(path);
    if (open < n) bt(open+1, close, path+'(');
    if (close < open) bt(open, close+1, path+')');
  }
}`,
        execute({ n }) {
          const r = new EventRecorder("22-parens-backtrack");
          const result: string[] = [];
          showPath(r, [], `Generate ${n} pairs of valid parentheses.`, { vars: { n } });
          function bt(open: number, close: number, path: string) {
            showPath(r, path.split(""), `open=${open}, close=${close}, path="${path}".`, {
              vars: { open, close },
            });
            if (path.length === 2 * n) {
              result.push(path);
              showPath(r, path.split(""), `Valid: "${path}".`, { vars: { count: result.length } });
              return;
            }
            if (open < n) {
              showPath(r, [...path.split(""), "("], `Add '(' (${open + 1}/${n} open).`, {});
              bt(open + 1, close, path + "(");
            }
            if (close < open) {
              showPath(r, [...path.split(""), ")"], `Add ')' (close < open).`, {});
              bt(open, close + 1, path + ")");
            }
          }
          bt(0, 0, "");
          r.returnValue(result, { description: `${result.length} valid string(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 39,
    title: "Combination Sum",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array-target",
    statement: `# 39. Combination Sum

Find combinations summing to \`target\`; reuse candidates.`,
    testcases: [
      { label: "Example 1", input: { candidates: [2, 3, 6, 7], target: 7 } },
      { label: "Example 2", input: { candidates: [2, 3, 5], target: 8 } },
    ],
    solutions: [
      sol<CombSumIn>({
        id: "39-comb-sum",
        name: "Backtracking",
        time: "O(2^target)",
        space: "O(target)",
        code: `function combinationSum(candidates, target): number[][] {
  function bt(start, remain, path) { ... }
}`,
        execute({ candidates, target }) {
          const r = new EventRecorder("39-comb-sum");
          const result: number[][] = [];
          const path: number[] = [];
          showPath(r, path, `Combine from [${candidates}] to sum ${target}.`, {
            vars: { target, remain: target },
          });
          function bt(start: number, remain: number) {
            if (remain === 0) {
              result.push([...path]);
              showPath(r, path, `Found combo [${path.join(", ")}].`, {
                vars: { combos: result.length },
              });
              return;
            }
            if (remain < 0) {
              showPath(r, path, `Sum exceeded — backtrack.`, { vars: { remain } });
              return;
            }
            for (let i = start; i < candidates.length; i++) {
              path.push(candidates[i]);
              showPath(r, path, `Take ${candidates[i]}; remain=${remain - candidates[i]}.`, {
                vars: { remain: remain - candidates[i], i },
              });
              bt(i, remain - candidates[i]);
              path.pop();
              showPath(r, path, `Undo ${candidates[i]}.`, {});
            }
          }
          bt(0, target);
          r.returnValue(result, { description: `${result.length} combination(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 40,
    title: "Combination Sum II",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array-target",
    statement: `# 40. Combination Sum II

Each candidate used once; avoid duplicate combinations.`,
    testcases: [
      { label: "Example 1", input: { candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 } },
    ],
    solutions: [
      sol<CombSumIn>({
        id: "40-comb-sum-ii",
        name: "Backtracking + Skip Duplicates",
        time: "O(2^n)",
        space: "O(n)",
        code: `function combinationSum2(candidates, target): number[][] {
  sort; skip same value at same depth;
}`,
        execute({ candidates, target }) {
          const r = new EventRecorder("40-comb-sum-ii");
          const nums = [...candidates].sort((a, b) => a - b);
          const result: number[][] = [];
          const path: number[] = [];
          showPath(r, path, `Unique combos from [${nums}] → ${target}.`, {});
          function bt(start: number, remain: number) {
            if (remain === 0) {
              result.push([...path]);
              showPath(r, path, `Unique combo [${path.join(", ")}].`, {});
              return;
            }
            for (let i = start; i < nums.length; i++) {
              if (i > start && nums[i] === nums[i - 1]) {
                showPath(r, path, `Skip duplicate ${nums[i]} at depth.`, {});
                continue;
              }
              if (nums[i] > remain) break;
              path.push(nums[i]);
              showPath(r, path, `Use ${nums[i]} once; remain=${remain - nums[i]}.`, {
                vars: { remain: remain - nums[i] },
              });
              bt(i + 1, remain - nums[i]);
              path.pop();
              showPath(r, path, `Backtrack from ${nums[i]}.`, {});
            }
          }
          bt(0, target);
          r.returnValue(result, { description: `${result.length} unique combination(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 46,
    title: "Permutations",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array",
    statement: `# 46. Permutations

Return all permutations of distinct integers.`,
    testcases: [
      { label: "Example 1", input: { nums: [1, 2, 3] } },
      { label: "Example 2", input: { nums: [0, 1] } },
    ],
    solutions: [
      sol<PermIn>({
        id: "46-permute",
        name: "Backtracking",
        time: "O(n·n!)",
        space: "O(n)",
        code: `function permute(nums): number[][] {
  function bt(path, used) { ... }
}`,
        execute({ nums }) {
          const r = new EventRecorder("46-permute");
          const result: number[][] = [];
          const path: number[] = [];
          const used = new Array(nums.length).fill(false);
          showPath(r, path, `Permute [${nums.join(", ")}].`, { vars: { used: used.map(String) } });
          function bt() {
            if (path.length === nums.length) {
              result.push([...path]);
              showPath(r, path, `Permutation [${path.join(", ")}].`, {
                vars: { count: result.length },
              });
              return;
            }
            for (let i = 0; i < nums.length; i++) {
              if (used[i]) continue;
              used[i] = true;
              path.push(nums[i]);
              showPath(r, path, `Place ${nums[i]} at position ${path.length - 1}.`, {
                vars: { i },
              });
              bt();
              path.pop();
              used[i] = false;
              showPath(r, path, `Remove ${nums[i]} — try next.`, {});
            }
          }
          bt();
          r.returnValue(result, { description: `${result.length} permutation(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 47,
    title: "Permutations II",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array",
    statement: `# 47. Permutations II

Return unique permutations with duplicate values.`,
    testcases: [
      { label: "Example 1", input: { nums: [1, 1, 2] } },
      { label: "Example 2", input: { nums: [1, 2, 3] } },
    ],
    solutions: [
      sol<PermIn>({
        id: "47-permute-ii",
        name: "Backtracking + Sort",
        time: "O(n·n!)",
        space: "O(n)",
        code: `function permuteUnique(nums): number[][] {
  sort; skip duplicate unused at same depth;
}`,
        execute({ nums }) {
          const r = new EventRecorder("47-permute-ii");
          const arr = [...nums].sort((a, b) => a - b);
          const result: number[][] = [];
          const path: number[] = [];
          const used = new Array(arr.length).fill(false);
          showPath(r, path, `Unique permutations of [${arr.join(", ")}].`, {});
          function bt() {
            if (path.length === arr.length) {
              result.push([...path]);
              showPath(r, path, `Unique perm [${path.join(", ")}].`, {});
              return;
            }
            for (let i = 0; i < arr.length; i++) {
              if (used[i]) continue;
              if (i > 0 && arr[i] === arr[i - 1] && !used[i - 1]) {
                showPath(r, path, `Skip duplicate ${arr[i]} at this depth.`, {});
                continue;
              }
              used[i] = true;
              path.push(arr[i]);
              showPath(r, path, `Use ${arr[i]} at index ${i}.`, {});
              bt();
              path.pop();
              used[i] = false;
              showPath(r, path, `Backtrack ${arr[i]}.`, {});
            }
          }
          bt();
          r.returnValue(result, { description: `${result.length} unique permutation(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 51,
    title: "N-Queens",
    difficulty: "hard",
    category: "search",
    tags: ["backtracking", "matrix"],
    inputSchema: "array",
    statement: `# 51. N-Queens

Place \`n\` queens on an \`n×n\` board so none attack each other.`,
    testcases: [
      { label: "Example 1", input: { n: 4 } },
      { label: "Example 2", input: { n: 1 } },
    ],
    solutions: [
      sol<NQueensIn>({
        id: "51-n-queens",
        name: "Backtracking",
        time: "O(n!)",
        space: "O(n²)",
        code: `function solveNQueens(n): string[][] {
  place queen row by row; check cols and diagonals;
}`,
        execute({ n }) {
          const r = new EventRecorder("51-n-queens");
          const cols = new Array(n).fill(false);
          const diag1 = new Array(2 * n).fill(false);
          const diag2 = new Array(2 * n).fill(false);
          const board = Array.from({ length: n }, () => Array(n).fill("."));
          const result: string[][] = [];
          function showBoard(desc: string) {
            const flat = board.flat();
            r.setStructure(
              { table: board.map((row) => [...row]), array: flat },
              { description: desc },
            );
          }
          showBoard(`Place ${n} queens via backtracking.`);
          function bt(row: number) {
            if (row === n) {
              result.push(board.map((row) => row.join("")));
              showBoard(`Solution #${result.length} found.`);
              return;
            }
            for (let col = 0; col < n; col++) {
              const d1 = row - col + n;
              const d2 = row + col;
              if (cols[col] || diag1[d1] || diag2[d2]) {
                showBoard(`(${row},${col}) attacked — skip.`);
                continue;
              }
              cols[col] = diag1[d1] = diag2[d2] = true;
              board[row][col] = "Q";
              showBoard(`Place queen at row ${row}, col ${col}.`);
              bt(row + 1);
              board[row][col] = ".";
              cols[col] = diag1[d1] = diag2[d2] = false;
              showBoard(`Remove queen from (${row},${col}).`);
            }
          }
          bt(0);
          r.returnValue(result, { description: `${result.length} board solution(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 78,
    title: "Subsets",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array",
    statement: `# 78. Subsets

Return all subsets (power set) of distinct integers.`,
    testcases: [
      { label: "Example 1", input: { nums: [1, 2, 3] } },
      { label: "Example 2", input: { nums: [0] } },
    ],
    solutions: [
      sol<SubsetsIn>({
        id: "78-subsets",
        name: "Backtracking",
        time: "O(n·2^n)",
        space: "O(n)",
        code: `function subsets(nums): number[][] {
  function bt(start, path) { result.push(path); ... }
}`,
        execute({ nums }) {
          const r = new EventRecorder("78-subsets");
          const result: number[][] = [];
          const path: number[] = [];
          showPath(r, path, `Generate all subsets of [${nums.join(", ")}].`, {});
          function bt(start: number) {
            result.push([...path]);
            showPath(r, path, `Record subset [${path.length ? path.join(", ") : "∅"}].`, {
              vars: { subsets: result.length },
            });
            for (let i = start; i < nums.length; i++) {
              path.push(nums[i]);
              showPath(r, path, `Include ${nums[i]}.`, {});
              bt(i + 1);
              path.pop();
              showPath(r, path, `Exclude ${nums[i]} — backtrack.`, {});
            }
          }
          bt(0);
          r.returnValue(result, { description: `${result.length} subset(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 90,
    title: "Subsets II",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array",
    statement: `# 90. Subsets II

Return all unique subsets with possible duplicate values.`,
    testcases: [
      { label: "Example 1", input: { nums: [1, 2, 2] } },
      { label: "Example 2", input: { nums: [0] } },
    ],
    solutions: [
      sol<SubsetsIn>({
        id: "90-subsets-ii",
        name: "Backtracking + Sort",
        time: "O(n·2^n)",
        space: "O(n)",
        code: `function subsetsWithDup(nums): number[][] {
  sort; skip duplicate choices at same depth;
}`,
        execute({ nums }) {
          const r = new EventRecorder("90-subsets-ii");
          const arr = [...nums].sort((a, b) => a - b);
          const result: number[][] = [];
          const path: number[] = [];
          showPath(r, path, `Unique subsets of [${arr.join(", ")}].`, {});
          function bt(start: number) {
            result.push([...path]);
            showPath(r, path, `Add subset [${path.join(", ") || "∅"}].`, {
              vars: { count: result.length },
            });
            for (let i = start; i < arr.length; i++) {
              if (i > start && arr[i] === arr[i - 1]) {
                showPath(r, path, `Skip duplicate ${arr[i]}.`, {});
                continue;
              }
              path.push(arr[i]);
              showPath(r, path, `Take ${arr[i]}.`, {});
              bt(i + 1);
              path.pop();
              showPath(r, path, `Backtrack ${arr[i]}.`, {});
            }
          }
          bt(0);
          r.returnValue(result, { description: `${result.length} unique subset(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 131,
    title: "Palindrome Partitioning",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "string"],
    inputSchema: "array",
    statement: `# 131. Palindrome Partitioning

Partition \`s\` so every substring is a palindrome.`,
    testcases: [
      { label: "Example 1", input: { s: "aab" } },
      { label: "Example 2", input: { s: "a" } },
    ],
    solutions: [
      sol<PalPartIn>({
        id: "131-pal-partition",
        name: "Backtracking",
        time: "O(n·2^n)",
        space: "O(n)",
        code: `function partition(s): string[][] {
  try cuts; if prefix palindrome, recurse on suffix;
}`,
        execute({ s }) {
          const r = new EventRecorder("131-pal-partition");
          const result: string[][] = [];
          const path: string[] = [];
          const isPal = (lo: number, hi: number) => {
            while (lo < hi) {
              if (s[lo++] !== s[hi--]) return false;
            }
            return true;
          };
          showPath(r, path, `Partition "${s}" into palindromes.`, { vars: { s } });
          function bt(start: number) {
            if (start === s.length) {
              result.push([...path]);
              showPath(r, path, `Valid partition [${path.join(" | ")}].`, {});
              return;
            }
            for (let end = start; end < s.length; end++) {
              const sub = s.slice(start, end + 1);
              if (!isPal(start, end)) {
                showPath(r, path, `"${sub}" not palindrome — skip.`, {});
                continue;
              }
              path.push(sub);
              showPath(r, path, `Take palindrome "${sub}".`, { vars: { start, end } });
              bt(end + 1);
              path.pop();
              showPath(r, path, `Backtrack "${sub}".`, {});
            }
          }
          bt(0);
          r.returnValue(result, { description: `${result.length} partition(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 216,
    title: "Combination Sum III",
    difficulty: "medium",
    category: "search",
    tags: ["backtracking", "array"],
    inputSchema: "array-target",
    statement: `# 216. Combination Sum III

Find \`k\` numbers from 1–9 that sum to \`n\` (each used once).`,
    testcases: [
      { label: "Example 1", input: { k: 3, n: 7 } },
      { label: "Example 2", input: { k: 3, n: 9 } },
      { label: "Example 3", input: { k: 4, n: 1 } },
    ],
    solutions: [
      sol<CombSum3In>({
        id: "216-comb-sum-iii",
        name: "Backtracking",
        time: "O(C(9,k))",
        space: "O(k)",
        code: `function combinationSum3(k, n): number[][] {
  pick k distinct digits 1-9 summing to n;
}`,
        execute({ k, n }) {
          const r = new EventRecorder("216-comb-sum-iii");
          const result: number[][] = [];
          const path: number[] = [];
          showPath(r, path, `Pick ${k} distinct digits (1–9) summing to ${n}.`, {
            vars: { k, n },
          });
          function bt(start: number, remain: number, left: number) {
            if (left === 0 && remain === 0) {
              result.push([...path]);
              showPath(r, path, `Found [${path.join(", ")}].`, {});
              return;
            }
            if (left === 0 || remain <= 0) {
              showPath(r, path, `Invalid: left=${left}, remain=${remain}.`, {});
              return;
            }
            for (let d = start; d <= 9; d++) {
              if (d > remain) break;
              path.push(d);
              showPath(r, path, `Choose ${d}; need ${left - 1} more, remain ${remain - d}.`, {
                vars: { d, left: left - 1, remain: remain - d },
              });
              bt(d + 1, remain - d, left - 1);
              path.pop();
              showPath(r, path, `Backtrack ${d}.`, {});
            }
          }
          bt(1, n, k);
          r.returnValue(result, { description: `${result.length} combination(s).` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),
];
