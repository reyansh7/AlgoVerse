import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type StrIn = { s: string };
type Grid = { m: number; n: number };
type ObstacleGrid = { obstacleGrid: number[][] };
type Stairs = { n: number };
type EditIn = { word1: string; word2: string };
type WordBreak = { s: string; wordDict: string[] };
type Arr = { array: number[] };
type CoinIn = { coins: number[]; amount: number };
type CoinIn2 = { amount: number; coins: number[] };
type LcsIn = { text1: string; text2: string };
type TriangleIn = { triangle: number[][] };

function showDpTable(
  r: EventRecorder,
  dp: (number | boolean | string)[][],
  description: string,
  opts: { vars?: Record<string, unknown>; line?: number } = {},
) {
  r.setStructure(
    { table: dp.map((row) => row.map((c) => (typeof c === "boolean" ? (c ? 1 : 0) : c))) },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

function writeDp2D(
  r: EventRecorder,
  dp: (number | boolean)[][],
  i: number,
  j: number,
  val: number | boolean,
  description: string,
) {
  dp[i][j] = val;
  showDpTable(r, dp, description, { vars: { i, j, value: val } });
}

function writeDp1D(
  r: EventRecorder,
  dp: number[],
  i: number,
  val: number,
  description: string,
) {
  dp[i] = val;
  showArray(r, dp.map(String), description, {
    kinds: { [i]: "write" },
    vars: { i, value: val },
  });
}

export const dpFamily: ProblemPackage[] = [
  createProblem({
    id: 5,
    title: "Longest Palindromic Substring",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "string"],
    inputSchema: "array",
    statement: `# 5. Longest Palindromic Substring

Return the longest palindromic substring of s.`,
    testcases: [
      { label: "Example 1", input: { s: "babad" } },
      { label: "Example 2", input: { s: "cbbd" } },
    ],
    solutions: [
      sol<StrIn>({
        id: "5-lps-dp",
        name: "2D Palindrome DP",
        time: "O(n²)",
        space: "O(n²)",
        code: `function longestPalindrome(s: string): string {
  const n = s.length;
  const dp = Array.from({ length: n }, () => Array(n).fill(false));
  let start = 0, len = 1;
  for (let l = 2; l <= n; l++) {
    for (let i = 0; i + l <= n; i++) {
      const j = i + l - 1;
      dp[i][j] = s[i] === s[j] && (l <= 2 || dp[i + 1][j - 1]);
      if (dp[i][j] && l > len) { start = i; len = l; }
    }
  }
  return s.slice(start, start + len);
}`,
        execute({ s }) {
          const r = new EventRecorder("5-lps-dp");
          const n = s.length;
          const dp: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
          for (let i = 0; i < n; i++) {
            writeDp2D(r, dp, i, i, true, `Base: single char dp[${i}][${i}] = true.`);
          }
          let start = 0;
          let len = 1;
          for (let L = 2; L <= n; L++) {
            for (let i = 0; i + L <= n; i++) {
              const j = i + L - 1;
              const val = s[i] === s[j] && (L <= 2 || dp[i + 1][j - 1]);
              writeDp2D(
                r,
                dp,
                i,
                j,
                val,
                `Substring s[${i}..${j}]="${s.slice(i, j + 1)}": ends match=${s[i] === s[j]}, inner=${L <= 2 || dp[i + 1][j - 1]} → ${val}.`,
              );
              if (val && L > len) {
                start = i;
                len = L;
                r.describe(`New best length ${len}: "${s.slice(start, start + len)}".`);
              }
            }
          }
          const result = s.slice(start, start + len);
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 62,
    title: "Unique Paths",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "grid"],
    inputSchema: "array",
    statement: `# 62. Unique Paths

Robot from top-left to bottom-right — count unique paths (only down/right).`,
    testcases: [
      { label: "Example 1", input: { m: 3, n: 7 } },
      { label: "Example 2", input: { m: 3, n: 2 } },
    ],
    solutions: [
      sol<Grid>({
        id: "62-grid-dp",
        name: "Grid DP",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function uniquePaths(m, n) {
  const dp = Array.from({ length: m }, () => Array(n).fill(1));
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      dp[i][j] = dp[i-1][j] + dp[i][j-1];
  return dp[m-1][n-1];
}`,
        execute({ m, n }) {
          const r = new EventRecorder("62-grid-dp");
          const dp: number[][] = Array.from({ length: m }, () => Array(n).fill(1));
          showDpTable(r, dp, `Initialize ${m}×${n} grid — first row/col = 1.`, {});
          for (let i = 1; i < m; i++) {
            for (let j = 1; j < n; j++) {
              const val = dp[i - 1][j] + dp[i][j - 1];
              writeDp2D(
                r,
                dp,
                i,
                j,
                val,
                `dp[${i}][${j}] = dp[${i - 1}][${j}](${dp[i - 1][j]}) + dp[${i}][${j - 1}](${dp[i][j - 1]}) = ${val}.`,
              );
            }
          }
          const result = dp[m - 1][n - 1];
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 63,
    title: "Unique Paths II",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "grid"],
    inputSchema: "array",
    statement: `# 63. Unique Paths II

Grid with obstacles — count paths avoiding obstacle cells.`,
    testcases: [
      {
        label: "Example 1",
        input: { obstacleGrid: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
      },
      {
        label: "Example 2",
        input: { obstacleGrid: [[0, 1], [0, 0]] },
      },
    ],
    solutions: [
      sol<ObstacleGrid>({
        id: "63-obstacle-dp",
        name: "Obstacle Grid DP",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function uniquePathsWithObstacles(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = Array.from({ length: m }, () => Array(n).fill(0));
  // fill with obstacle checks
}`,
        execute({ obstacleGrid }) {
          const r = new EventRecorder("63-obstacle-dp");
          const m = obstacleGrid.length;
          const n = obstacleGrid[0].length;
          const dp: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
          if (obstacleGrid[0][0] === 0) {
            writeDp2D(r, dp, 0, 0, 1, "Start cell free → dp[0][0] = 1.");
          } else {
            showDpTable(r, dp, "Start blocked → 0 paths.");
            r.done(0);
            return r.getEvents();
          }
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              if (i === 0 && j === 0) continue;
              if (obstacleGrid[i][j] === 1) {
                writeDp2D(r, dp, i, j, 0, `Obstacle at (${i},${j}) → dp=0.`);
                continue;
              }
              const fromTop = i > 0 ? dp[i - 1][j] : 0;
              const fromLeft = j > 0 ? dp[i][j - 1] : 0;
              writeDp2D(
                r,
                dp,
                i,
                j,
                fromTop + fromLeft,
                `dp[${i}][${j}] = ${fromTop} + ${fromLeft} = ${fromTop + fromLeft}.`,
              );
            }
          }
          const result = dp[m - 1][n - 1];
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 70,
    title: "Climbing Stairs",
    difficulty: "easy",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 70. Climbing Stairs

Count distinct ways to climb n stairs (1 or 2 steps at a time).`,
    testcases: [
      { label: "Example 1", input: { n: 2 } },
      { label: "Example 2", input: { n: 3 } },
    ],
    solutions: [
      sol<Stairs>({
        id: "70-stairs-dp",
        name: "1D Fibonacci DP",
        time: "O(n)",
        space: "O(n)",
        code: `function climbStairs(n: number): number {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1; dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}`,
        execute({ n }) {
          const r = new EventRecorder("70-stairs-dp");
          const dp = Array(n + 1).fill(0);
          writeDp1D(r, dp, 0, 1, "Base: dp[0] = 1 (empty).");
          if (n >= 1) writeDp1D(r, dp, 1, 1, "Base: dp[1] = 1 way.");
          for (let i = 2; i <= n; i++) {
            const val = dp[i - 1] + dp[i - 2];
            writeDp1D(
              r,
              dp,
              i,
              val,
              `dp[${i}] = dp[${i - 1}](${dp[i - 1]}) + dp[${i - 2}](${dp[i - 2]}) = ${val} ways.`,
            );
          }
          r.returnValue(dp[n]);
          r.done(dp[n]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 72,
    title: "Edit Distance",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "string"],
    inputSchema: "array",
    statement: `# 72. Edit Distance

Minimum operations (insert, delete, replace) to convert word1 to word2.`,
    testcases: [
      { label: "Example 1", input: { word1: "horse", word2: "ros" } },
      { label: "Example 2", input: { word1: "intention", word2: "execution" } },
    ],
    solutions: [
      sol<EditIn>({
        id: "72-edit-dp",
        name: "Levenshtein DP",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function minDistance(word1, word2) {
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
  // fill base rows/cols, then min of insert/delete/replace
}`,
        execute({ word1, word2 }) {
          const r = new EventRecorder("72-edit-dp");
          const m = word1.length;
          const n = word2.length;
          const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
          for (let i = 0; i <= m; i++) writeDp2D(r, dp, i, 0, i, `Base dp[${i}][0] = ${i} deletes.`);
          for (let j = 0; j <= n; j++) writeDp2D(r, dp, 0, j, j, `Base dp[0][${j}] = ${j} inserts.`);
          for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
              const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
              const val = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
              );
              writeDp2D(
                r,
                dp,
                i,
                j,
                val,
                `dp[${i}][${j}] for '${word1[i - 1]}' vs '${word2[j - 1]}': min(delete,insert,replace)=${val}.`,
              );
            }
          }
          r.returnValue(dp[m][n]);
          r.done(dp[m][n]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 91,
    title: "Decode Ways",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "string"],
    inputSchema: "array",
    statement: `# 91. Decode Ways

Count ways to decode a digit string (1-26 mapping).`,
    testcases: [
      { label: "Example 1", input: { s: "12" } },
      { label: "Example 2", input: { s: "226" } },
      { label: "Example 3", input: { s: "06" } },
    ],
    solutions: [
      sol<StrIn>({
        id: "91-decode-dp",
        name: "1D Decode DP",
        time: "O(n)",
        space: "O(n)",
        code: `function numDecodings(s: string): number {
  const dp = Array(s.length + 1).fill(0);
  dp[0] = 1; dp[1] = s[0] !== '0' ? 1 : 0;
  for (let i = 2; i <= s.length; i++) {
    if (s[i-1] !== '0') dp[i] += dp[i-1];
    const two = +s.slice(i-2, i);
    if (two >= 10 && two <= 26) dp[i] += dp[i-2];
  }
  return dp[s.length];
}`,
        execute({ s }) {
          const r = new EventRecorder("91-decode-dp");
          const dp = Array(s.length + 1).fill(0);
          writeDp1D(r, dp, 0, 1, "Empty prefix → 1 way.");
          writeDp1D(r, dp, 1, s[0] !== "0" ? 1 : 0, `First char '${s[0]}' → ${dp[1]} ways.`);
          for (let i = 2; i <= s.length; i++) {
            let val = 0;
            if (s[i - 1] !== "0") val += dp[i - 1];
            const two = +s.slice(i - 2, i);
            if (two >= 10 && two <= 26) val += dp[i - 2];
            writeDp1D(
              r,
              dp,
              i,
              val,
              `Prefix s[0..${i - 1}]: single '${s[i - 1]}' + pair '${s.slice(i - 2, i)}' → dp[${i}]=${val}.`,
            );
          }
          r.returnValue(dp[s.length]);
          r.done(dp[s.length]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 120,
    title: "Triangle",
    difficulty: "medium",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 120. Triangle

Find minimum path sum from top to bottom of a triangle.`,
    testcases: [
      { label: "Example 1", input: { triangle: [[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]] } },
    ],
    solutions: [
      sol<TriangleIn>({
        id: "120-triangle-dp",
        name: "Bottom-Up 1D DP",
        time: "O(n²)",
        space: "O(n)",
        code: `function minimumTotal(triangle) {
  const dp = [...triangle.at(-1)!];
  for (let r = triangle.length - 2; r >= 0; r--)
    for (let c = 0; c <= r; c++)
      dp[c] = triangle[r][c] + Math.min(dp[c], dp[c+1]);
  return dp[0];
}`,
        execute({ triangle }) {
          const r = new EventRecorder("120-triangle-dp");
          const dp = [...triangle[triangle.length - 1]];
          showArray(r, dp.map(String), "Start from bottom row as base DP.", {});
          for (let row = triangle.length - 2; row >= 0; row--) {
            for (let c = 0; c <= row; c++) {
              const val = triangle[row][c] + Math.min(dp[c], dp[c + 1]);
              writeDp1D(
                r,
                dp,
                c,
                val,
                `Row ${row} col ${c}: ${triangle[row][c]} + min(${dp[c]}, ${dp[c + 1]}) = ${val}.`,
              );
            }
          }
          r.returnValue(dp[0]);
          r.done(dp[0]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 139,
    title: "Word Break",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "string"],
    inputSchema: "array",
    statement: `# 139. Word Break

Return true if s can be segmented into dictionary words.`,
    testcases: [
      { label: "Example 1", input: { s: "leetcode", wordDict: ["leet", "code"] } },
      { label: "Example 2", input: { s: "applepenapple", wordDict: ["apple", "pen"] } },
    ],
    solutions: [
      sol<WordBreak>({
        id: "139-wordbreak-dp",
        name: "1D Reachability DP",
        time: "O(n²·L)",
        space: "O(n)",
        code: `function wordBreak(s, wordDict) {
  const dp = Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (const w of wordDict)
      if (dp[i-w.length] && s.slice(i-w.length, i) === w) dp[i] = true;
  return dp[s.length];
}`,
        execute({ s, wordDict }) {
          const r = new EventRecorder("139-wordbreak-dp");
          const dp: number[] = Array(s.length + 1).fill(0);
          writeDp1D(r, dp, 0, 1, "Empty string reachable.");
          const set = new Set(wordDict);
          for (let i = 1; i <= s.length; i++) {
            let ok = 0;
            for (const w of set) {
              if (i >= w.length && dp[i - w.length] && s.slice(i - w.length, i) === w) {
                ok = 1;
                r.describe(`Match word "${w}" ending at i=${i}.`);
                break;
              }
            }
            writeDp1D(
              r,
              dp,
              i,
              ok,
              `dp[${i}] for prefix "${s.slice(0, i)}" → ${ok ? "reachable" : "not reachable"}.`,
            );
          }
          const result = dp[s.length] === 1;
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 198,
    title: "House Robber",
    difficulty: "medium",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 198. House Robber

Max money robbing non-adjacent houses.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 2, 3, 1] } },
      { label: "Example 2", input: { array: [2, 7, 9, 3, 1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "198-rob-dp",
        name: "Linear DP",
        time: "O(n)",
        space: "O(n)",
        code: `function rob(nums) {
  let prev = 0, cur = 0;
  for (const x of nums) [prev, cur] = [cur, Math.max(cur, prev + x)];
  return cur;
}`,
        execute({ array }) {
          const r = new EventRecorder("198-rob-dp");
          const dp = Array(array.length + 1).fill(0);
          writeDp1D(r, dp, 0, 0, "No houses → $0.");
          for (let i = 0; i < array.length; i++) {
            const val = Math.max(dp[i], dp[i] + array[i]);
            writeDp1D(
              r,
              dp,
              i + 1,
              val,
              `House ${i} ($${array[i]}): skip→${dp[i]} vs rob→${dp[i] + array[i]} → dp[${i + 1}]=${val}.`,
            );
          }
          r.returnValue(dp[array.length]);
          r.done(dp[array.length]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 213,
    title: "House Robber II",
    difficulty: "medium",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 213. House Robber II

Houses arranged in a circle — cannot rob both first and last.`,
    testcases: [
      { label: "Example 1", input: { array: [2, 3, 2] } },
      { label: "Example 2", input: { array: [1, 2, 3, 1] } },
    ],
    solutions: [
      sol<Arr>({
        id: "213-rob-circle-dp",
        name: "Two Linear Passes",
        time: "O(n)",
        space: "O(n)",
        code: `function rob(nums) {
  const robRange = (lo, hi) => { /* 198 on subarray */ };
  return Math.max(robRange(0, n-2), robRange(1, n-1));
}`,
        execute({ array }) {
          const r = new EventRecorder("213-rob-circle-dp");
          const robRange = (lo: number, hi: number) => {
            const dp = Array(hi - lo + 2).fill(0);
            writeDp1D(r, dp, 0, 0, `Rob range [${lo}..${hi}] — dp[0]=0.`);
            for (let i = lo; i <= hi; i++) {
              const idx = i - lo + 1;
              const val = Math.max(dp[idx - 1], dp[idx - 2] + array[i]);
              writeDp1D(
                r,
                dp,
                idx,
                val,
                `Index ${i} ($${array[i]}): max(skip, rob) = ${val}.`,
              );
            }
            return dp[hi - lo + 1];
          };
          if (array.length === 1) {
            r.returnValue(array[0]);
            r.done(array[0]);
            return r.getEvents();
          }
          const a = robRange(0, array.length - 2);
          const b = robRange(1, array.length - 1);
          const result = Math.max(a, b);
          r.returnValue(result, { description: `max(exclude last=${a}, exclude first=${b}) = ${result}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 300,
    title: "Longest Increasing Subsequence",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "binary-search"],
    inputSchema: "array",
    statement: `# 300. Longest Increasing Subsequence

Return length of longest strictly increasing subsequence.`,
    testcases: [
      { label: "Example 1", input: { array: [10, 9, 2, 5, 3, 7, 101, 18] } },
      { label: "Example 2", input: { array: [0, 1, 0, 3, 2, 3] } },
    ],
    solutions: [
      sol<Arr>({
        id: "300-lis-dp",
        name: "O(n²) LIS DP",
        time: "O(n²)",
        space: "O(n)",
        code: `function lengthOfLIS(nums) {
  const dp = Array(nums.length).fill(1);
  for (let i = 1; i < nums.length; i++)
    for (let j = 0; j < i; j++)
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
  return Math.max(...dp);
}`,
        execute({ array }) {
          const r = new EventRecorder("300-lis-dp");
          const dp = Array(array.length).fill(1);
          for (let i = 0; i < array.length; i++) {
            writeDp1D(r, dp, i, 1, `Base dp[${i}]=1 (subsequence of ${array[i]}).`);
          }
          for (let i = 1; i < array.length; i++) {
            for (let j = 0; j < i; j++) {
              if (array[j] < array[i]) {
                const cand = dp[j] + 1;
                if (cand > dp[i]) {
                  writeDp1D(
                    r,
                    dp,
                    i,
                    cand,
                    `nums[${j}]=${array[j]} < nums[${i}]=${array[i]} → dp[${i}]=${cand}.`,
                  );
                }
              }
            }
          }
          const result = Math.max(...dp);
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 322,
    title: "Coin Change",
    difficulty: "medium",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 322. Coin Change

Fewest coins to make amount, or -1 if impossible.`,
    testcases: [
      { label: "Example 1", input: { coins: [1, 2, 5], amount: 11 } },
      { label: "Example 2", input: { coins: [2], amount: 3 } },
    ],
    solutions: [
      sol<CoinIn>({
        id: "322-coin-dp",
        name: "Unbounded Knapsack DP",
        time: "O(amount·coins)",
        space: "O(amount)",
        code: `function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins)
      if (a >= c) dp[a] = Math.min(dp[a], dp[a-c] + 1);
  return dp[amount];
}`,
        execute({ coins, amount }) {
          const r = new EventRecorder("322-coin-dp");
          const INF = amount + 1;
          const dp = Array(amount + 1).fill(INF);
          writeDp1D(r, dp, 0, 0, "Amount 0 needs 0 coins.");
          for (let a = 1; a <= amount; a++) {
            let best = INF;
            for (const c of coins) {
              if (a >= c && dp[a - c] + 1 < best) best = dp[a - c] + 1;
            }
            writeDp1D(
              r,
              dp,
              a,
              best,
              `Amount ${a}: best over coins [${coins.join(",")}] → ${best === INF ? "∞" : best} coins.`,
            );
          }
          const result = dp[amount] > amount ? -1 : dp[amount];
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 416,
    title: "Partition Equal Subset Sum",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "knapsack"],
    inputSchema: "knapsack",
    statement: `# 416. Partition Equal Subset Sum

Return true if array can be partitioned into two equal-sum subsets.`,
    testcases: [
      { label: "Example 1", input: { array: [1, 5, 11, 5] } },
      { label: "Example 2", input: { array: [1, 2, 3, 5] } },
    ],
    solutions: [
      sol<Arr>({
        id: "416-subset-dp",
        name: "0/1 Subset Sum DP",
        time: "O(n·sum)",
        space: "O(sum)",
        code: `function canPartition(nums) {
  const sum = nums.reduce((a,b)=>a+b,0);
  if (sum % 2) return false;
  const target = sum / 2;
  const dp = Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums)
    for (let t = target; t >= x; t--)
      dp[t] ||= dp[t-x];
  return dp[target];
}`,
        execute({ array }) {
          const r = new EventRecorder("416-subset-dp");
          const sum = array.reduce((a, b) => a + b, 0);
          if (sum % 2 !== 0) {
            r.describe(`Sum ${sum} odd — impossible.`);
            r.done(false);
            return r.getEvents();
          }
          const target = sum / 2;
          const dp: number[] = Array(target + 1).fill(0);
          writeDp1D(r, dp, 0, 1, "Sum 0 always achievable.");
          for (const x of array) {
            for (let t = target; t >= x; t--) {
              if (dp[t - x]) {
                writeDp1D(
                  r,
                  dp,
                  t,
                  1,
                  `Using ${x}: dp[${t}] = dp[${t - x}] → reachable.`,
                );
              }
            }
          }
          const result = dp[target] === 1;
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 509,
    title: "Fibonacci Number",
    difficulty: "easy",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 509. Fibonacci Number

Return the n-th Fibonacci number.`,
    testcases: [
      { label: "Example 1", input: { n: 2 } },
      { label: "Example 2", input: { n: 3 } },
      { label: "Example 3", input: { n: 4 } },
    ],
    solutions: [
      sol<Stairs>({
        id: "509-fib-dp",
        name: "Bottom-Up DP",
        time: "O(n)",
        space: "O(n)",
        code: `function fib(n: number): number {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}`,
        execute({ n }) {
          const r = new EventRecorder("509-fib-dp");
          const dp = Array(n + 1).fill(0);
          if (n >= 0) writeDp1D(r, dp, 0, 0, "F(0) = 0.");
          if (n >= 1) writeDp1D(r, dp, 1, 1, "F(1) = 1.");
          for (let i = 2; i <= n; i++) {
            writeDp1D(
              r,
              dp,
              i,
              dp[i - 1] + dp[i - 2],
              `F(${i}) = F(${i - 1})(${dp[i - 1]}) + F(${i - 2})(${dp[i - 2]}) = ${dp[i - 1] + dp[i - 2]}.`,
            );
          }
          r.returnValue(dp[n]);
          r.done(dp[n]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 518,
    title: "Coin Change II",
    difficulty: "medium",
    category: "dp",
    tags: ["dp"],
    inputSchema: "array",
    statement: `# 518. Coin Change II

Count combinations to make amount (order of coins doesn't matter).`,
    testcases: [
      { label: "Example 1", input: { amount: 5, coins: [1, 2, 5] } },
      { label: "Example 2", input: { amount: 3, coins: [2] } },
    ],
    solutions: [
      sol<CoinIn2>({
        id: "518-coin-comb-dp",
        name: "Combination DP",
        time: "O(amount·coins)",
        space: "O(amount)",
        code: `function change(amount, coins) {
  const dp = Array(amount + 1).fill(0);
  dp[0] = 1;
  for (const c of coins)
    for (let a = c; a <= amount; a++)
      dp[a] += dp[a-c];
  return dp[amount];
}`,
        execute({ amount, coins }) {
          const r = new EventRecorder("518-coin-comb-dp");
          const dp = Array(amount + 1).fill(0);
          writeDp1D(r, dp, 0, 1, "1 way to make amount 0.");
          for (const c of coins) {
            for (let a = c; a <= amount; a++) {
              const val = dp[a] + dp[a - c];
              writeDp1D(
                r,
                dp,
                a,
                val,
                `Coin ${c}: dp[${a}] += dp[${a - c}](${dp[a - c]}) → ${val} combinations.`,
              );
            }
          }
          r.returnValue(dp[amount]);
          r.done(dp[amount]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 1143,
    title: "Longest Common Subsequence",
    difficulty: "medium",
    category: "dp",
    tags: ["dp", "string"],
    inputSchema: "array",
    statement: `# 1143. Longest Common Subsequence

Return length of longest common subsequence of two strings.`,
    testcases: [
      { label: "Example 1", input: { text1: "abcde", text2: "ace" } },
      { label: "Example 2", input: { text1: "abc", text2: "abc" } },
    ],
    solutions: [
      sol<LcsIn>({
        id: "1143-lcs-dp",
        name: "2D LCS DP",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function longestCommonSubsequence(text1, text2) {
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = text1[i-1]===text2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}`,
        execute({ text1, text2 }) {
          const r = new EventRecorder("1143-lcs-dp");
          const m = text1.length;
          const n = text2.length;
          const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
          showDpTable(r, dp, "Initialize LCS table with zeros.", {});
          for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
              const val =
                text1[i - 1] === text2[j - 1]
                  ? dp[i - 1][j - 1] + 1
                  : Math.max(dp[i - 1][j], dp[i][j - 1]);
              writeDp2D(
                r,
                dp,
                i,
                j,
                val,
                text1[i - 1] === text2[j - 1]
                  ? `'${text1[i - 1]}'='${text2[j - 1]}' match → dp[${i}][${j}]=${val}.`
                  : `Mismatch — max(skip row, skip col)=${val}.`,
              );
            }
          }
          r.returnValue(dp[m][n]);
          r.done(dp[m][n]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 486,
    title: "Predict the Winner",
    difficulty: "medium",
    category: "dp",
    tags: ["array", "math", "dynamic-programming", "recursion", "game-theory"],
    inputSchema: "array",
    statement: `# 486. Predict the Winner

You are given an integer array \`nums\`. Two players take turns; Player 1 starts. On each turn a player takes either the first or last remaining number from the ends of the array (removing it). The game ends when there are no numbers left. The player with the most points wins.

Return \`true\` if Player 1 can win (score ≥ Player 2), assuming both play optimally. A draw counts as a win for Player 1.`,
    testcases: [
      { label: "Example 1 — false", input: { array: [1, 5, 2] } },
      { label: "Example 2 — true", input: { array: [1, 5, 233, 7] } },
      { label: "Single element", input: { array: [1] } },
      { label: "Even split", input: { array: [2, 4, 55, 6, 8] } },
    ],
    solutions: [
      sol<Arr>({
        id: "486-minimax-dp",
        name: "Minimax DP (score diff)",
        time: "O(n²)",
        space: "O(n²)",
        code: `function PredictTheWinner(nums: number[]): boolean {
  const n = nums.length;
  const dp = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = nums[i];
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Math.max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]);
    }
  }
  return dp[0][n - 1] >= 0;
}`,
        execute({ array }) {
          const r = new EventRecorder("486-minimax-dp");
          const nums = [...array];
          const n = nums.length;
          const dp: number[][] = Array.from({ length: n }, () =>
            Array(n).fill(0),
          );

          showArray(
            r,
            nums,
            `Predict the Winner on [${nums.join(", ")}]. dp[i][j] = best score difference for the player about to move on subarray i…j.`,
            { vars: { n } },
          );
          showDpTable(
            r,
            dp,
            "Empty DP table — fill by increasing subarray length.",
            {},
          );

          for (let i = 0; i < n; i++) {
            writeDp2D(
              r,
              dp,
              i,
              i,
              nums[i],
              `Base: only nums[${i}]=${nums[i]} left → difference = ${nums[i]}.`,
            );
            showArray(r, nums, `Highlight the single-element subarray at index ${i}.`, {
              kinds: { [i]: "selected" },
              vars: { i, j: i, diff: nums[i] },
            });
          }

          for (let len = 2; len <= n; len++) {
            showArray(
              r,
              nums,
              `Fill all windows of length ${len}.`,
              { vars: { len } },
            );
            for (let i = 0; i + len - 1 < n; i++) {
              const j = i + len - 1;
              const takeLeft = nums[i] - dp[i + 1][j];
              const takeRight = nums[j] - dp[i][j - 1];

              showArray(
                r,
                nums,
                `Subarray [${i}…${j}] = [${nums.slice(i, j + 1).join(", ")}]. Compare taking ends.`,
                {
                  kinds: Object.fromEntries(
                    Array.from({ length: j - i + 1 }, (_, k) => [
                      i + k,
                      "searching" as const,
                    ]),
                  ),
                  vars: { i, j, len },
                },
              );

              showArray(
                r,
                nums,
                `Take left nums[${i}]=${nums[i]} → opponent gets dp[${i + 1}][${j}]=${dp[i + 1][j]} → your net ${takeLeft}.`,
                {
                  kinds: { [i]: "left", ...Object.fromEntries(
                    Array.from({ length: j - i }, (_, k) => [
                      i + 1 + k,
                      "comparing" as const,
                    ]),
                  ) },
                  vars: { takeLeft, opp: dp[i + 1][j] },
                },
              );

              showArray(
                r,
                nums,
                `Take right nums[${j}]=${nums[j]} → opponent gets dp[${i}][${j - 1}]=${dp[i][j - 1]} → your net ${takeRight}.`,
                {
                  kinds: { [j]: "right", ...Object.fromEntries(
                    Array.from({ length: j - i }, (_, k) => [
                      i + k,
                      "comparing" as const,
                    ]),
                  ) },
                  vars: { takeRight, opp: dp[i][j - 1] },
                },
              );

              const best = Math.max(takeLeft, takeRight);
              const choice = takeLeft >= takeRight ? "left" : "right";
              writeDp2D(
                r,
                dp,
                i,
                j,
                best,
                `Optimal: take ${choice} → dp[${i}][${j}] = ${best} (max of ${takeLeft}, ${takeRight}).`,
              );
              showArray(
                r,
                nums,
                `Store dp[${i}][${j}]=${best}. Positive means current player leads on this range.`,
                {
                  kinds: { [choice === "left" ? i : j]: "found" },
                  vars: { i, j, best, choice },
                },
              );
            }
          }

          const diff = dp[0][n - 1];
          const win = diff >= 0;
          showArray(
            r,
            nums,
            `Full array diff dp[0][${n - 1}] = ${diff}. Player 1 ${win ? "wins or ties" : "loses"} → return ${win}.`,
            {
              kinds: Object.fromEntries(
                nums.map((_, i) => [i, win ? ("found" as const) : ("swapped" as const)]),
              ),
              vars: { diff, result: win },
            },
          );
          showDpTable(
            r,
            dp,
            `Final table. Top-right cell ${diff} ≥ 0? ${win}.`,
            { vars: { result: win } },
          );
          r.returnValue(win, {
            description: win
              ? `Player 1 can force a win/draw (diff ${diff}).`
              : `Player 1 cannot win (diff ${diff}).`,
          });
          r.done(win);
          return r.getEvents();
        },
      }),
    ],
  }),
];
