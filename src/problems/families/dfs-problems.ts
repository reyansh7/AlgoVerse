import { EventRecorder } from "@/engine/events/recorder";
import type { HighlightKind } from "@/core/types/execution";
import { createProblem, sol } from "@/problems/define";
import type { ProblemPackage } from "@/problems/types";

type WordSearchIn = { board: string[][]; word: string };
type FloodFillIn = { image: number[][]; sr: number; sc: number; color: number };

function showGrid(
  r: EventRecorder,
  grid: (number | string)[][],
  description: string,
  opts: {
    line?: number;
    kinds?: Record<number, HighlightKind>;
    vars?: Record<string, unknown>;
  } = {},
) {
  const flat = grid.flat();
  r.setStructure(
    { table: grid.map((row) => [...row]), array: flat },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  r.highlight({ kinds: opts.kinds ?? {}, line: opts.line, description });
}

function idx(r: number, c: number, cols: number) {
  return r * cols + c;
}

export const dfsFamily: ProblemPackage[] = [
  createProblem({
    id: 79,
    title: "Word Search",
    difficulty: "medium",
    category: "graph",
    tags: ["dfs", "backtracking", "grid"],
    inputSchema: "array",
    statement: `# 79. Word Search

Find if \`word\` exists in the board by adjacent cell paths (DFS backtracking).`,
    testcases: [
      {
        label: "Example 1",
        input: {
          board: [
            ["A", "B", "C", "E"],
            ["S", "F", "C", "S"],
            ["A", "D", "E", "E"],
          ],
          word: "ABCCED",
        },
      },
      {
        label: "Example 2",
        input: {
          board: [
            ["A", "B", "C", "E"],
            ["S", "F", "C", "S"],
            ["A", "D", "E", "E"],
          ],
          word: "SEE",
        },
      },
    ],
    solutions: [
      sol<WordSearchIn>({
        id: "79-dfs-backtrack",
        name: "DFS Backtracking",
        time: "O(m·n·4^L)",
        space: "O(L)",
        code: `function exist(board, word): boolean {
  function dfs(r, c, i) {
    if (i === word.length) return true;
    if (out of bounds || board[r][c] !== word[i]) return false;
    mark visited; recurse 4 dirs; unmark;
  }
  for each cell: if dfs(r,c,0) return true;
  return false;
}`,
        execute({ board, word }) {
          const r = new EventRecorder("79-dfs-backtrack");
          const b = board.map((row) => [...row]);
          const R = b.length;
          const C = b[0].length;
          const path: string[] = [];
          showGrid(r, b, `DFS search for "${word}" on board.`, {
            vars: { word, path: "" },
          });
          function dfs(row: number, col: number, i: number): boolean {
            if (i === word.length) {
              showGrid(r, b, `Matched full word "${word}".`, {
                vars: { i, path: path.join("→") },
              });
              return true;
            }
            if (row < 0 || col < 0 || row >= R || col >= C || b[row][col] !== word[i]) {
              showGrid(r, b, `Dead end at (${row},${col}) for char '${word[i] ?? "∅"}'.`, {
                vars: { i },
              });
              return false;
            }
            const flat = idx(row, col, C);
            const ch = b[row][col];
            path.push(`(${row},${col})`);
            showGrid(r, b, `Match '${ch}' at (${row},${col}) — index ${i}.`, {
              kinds: { [flat]: "current" },
              vars: { i, char: ch, path: path.join("→") },
            });
            b[row][col] = "#";
            const dirs = [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ];
            for (const [dr, dc] of dirs) {
              showGrid(r, b, `Try direction (${dr},${dc}) from (${row},${col}).`, {
                kinds: { [flat]: "active" },
              });
              if (dfs(row + dr, col + dc, i + 1)) {
                b[row][col] = ch;
                return true;
              }
            }
            b[row][col] = ch;
            path.pop();
            showGrid(r, b, `Backtrack from (${row},${col}).`, {
              vars: { path: path.join("→") },
            });
            return false;
          }
          for (let row = 0; row < R; row++) {
            for (let col = 0; col < C; col++) {
              showGrid(r, b, `Start DFS at (${row},${col})='${b[row][col]}'.`, {
                kinds: { [idx(row, col, C)]: "searching" },
              });
              if (dfs(row, col, 0)) {
                r.returnValue(true, { description: `Found "${word}".` });
                r.done(true);
                return r.getEvents();
              }
            }
          }
          r.returnValue(false, { description: `"${word}" not found.` });
          r.done(false);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 733,
    title: "Flood Fill",
    difficulty: "easy",
    category: "graph",
    tags: ["dfs", "grid"],
    inputSchema: "array",
    statement: `# 733. Flood Fill

Recolor connected region starting at \`(sr, sc)\` from original color to \`color\`.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          image: [
            [1, 1, 1],
            [1, 1, 0],
            [1, 0, 1],
          ],
          sr: 1,
          sc: 1,
          color: 2,
        },
      },
      {
        label: "Example 2",
        input: {
          image: [[0, 0, 0], [0, 0, 0]],
          sr: 0,
          sc: 0,
          color: 0,
        },
      },
    ],
    solutions: [
      sol<FloodFillIn>({
        id: "733-dfs-fill",
        name: "DFS Flood Fill",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function floodFill(image, sr, sc, color): number[][] {
  const orig = image[sr][sc];
  if (orig === color) return image;
  function dfs(r, c) {
    if (r<0||c<0||r>=R||c>=C||image[r][c]!==orig) return;
    image[r][c] = color;
    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
  }
  dfs(sr, sc);
  return image;
}`,
        execute({ image, sr, sc, color }) {
          const r = new EventRecorder("733-dfs-fill");
          const img = image.map((row) => [...row]);
          const R = img.length;
          const C = img[0].length;
          const orig = img[sr][sc];
          showGrid(r, img, `Flood fill from (${sr},${sc}) color ${orig} → ${color}.`, {
            kinds: { [idx(sr, sc, C)]: "current" },
            vars: { orig, color },
          });
          if (orig === color) {
            r.returnValue(img, { description: "Already target color — no change." });
            r.done(img);
            return r.getEvents();
          }
          function dfs(row: number, col: number) {
            if (row < 0 || col < 0 || row >= R || col >= C || img[row][col] !== orig) return;
            img[row][col] = color;
            showGrid(r, img, `Paint (${row},${col}) → ${color}.`, {
              kinds: { [idx(row, col, C)]: "found" },
            });
            dfs(row + 1, col);
            dfs(row - 1, col);
            dfs(row, col + 1);
            dfs(row, col - 1);
          }
          dfs(sr, sc);
          showGrid(r, img, "Flood fill complete.", {});
          r.returnValue(img, { description: "Return recolored image." });
          r.done(img);
          return r.getEvents();
        },
      }),
    ],
  }),
];
