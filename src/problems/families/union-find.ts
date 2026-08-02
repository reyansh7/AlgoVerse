import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type BoardIn = { board: string[][] };
type EdgesIn = { edges: number[][] };
type AccountsIn = { accounts: string[][] };
type StonesIn = { stones: number[][] };

function showUf(
  r: EventRecorder,
  parent: number[],
  description: string,
  opts: {
    graph?: { nodes: { id: string; label: number; x: number; y: number }[]; edges: { id: string; from: string; to: string }[] };
    vars?: Record<string, unknown>;
    line?: number;
  } = {},
) {
  r.setStructure(
    {
      array: [...parent],
      ...(opts.graph ? { graph: opts.graph } : {}),
    },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

export const unionFindFamily: ProblemPackage[] = [
  createProblem({
    id: 130,
    title: "Surrounded Regions",
    difficulty: "medium",
    category: "union-find",
    tags: ["union-find", "matrix", "dfs"],
    inputSchema: "array",
    statement: `# 130. Surrounded Regions

Capture 'O' regions not connected to the border by flipping them to 'X'.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          board: [
            ["X", "X", "X", "X"],
            ["X", "O", "O", "X"],
            ["X", "X", "O", "X"],
            ["X", "O", "X", "X"],
          ],
        },
      },
    ],
    solutions: [
      sol<BoardIn>({
        id: "130-uf-border",
        name: "Union-Find from Border",
        time: "O(m·n·α(mn))",
        space: "O(m·n)",
        code: `function solve(board: string[][]): void {
  // union border 'O' cells; flip interior components not connected to border sentinel
}`,
        execute({ board }) {
          const r = new EventRecorder("130-uf-border");
          const m = board.length;
          const n = board[0].length;
          const flat: string[] = board.flat();
          const N = m * n;
          const parent = Array.from({ length: N + 1 }, (_, i) => i);
          const BORDER = N;

          const find = (x: number): number =>
            parent[x] === x ? x : (parent[x] = find(parent[x]));

          const unite = (a: number, b: number) => {
            const pa = find(a);
            const pb = find(b);
            if (pa !== pb) parent[pa] = pb;
          };

          showUf(r, parent, `Board ${m}×${n} — sentinel node ${BORDER} for border 'O'.`, {
            vars: { m, n },
          });

          const idx = (r0: number, c0: number) => r0 * n + c0;
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              if (board[i][j] !== "O") continue;
              if (i === 0 || j === 0 || i === m - 1 || j === n - 1) {
                unite(idx(i, j), BORDER);
                showUf(
                  r,
                  parent,
                  `Border cell (${i},${j})='O' — union with sentinel.`,
                  { vars: { cell: `${i},${j}` } },
                );
              }
            }
          }

          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              if (board[i][j] !== "O") continue;
              for (const [dr, dc] of [
                [1, 0],
                [0, 1],
              ]) {
                const ni = i + dr;
                const nj = j + dc;
                if (ni < m && nj < n && board[ni][nj] === "O") {
                  unite(idx(i, j), idx(ni, nj));
                  showUf(
                    r,
                    parent,
                    `Union 'O' at (${i},${j}) with (${ni},${nj}).`,
                    {},
                  );
                }
              }
            }
          }

          const out = board.map((row) => [...row]);
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              if (out[i][j] === "O" && find(idx(i, j)) !== find(BORDER)) {
                out[i][j] = "X";
                showArray(
                  r,
                  out.flat(),
                  `Interior 'O' at (${i},${j}) not on border component → flip to 'X'.`,
                  { kinds: { [idx(i, j)]: "write" } },
                );
              }
            }
          }
          r.done(out);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 684,
    title: "Redundant Connection",
    difficulty: "medium",
    category: "union-find",
    tags: ["union-find", "graph"],
    inputSchema: "graph",
    statement: `# 684. Redundant Connection

Find the edge that creates a cycle in an undirected tree.`,
    testcases: [
      { label: "Example 1", input: { edges: [[1, 2], [1, 3], [2, 3]] } },
      { label: "Example 2", input: { edges: [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]] } },
    ],
    solutions: [
      sol<EdgesIn>({
        id: "684-uf-cycle",
        name: "Union-Find Cycle Detection",
        time: "O(n·α(n))",
        space: "O(n)",
        code: `function findRedundantConnection(edges: number[][]): number[] {
  const parent = Array(edges.length + 1).fill(0).map((_, i) => i);
  const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
  for (const [u, v] of edges) {
    if (find(u) === find(v)) return [u, v];
    parent[find(u)] = find(v);
  }
  return [];
}`,
        execute({ edges }) {
          const r = new EventRecorder("684-uf-cycle");
          const n = edges.length;
          const parent = Array.from({ length: n + 1 }, (_, i) => i);
          const nodes = Array.from({ length: n + 1 }, (_, i) => ({
            id: String(i),
            label: i,
            x: Math.cos((i / (n + 1)) * Math.PI * 2),
            y: Math.sin((i / (n + 1)) * Math.PI * 2),
          }));
          const graphEdges: { id: string; from: string; to: string }[] = [];
          showUf(r, parent, "Process edges — redundant when endpoints already connected.", {
            graph: { nodes, edges: graphEdges },
          });

          const find = (x: number): number =>
            parent[x] === x ? x : (parent[x] = find(parent[x]));

          for (const [u, v] of edges) {
            showUf(r, parent, `Edge (${u}, ${v}): find(${u})=${find(u)}, find(${v})=${find(v)}.`, {
              graph: { nodes, edges: [...graphEdges] },
              vars: { u, v },
            });
            if (find(u) === find(v)) {
              r.returnValue([u, v], { description: `Cycle — redundant edge [${u}, ${v}].` });
              r.done([u, v]);
              return r.getEvents();
            }
            parent[find(u)] = find(v);
            graphEdges.push({ id: `${u}-${v}`, from: String(u), to: String(v) });
            showUf(r, parent, `Union ${u} and ${v}.`, {
              graph: { nodes, edges: [...graphEdges] },
            });
          }
          r.done([]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 721,
    title: "Accounts Merge",
    difficulty: "medium",
    category: "union-find",
    tags: ["union-find", "string", "graph"],
    inputSchema: "array",
    statement: `# 721. Accounts Merge

Merge accounts that share at least one email using union-find on emails.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          accounts: [
            ["John", "johnsmith@mail.com", "john_newyork@mail.com"],
            ["John", "johnsmith@mail.com", "john00@mail.com"],
            ["Mary", "mary@mail.com"],
            ["John", "john00@mail.com", "mary@mail.com"],
          ],
        },
      },
    ],
    solutions: [
      sol<AccountsIn>({
        id: "721-uf-emails",
        name: "Email Union-Find",
        time: "O(n·k·α(nk))",
        space: "O(n·k)",
        code: `function accountsMerge(accounts) {
  // map email → index, union emails within account, group by root
}`,
        execute({ accounts }) {
          const r = new EventRecorder("721-uf-emails");
          const emails: string[] = [];
          const idOf = new Map<string, number>();
          const addEmail = (e: string) => {
            if (!idOf.has(e)) {
              idOf.set(e, emails.length);
              emails.push(e);
            }
            return idOf.get(e)!;
          };
          for (const acc of accounts) {
            for (let i = 1; i < acc.length; i++) addEmail(acc[i]);
          }
          const parent = emails.map((_, i) => i);
          const find = (x: number): number =>
            parent[x] === x ? x : (parent[x] = find(parent[x]));
          showUf(r, parent, `${emails.length} unique emails — union within each account.`, {
            vars: { emails },
          });

          for (const acc of accounts) {
            const first = addEmail(acc[1]);
            for (let i = 2; i < acc.length; i++) {
              const e = addEmail(acc[i]);
              const a = find(first);
              const b = find(e);
              if (a !== b) {
                parent[a] = b;
                showUf(
                  r,
                  parent,
                  `Account "${acc[0]}": union ${acc[1]} ↔ ${acc[i]}.`,
                  { vars: { name: acc[0] } },
                );
              }
            }
          }

          const groups = new Map<number, string[]>();
          for (let i = 0; i < emails.length; i++) {
            const root = find(i);
            if (!groups.has(root)) groups.set(root, []);
            groups.get(root)!.push(emails[i]);
          }
          const result = [...groups.values()].map((g) => {
            g.sort();
            const name =
              accounts.find((a) => a.includes(g[0]))?.[0] ?? "Unknown";
            return [name, ...g];
          });
          r.returnValue(result, { description: `Merged into ${result.length} accounts.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 947,
    title: "Most Stones Removed with Same Row or Column",
    difficulty: "medium",
    category: "union-find",
    tags: ["union-find", "graph"],
    inputSchema: "array",
    statement: `# 947. Most Stones Removed with Same Row or Column

Max stones removable if two stones share a row or column.`,
    testcases: [
      { label: "Example 1", input: { stones: [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]] } },
      { label: "Example 2", input: { stones: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]] } },
    ],
    solutions: [
      sol<StonesIn>({
        id: "947-uf-row-col",
        name: "Row/Column Union-Find",
        time: "O(n·α(n))",
        space: "O(n)",
        code: `function removeStones(stones: number[][]): number {
  // union rows with cols offset; answer = n - components
}`,
        execute({ stones }) {
          const r = new EventRecorder("947-uf-row-col");
          const n = stones.length;
          const OFFSET = 10001;
          const parent = new Map<number, number>();
          const find = (x: number): number => {
            if (!parent.has(x)) parent.set(x, x);
            return parent.get(x) === x ? x : (parent.set(x, find(parent.get(x)!)), parent.get(x)!);
          };
          const unite = (a: number, b: number) => {
            parent.set(find(a), find(b));
          };

          showArray(
            r,
            stones.flatMap(([x, y]) => `${x},${y}`),
            `${n} stones — union row nodes with column nodes (col + offset).`,
            { vars: { offset: OFFSET } },
          );

          for (const [x, y] of stones) {
            unite(x, y + OFFSET);
            showArray(
              r,
              stones.flatMap(([a, b]) => `${a},${b}`),
              `Stone (${x},${y}): union row ${x} with col ${y}.`,
              {},
            );
          }

          const roots = new Set<number>();
          for (const key of parent.keys()) roots.add(find(key));
          const components = roots.size;
          const removed = n - components;
          r.returnValue(removed, {
            description: `${components} connected components → remove ${removed} stones.`,
          });
          r.done(removed);
          return r.getEvents();
        },
      }),
    ],
  }),
];
