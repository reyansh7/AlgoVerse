import { EventRecorder } from "@/engine/events/recorder";
import type { GraphData } from "@/core/types/structures";
import type { HighlightKind } from "@/core/types/execution";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type GridStr = { grid: string[][] };
type GridNum = { grid: number[][] };
type WordLadderIn = { beginWord: string; endWord: string; wordList: string[] };
type CloneGraphIn = { adj: number[][]; start: number };
type CourseIn = { numCourses: number; prerequisites: number[][] };
type ValidTreeIn = { n: number; edges: number[][] };
type ComponentsIn = { n: number; edges: number[][] };
type HeightsIn = { heights: number[][] };
type NetworkIn = { times: number[][]; n: number; k: number };
type BipartiteIn = { graph: number[][] };
type OrangesIn = { grid: number[][] };

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

function graphFromAdjList(adj: number[][]): GraphData {
  const nodes = adj.map((_, i) => ({ id: `n${i}`, label: i + 1 }));
  const edges: GraphData["edges"] = [];
  let e = 0;
  for (let i = 0; i < adj.length; i++) {
    for (const j of adj[i]) {
      if (i < j) edges.push({ id: `e${e++}`, from: `n${i}`, to: `n${j}` });
    }
  }
  return { nodes, edges };
}

function showGraph(
  r: EventRecorder,
  graph: GraphData,
  description: string,
  opts: {
    queue?: (number | string)[];
    stack?: (number | string)[];
    vars?: Record<string, unknown>;
    line?: number;
  } = {},
) {
  r.setStructure(
    {
      graph: {
        nodes: graph.nodes.map((n) => ({ ...n })),
        edges: graph.edges.map((e) => ({ ...e })),
      },
      queue: opts.queue ? [...opts.queue] : undefined,
      stack: opts.stack ? [...opts.stack] : undefined,
    },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

export const graphsFamily: ProblemPackage[] = [
  createProblem({
    id: 127,
    title: "Word Ladder",
    difficulty: "hard",
    category: "graph",
    tags: ["graph", "bfs", "string"],
    inputSchema: "graph",
    statement: `# 127. Word Ladder

Transform \`beginWord\` to \`endWord\` using BFS over one-letter mutations.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          beginWord: "hit",
          endWord: "cog",
          wordList: ["hot", "dot", "dog", "lot", "log", "cog"],
        },
      },
    ],
    solutions: [
      sol<WordLadderIn>({
        id: "127-bfs",
        name: "BFS Shortest Path",
        time: "O(N·L²)",
        space: "O(N·L)",
        code: `function ladderLength(begin, end, wordList): number {
  const words = new Set(wordList);
  const q = [begin];
  let depth = 1;
  while (q.length) {
    for (let sz = q.length; sz; sz--) {
      const w = q.shift()!;
      if (w === end) return depth;
      for (let i = 0; i < w.length; i++) {
        for (let c = 97; c <= 122; c++) {
          const nxt = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (words.has(nxt)) { words.delete(nxt); q.push(nxt); }
        }
      }
    }
    depth++;
  }
  return 0;
}`,
        execute({ beginWord, endWord, wordList }) {
          const r = new EventRecorder("127-bfs");
          const words = new Set(wordList);
          const q: string[] = [beginWord];
          let depth = 1;
          showArray(r, [beginWord], `BFS from "${beginWord}" toward "${endWord}".`, {
            vars: { depth, queue: q.join(", ") },
          });
          while (q.length) {
            for (let sz = q.length; sz; sz--) {
              const w = q.shift()!;
              showArray(r, [...q, w], `Dequeue "${w}" at depth ${depth}.`, {
                vars: { w, depth },
              });
              if (w === endWord) {
                r.returnValue(depth, { description: `Reached "${endWord}" in ${depth} steps.` });
                r.done(depth);
                return r.getEvents();
              }
              for (let i = 0; i < w.length; i++) {
                for (let c = 97; c <= 122; c++) {
                  const ch = String.fromCharCode(c);
                  if (ch === w[i]) continue;
                  const nxt = w.slice(0, i) + ch + w.slice(i + 1);
                  if (words.has(nxt)) {
                    words.delete(nxt);
                    q.push(nxt);
                    showArray(r, [...q], `Mutate '${w}' → "${nxt}", enqueue.`, {
                      vars: { from: w, nxt },
                    });
                  }
                }
              }
            }
            depth++;
            showArray(r, [...q], `Advance to depth ${depth}.`, { vars: { depth } });
          }
          r.returnValue(0, { description: "No transformation path." });
          r.done(0);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 133,
    title: "Clone Graph",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "dfs", "hashmap"],
    inputSchema: "graph",
    statement: `# 133. Clone Graph

Deep-copy a connected undirected graph starting from a node.`,
    testcases: [
      { label: "Example 1", input: { adj: [[2, 4], [1, 3], [2, 4], [1, 3]], start: 1 } },
    ],
    solutions: [
      sol<CloneGraphIn>({
        id: "133-dfs-clone",
        name: "DFS Clone",
        time: "O(V + E)",
        space: "O(V)",
        code: `function cloneGraph(node) {
  const map = new Map();
  function dfs(n) {
    if (map.has(n.val)) return map.get(n.val);
    const copy = { val: n.val, neighbors: [] };
    map.set(n.val, copy);
    for (const nb of n.neighbors) copy.neighbors.push(dfs(nb));
    return copy;
  }
  return dfs(node);
}`,
        execute({ adj, start }) {
          const r = new EventRecorder("133-dfs-clone");
          const g = graphFromAdjList(adj);
          showGraph(r, g, `Clone graph from node ${start}.`, { vars: { start } });
          const cloned = new Set<number>();
          function dfs(v: number) {
            const nid = `n${v - 1}`;
            r.visitNode(nid, undefined, { description: `Visit original node ${v}.` });
            if (cloned.has(v)) {
              r.describe(`Node ${v} already cloned — reuse.`, {});
              return;
            }
            cloned.add(v);
            r.updateVariable("cloned", [...cloned]);
            r.describe(`Create clone of node ${v}.`, {});
            for (const nb of adj[v - 1] ?? []) {
              const edge = g.edges.find(
                (e) =>
                  (e.from === nid && e.to === `n${nb - 1}`) ||
                  (e.from === `n${nb - 1}` && e.to === nid),
              );
              r.visitNode(`n${nb - 1}`, edge?.id, {
                description: `DFS edge ${v} → ${nb}.`,
              });
              dfs(nb);
            }
          }
          dfs(start);
          r.returnValue([...cloned].sort((a, b) => a - b), {
            description: `Cloned nodes: [${[...cloned].join(", ")}].`,
          });
          r.done([...cloned]);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 200,
    title: "Number of Islands",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "dfs", "grid"],
    inputSchema: "array",
    statement: `# 200. Number of Islands

Count connected components of \`'1'\` cells in a binary grid.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          grid: [
            ["1", "1", "1", "1", "0"],
            ["1", "1", "0", "1", "0"],
            ["1", "1", "0", "0", "0"],
            ["0", "0", "0", "0", "0"],
          ],
        },
      },
    ],
    solutions: [
      sol<GridStr>({
        id: "200-dfs-islands",
        name: "DFS Flood",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function numIslands(grid): number {
  let count = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= R || c >= C || grid[r][c] === '0') return;
    grid[r][c] = '0';
    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
  }
  for (each cell) if grid[r][c]==='1' { count++; dfs(r,c); }
  return count;
}`,
        execute({ grid }) {
          const r = new EventRecorder("200-dfs-islands");
          const g = grid.map((row) => [...row]);
          const R = g.length;
          const C = g[0].length;
          let count = 0;
          showGrid(r, g, "Scan grid for land ('1') cells.", { vars: { count } });
          function dfs(row: number, col: number) {
            if (row < 0 || col < 0 || row >= R || col >= C || g[row][col] === "0") return;
            const flat = idx(row, col, C);
            showGrid(r, g, `DFS visit cell (${row},${col}) index ${flat}.`, {
              kinds: { [flat]: "visited" },
              vars: { row, col },
            });
            g[row][col] = "0";
            showGrid(r, g, `Mark (${row},${col}) as visited (sink island).`, {
              kinds: { [flat]: "found" },
            });
            dfs(row + 1, col);
            dfs(row - 1, col);
            dfs(row, col + 1);
            dfs(row, col - 1);
          }
          for (let row = 0; row < R; row++) {
            for (let col = 0; col < C; col++) {
              if (g[row][col] === "1") {
                count++;
                showGrid(r, g, `Found new island #${count} at (${row},${col}).`, {
                  kinds: { [idx(row, col, C)]: "current" },
                  vars: { count },
                });
                dfs(row, col);
              }
            }
          }
          r.returnValue(count, { description: `${count} island(s) total.` });
          r.done(count);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 207,
    title: "Course Schedule",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "topological-sort", "cycle"],
    inputSchema: "graph",
    statement: `# 207. Course Schedule

Return whether all courses can be finished given prerequisite pairs.`,
    testcases: [
      { label: "Example 1", input: { numCourses: 2, prerequisites: [[1, 0]] } },
      { label: "Example 2", input: { numCourses: 2, prerequisites: [[1, 0], [0, 1]] } },
    ],
    solutions: [
      sol<CourseIn>({
        id: "207-kahn",
        name: "Kahn Topological Sort",
        time: "O(V + E)",
        space: "O(V + E)",
        code: `function canFinish(numCourses, prerequisites): boolean {
  // Kahn's algorithm — detect cycle if not all nodes processed
}`,
        execute({ numCourses, prerequisites }) {
          const r = new EventRecorder("207-kahn");
          const indeg = Array(numCourses).fill(0);
          const adj: number[][] = Array.from({ length: numCourses }, () => []);
          for (const [a, b] of prerequisites) {
            adj[b].push(a);
            indeg[a]++;
          }
          const nodes = Array.from({ length: numCourses }, (_, i) => ({
            id: `n${i}`,
            label: i,
          }));
          const edges = prerequisites.map(([a, b], i) => ({
            id: `e${i}`,
            from: `n${b}`,
            to: `n${a}`,
            directed: true,
          }));
          const graph: GraphData = { nodes, edges };
          showGraph(r, graph, "Build prerequisite digraph.", {
            vars: { indeg: indeg.join(",") },
          });
          const q: number[] = [];
          for (let i = 0; i < numCourses; i++) {
            if (indeg[i] === 0) q.push(i);
          }
          showGraph(r, graph, `Enqueue zero-indegree courses: [${q.join(", ")}].`, {
            queue: q.map((i) => i),
          });
          let taken = 0;
          while (q.length) {
            const u = q.shift()!;
            taken++;
            r.visitNode(`n${u}`, undefined, { description: `Take course ${u}.` });
            showGraph(r, graph, `Completed ${taken}/${numCourses} courses.`, {
              queue: q.map((i) => i),
              vars: { taken },
            });
            for (const v of adj[u]) {
              indeg[v]--;
              r.describe(`Edge ${u}→${v}: indegree[${v}] → ${indeg[v]}.`, {});
              if (indeg[v] === 0) {
                q.push(v);
                showGraph(r, graph, `Course ${v} now free — enqueue.`, {
                  queue: q.map((i) => i),
                });
              }
            }
          }
          const ok = taken === numCourses;
          r.returnValue(ok, {
            description: ok ? "No cycle — all courses finishable." : "Cycle detected.",
          });
          r.done(ok);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 210,
    title: "Course Schedule II",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "topological-sort"],
    inputSchema: "graph",
    statement: `# 210. Course Schedule II

Return a valid order to take all courses, or empty if impossible.`,
    testcases: [
      { label: "Example 1", input: { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] } },
    ],
    solutions: [
      sol<CourseIn>({
        id: "210-kahn-order",
        name: "Kahn Order",
        time: "O(V + E)",
        space: "O(V + E)",
        code: `function findOrder(numCourses, prerequisites): number[] {
  // Kahn's algorithm — append dequeued nodes to order
}`,
        execute({ numCourses, prerequisites }) {
          const r = new EventRecorder("210-kahn-order");
          const indeg = Array(numCourses).fill(0);
          const adj: number[][] = Array.from({ length: numCourses }, () => []);
          for (const [a, b] of prerequisites) {
            adj[b].push(a);
            indeg[a]++;
          }
          const graph: GraphData = {
            nodes: Array.from({ length: numCourses }, (_, i) => ({ id: `n${i}`, label: i })),
            edges: prerequisites.map(([a, b], i) => ({
              id: `e${i}`,
              from: `n${b}`,
              to: `n${a}`,
              directed: true,
            })),
          };
          const q: number[] = [];
          for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
          const order: number[] = [];
          showGraph(r, graph, "Topological sort via Kahn's algorithm.", {
            queue: q,
            vars: { order: "[]" },
          });
          while (q.length) {
            const u = q.shift()!;
            order.push(u);
            r.visitNode(`n${u}`, undefined, { description: `Append course ${u} to order.` });
            showGraph(r, graph, `Order so far: [${order.join(", ")}].`, {
              queue: q,
              vars: { order: order.join(", ") },
            });
            for (const v of adj[u]) {
              indeg[v]--;
              if (indeg[v] === 0) {
                q.push(v);
                showGraph(r, graph, `Enqueue ${v} (indegree 0).`, { queue: q });
              }
            }
          }
          const result = order.length === numCourses ? order : [];
          r.returnValue(result, {
            description: result.length ? `Valid order: [${result.join(", ")}].` : "Cycle — no order.",
          });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 261,
    title: "Graph Valid Tree",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "union-find", "dfs"],
    inputSchema: "graph",
    statement: `# 261. Graph Valid Tree

An undirected graph on \`n\` nodes is a valid tree iff connected and acyclic.`,
    testcases: [
      { label: "Example 1", input: { n: 5, edges: [[0, 1], [0, 2], [0, 3], [1, 4]] } },
      { label: "Example 2", input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]] } },
    ],
    solutions: [
      sol<ValidTreeIn>({
        id: "261-dfs-tree",
        name: "DFS Acyclic Check",
        time: "O(V + E)",
        space: "O(V)",
        code: `function validTree(n, edges): boolean {
  if (edges.length !== n - 1) return false;
  // DFS from 0 — must visit all nodes
}`,
        execute({ n, edges }) {
          const r = new EventRecorder("261-dfs-tree");
          const adj: number[][] = Array.from({ length: n }, () => []);
          for (const [a, b] of edges) {
            adj[a].push(b);
            adj[b].push(a);
          }
          const graph: GraphData = {
            nodes: Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: i })),
            edges: edges.map(([a, b], i) => ({ id: `e${i}`, from: `n${a}`, to: `n${b}` })),
          };
          showGraph(r, graph, `Tree needs exactly ${n - 1} edges; have ${edges.length}.`, {});
          if (edges.length !== n - 1) {
            r.returnValue(false, { description: "Wrong edge count — not a tree." });
            r.done(false);
            return r.getEvents();
          }
          const visited = new Set<number>();
          function dfs(u: number, parent: number) {
            visited.add(u);
            r.visitNode(`n${u}`, undefined, { description: `DFS node ${u}.` });
            for (const v of adj[u]) {
              if (v === parent) continue;
              if (visited.has(v)) {
                r.describe(`Cycle: back edge ${u}–${v}.`, {});
                return false;
              }
              if (!dfs(v, u)) return false;
            }
            return true;
          }
          const acyclic = dfs(0, -1);
          const connected = visited.size === n;
          const result = acyclic && connected;
          showGraph(r, graph, `Visited ${visited.size}/${n} nodes.`, {
            vars: { acyclic, connected },
          });
          r.returnValue(result, { description: result ? "Valid tree." : "Not a tree." });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 323,
    title: "Number of Connected Components in an Undirected Graph",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "dfs", "union-find"],
    inputSchema: "graph",
    statement: `# 323. Number of Connected Components

Count connected components in an undirected graph.`,
    testcases: [
      { label: "Example 1", input: { n: 5, edges: [[0, 1], [1, 2], [3, 4]] } },
      { label: "Example 2", input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]] } },
    ],
    solutions: [
      sol<ComponentsIn>({
        id: "323-dfs-components",
        name: "DFS Components",
        time: "O(V + E)",
        space: "O(V)",
        code: `function countComponents(n, edges): number {
  let components = 0;
  for each unvisited node: components++; dfs(node);
  return components;
}`,
        execute({ n, edges }) {
          const r = new EventRecorder("323-dfs-components");
          const adj: number[][] = Array.from({ length: n }, () => []);
          for (const [a, b] of edges) {
            adj[a].push(b);
            adj[b].push(a);
          }
          const graph: GraphData = {
            nodes: Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: i })),
            edges: edges.map(([a, b], i) => ({ id: `e${i}`, from: `n${a}`, to: `n${b}` })),
          };
          const visited = new Set<number>();
          let components = 0;
          showGraph(r, graph, "Count components with DFS.", { vars: { components } });
          function dfs(u: number) {
            visited.add(u);
            r.visitNode(`n${u}`, undefined, { description: `Visit node ${u} in current component.` });
            for (const v of adj[u]) {
              if (!visited.has(v)) {
                const edge = graph.edges.find(
                  (e) =>
                    (e.from === `n${u}` && e.to === `n${v}`) ||
                    (e.from === `n${v}` && e.to === `n${u}`),
                );
                r.visitNode(`n${v}`, edge?.id, { description: `Cross edge ${u}–${v}.` });
                dfs(v);
              }
            }
          }
          for (let i = 0; i < n; i++) {
            if (!visited.has(i)) {
              components++;
              showGraph(r, graph, `Start component #${components} at node ${i}.`, {
                vars: { components },
              });
              dfs(i);
            }
          }
          r.returnValue(components, { description: `${components} connected component(s).` });
          r.done(components);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 417,
    title: "Pacific Atlantic Water Flow",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "dfs", "grid"],
    inputSchema: "array",
    statement: `# 417. Pacific Atlantic Water Flow

Cells that can flow to both Pacific and Atlantic oceans via non-decreasing paths.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          heights: [
            [1, 2, 2, 3, 5],
            [3, 2, 3, 4, 4],
            [2, 4, 5, 3, 1],
            [6, 7, 1, 4, 5],
            [5, 1, 1, 2, 4],
          ],
        },
      },
    ],
    solutions: [
      sol<HeightsIn>({
        id: "417-dfs-borders",
        name: "DFS from Borders",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function pacificAtlantic(heights): number[][] {
  // DFS from Pacific borders and Atlantic borders; intersect reachable sets
}`,
        execute({ heights }) {
          const r = new EventRecorder("417-dfs-borders");
          const h = heights.map((row) => [...row]);
          const R = h.length;
          const C = h[0].length;
          const pac = new Set<number>();
          const atl = new Set<number>();
          showGrid(r, h, "DFS from Pacific (top/left) and Atlantic (bottom/right) borders.", {});
          function dfs(row: number, col: number, reach: Set<number>, prev: number) {
            const key = idx(row, col, C);
            if (reach.has(key)) return;
            reach.add(key);
            showGrid(r, h, `Reach cell (${row},${col}) height=${h[row][col]}.`, {
              kinds: { [key]: "visited" },
            });
            const dirs = [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ];
            for (const [dr, dc] of dirs) {
              const nr = row + dr;
              const nc = col + dc;
              if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
              if (h[nr][nc] >= h[row][col]) dfs(nr, nc, reach, h[row][col]);
            }
          }
          for (let c = 0; c < C; c++) {
            dfs(0, c, pac, h[0][c]);
            dfs(R - 1, c, atl, h[R - 1][c]);
          }
          for (let row = 1; row < R - 1; row++) {
            dfs(row, 0, pac, h[row][0]);
            dfs(row, C - 1, atl, h[row][C - 1]);
          }
          const result: number[][] = [];
          for (let row = 0; row < R; row++) {
            for (let col = 0; col < C; col++) {
              const key = idx(row, col, C);
              if (pac.has(key) && atl.has(key)) {
                result.push([row, col]);
                showGrid(r, h, `(${row},${col}) reaches both oceans.`, {
                  kinds: { [key]: "found" },
                });
              }
            }
          }
          r.returnValue(result, { description: `${result.length} cell(s) flow to both oceans.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 695,
    title: "Max Area of Island",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "dfs", "grid"],
    inputSchema: "array",
    statement: `# 695. Max Area of Island

Return the maximum area of an island (\`1\` cells) in a binary grid.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          grid: [
            [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          ],
        },
      },
    ],
    solutions: [
      sol<GridNum>({
        id: "695-dfs-area",
        name: "DFS Area",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function maxAreaOfIsland(grid): number {
  function area(r,c) { /* DFS count */ }
  return max over islands;
}`,
        execute({ grid }) {
          const r = new EventRecorder("695-dfs-area");
          const g = grid.map((row) => [...row]);
          const R = g.length;
          const C = g[0].length;
          let best = 0;
          showGrid(r, g, "Find max island area via DFS.", { vars: { best } });
          function area(row: number, col: number): number {
            if (row < 0 || col < 0 || row >= R || col >= C || g[row][col] === 0) return 0;
            g[row][col] = 0;
            const flat = idx(row, col, C);
            showGrid(r, g, `Include cell (${row},${col}) in island.`, {
              kinds: { [flat]: "active" },
            });
            return (
              1 +
              area(row + 1, col) +
              area(row - 1, col) +
              area(row, col + 1) +
              area(row, col - 1)
            );
          }
          for (let row = 0; row < R; row++) {
            for (let col = 0; col < C; col++) {
              if (g[row][col] === 1) {
                const a = area(row, col);
                best = Math.max(best, a);
                showGrid(r, g, `Island from (${row},${col}) has area ${a}; best=${best}.`, {
                  vars: { a, best },
                });
              }
            }
          }
          r.returnValue(best, { description: `Maximum island area = ${best}.` });
          r.done(best);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 743,
    title: "Network Delay Time",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "dijkstra", "shortest-path"],
    inputSchema: "graph",
    statement: `# 743. Network Delay Time

Time for a signal from node \`k\` to reach all nodes (Dijkstra).`,
    testcases: [
      { label: "Example 1", input: { times: [[2, 1, 1], [2, 3, 1], [3, 4, 1]], n: 4, k: 2 } },
      { label: "Example 2", input: { times: [[1, 2, 1]], n: 2, k: 1 } },
    ],
    solutions: [
      sol<NetworkIn>({
        id: "743-dijkstra",
        name: "Dijkstra",
        time: "O(E log V)",
        space: "O(V + E)",
        code: `function networkDelayTime(times, n, k): number {
  // Dijkstra from k — return max distance or -1
}`,
        execute({ times, n, k }) {
          const r = new EventRecorder("743-dijkstra");
          const adj = new Map<number, [number, number][]>();
          for (let i = 1; i <= n; i++) adj.set(i, []);
          for (const [u, v, w] of times) adj.get(u)!.push([v, w]);
          const graph: GraphData = {
            nodes: Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: i + 1 })),
            edges: times.map(([u, v, w], i) => ({
              id: `e${i}`,
              from: `n${u - 1}`,
              to: `n${v - 1}`,
              weight: w,
              directed: true,
            })),
          };
          const dist = Array(n + 1).fill(Infinity);
          dist[k] = 0;
          const visited = new Set<number>();
          showGraph(r, graph, `Dijkstra from source node ${k}.`, {
            vars: { dist: dist.slice(1).join(",") },
          });
          for (let step = 0; step < n; step++) {
            let u = -1;
            let best = Infinity;
            for (let i = 1; i <= n; i++) {
              if (!visited.has(i) && dist[i] < best) {
                best = dist[i];
                u = i;
              }
            }
            if (u === -1 || best === Infinity) break;
            visited.add(u);
            r.visitNode(`n${u - 1}`, undefined, {
              description: `Settle node ${u} with dist=${dist[u]}.`,
            });
            for (const [v, w] of adj.get(u) ?? []) {
              if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                const edge = graph.edges.find(
                  (e) => e.from === `n${u - 1}` && e.to === `n${v - 1}`,
                );
                r.visitNode(`n${v - 1}`, edge?.id, {
                  description: `Relax ${u}→${v}: dist[${v}]=${dist[v]}.`,
                });
              }
            }
            showGraph(r, graph, `Distances: [${dist.slice(1).join(", ")}].`, {
              vars: { visited: [...visited].join(",") },
            });
          }
          const maxDist = Math.max(...dist.slice(1));
          const result = maxDist === Infinity ? -1 : maxDist;
          r.returnValue(result, {
            description: result === -1 ? "Unreachable node exists." : `All nodes reached in ${result} time.`,
          });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 785,
    title: "Is Graph Bipartite?",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "bfs", "coloring"],
    inputSchema: "graph",
    statement: `# 785. Is Graph Bipartite?

Two-color the graph; adjacent nodes must differ.`,
    testcases: [
      { label: "Example 1", input: { graph: [[1, 3], [0, 2], [1, 3], [0, 2]] } },
      { label: "Example 2", input: { graph: [[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]] } },
    ],
    solutions: [
      sol<BipartiteIn>({
        id: "785-bfs-color",
        name: "BFS 2-Coloring",
        time: "O(V + E)",
        space: "O(V)",
        code: `function isBipartite(graph): boolean {
  const color = Array(n).fill(-1);
  // BFS assign 0/1; conflict if neighbor same color
}`,
        execute({ graph: adj }) {
          const r = new EventRecorder("785-bfs-color");
          const n = adj.length;
          const g = graphFromAdjList(adj);
          const color = Array(n).fill(-1);
          showGraph(r, g, "BFS two-coloring for bipartite check.", { vars: { color: "unset" } });
          for (let start = 0; start < n; start++) {
            if (color[start] !== -1) continue;
            color[start] = 0;
            const q = [start];
            showGraph(r, g, `Color component starting at ${start} with 0.`, {
              queue: q,
            });
            while (q.length) {
              const u = q.shift()!;
              r.visitNode(`n${u}`, undefined, {
                description: `Node ${u} has color ${color[u]}.`,
              });
              for (const v of adj[u]) {
                if (color[v] === -1) {
                  color[v] = 1 - color[u];
                  q.push(v);
                  showGraph(r, g, `Color ${v} as ${color[v]} (opposite of ${u}).`, {
                    queue: q,
                    vars: { colors: color.join(",") },
                  });
                } else if (color[v] === color[u]) {
                  r.describe(`Conflict: ${u} and ${v} both color ${color[u]}.`, {});
                  r.returnValue(false, { description: "Not bipartite." });
                  r.done(false);
                  return r.getEvents();
                }
              }
            }
          }
          r.returnValue(true, { description: "Successfully 2-colored — bipartite." });
          r.done(true);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 994,
    title: "Rotting Oranges",
    difficulty: "medium",
    category: "graph",
    tags: ["graph", "bfs", "grid"],
    inputSchema: "array",
    statement: `# 994. Rotting Oranges

Minimum minutes until no fresh orange remains (multi-source BFS).`,
    testcases: [
      {
        label: "Example 1",
        input: {
          grid: [
            [2, 1, 1],
            [1, 1, 0],
            [0, 1, 1],
          ],
        },
      },
      { label: "Example 2", input: { grid: [[2, 1, 1], [0, 1, 1], [1, 0, 1]] } },
    ],
    solutions: [
      sol<OrangesIn>({
        id: "994-multi-bfs",
        name: "Multi-Source BFS",
        time: "O(m·n)",
        space: "O(m·n)",
        code: `function orangesRotting(grid): number {
  // Enqueue all rotten (2); BFS layer by layer
}`,
        execute({ grid }) {
          const r = new EventRecorder("994-multi-bfs");
          const g = grid.map((row) => [...row]);
          const R = g.length;
          const C = g[0].length;
          const q: [number, number][] = [];
          let fresh = 0;
          for (let row = 0; row < R; row++) {
            for (let col = 0; col < C; col++) {
              if (g[row][col] === 2) q.push([row, col]);
              if (g[row][col] === 1) fresh++;
            }
          }
          showGrid(r, g, `Enqueue ${q.length} rotten orange(s); ${fresh} fresh remain.`, {
            vars: { fresh, minutes: 0 },
          });
          let minutes = 0;
          const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          while (q.length && fresh > 0) {
            minutes++;
            for (let sz = q.length; sz; sz--) {
              const [row, col] = q.shift()!;
              for (const [dr, dc] of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== 1) continue;
                g[nr][nc] = 2;
                fresh--;
                q.push([nr, nc]);
                showGrid(r, g, `Minute ${minutes}: rot spreads to (${nr},${nc}).`, {
                  kinds: { [idx(nr, nc, C)]: "found" },
                  vars: { minutes, fresh },
                });
              }
            }
          }
          const result = fresh === 0 ? minutes : -1;
          r.returnValue(result, {
            description:
              result === -1
                ? "Fresh oranges unreachable."
                : `All rotten in ${minutes} minute(s).`,
          });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),
];
