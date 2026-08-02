import { EventRecorder } from "@/engine/events/recorder";
import type { TreeNode } from "@/core/types/structures";
import { createProblem, sol } from "@/problems/define";
import { treeFromLevelOrder } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type TreeIn = { values: (number | null)[] };

function showTreeBfs(
  r: EventRecorder,
  root: TreeNode | null,
  queue: (number | string)[],
  level: number[][],
  description: string,
  opts: { vars?: Record<string, unknown>; line?: number } = {},
) {
  r.setStructure(
    {
      tree: root,
      queue: [...queue],
      array: level.flat(),
    },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

export const bfsFamily: ProblemPackage[] = [
  createProblem({
    id: 103,
    title: "Binary Tree Zigzag Level Order Traversal",
    difficulty: "medium",
    category: "tree",
    tags: ["bfs", "tree", "queue"],
    inputSchema: "tree-array",
    statement: `# 103. Binary Tree Zigzag Level Order Traversal

Return level-order values alternating left-to-right and right-to-left.`,
    testcases: [
      { label: "Example 1", input: { values: [3, 9, 20, null, null, 15, 7] } },
      { label: "Example 2", input: { values: [1] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "103-zigzag-bfs",
        name: "BFS Zigzag",
        time: "O(n)",
        space: "O(n)",
        code: `function zigzagLevelOrder(root): number[][] {
  const q = [root];
  let leftToRight = true;
  while (q.length) {
    const level = [];
    for (let sz = q.length; sz; sz--) {
      const node = q.shift();
      level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    if (!leftToRight) level.reverse();
    result.push(level);
    leftToRight = !leftToRight;
  }
  return result;
}`,
        execute({ values }) {
          const r = new EventRecorder("103-zigzag-bfs");
          const root = treeFromLevelOrder(values);
          const result: number[][] = [];
          if (!root) {
            r.returnValue([]);
            r.done([]);
            return r.getEvents();
          }
          const q: TreeNode[] = [root];
          let leftToRight = true;
          showTreeBfs(r, root, q.map((n) => n.value), result, "BFS with alternating level direction.", {
            vars: { leftToRight },
          });
          while (q.length) {
            const level: number[] = [];
            const dir = leftToRight ? "L→R" : "R→L";
            showTreeBfs(r, root, q.map((n) => n.value), result, `Process level ${result.length + 1} (${dir}).`, {
              vars: { dir },
            });
            for (let sz = q.length; sz; sz--) {
              const node = q.shift()!;
              r.visitNode(node.id, undefined, {
                description: `Dequeue node ${node.value}.`,
              });
              level.push(node.value as number);
              if (node.left) {
                q.push(node.left);
                r.visitNode(node.left.id, undefined, {
                  description: `Enqueue left child ${node.left.value}.`,
                });
              }
              if (node.right) {
                q.push(node.right);
                r.visitNode(node.right.id, undefined, {
                  description: `Enqueue right child ${node.right.value}.`,
                });
              }
              showTreeBfs(r, root, q.map((n) => n.value), result, `Level building: [${level.join(", ")}].`, {});
            }
            if (!leftToRight) level.reverse();
            result.push([...level]);
            showTreeBfs(r, root, q.map((n) => n.value), result, `Level ${result.length}: [${level.join(", ")}] (${dir}).`, {
              vars: { result: result.map((l) => `[${l.join(",")}]`).join(" | ") },
            });
            leftToRight = !leftToRight;
          }
          r.returnValue(result, { description: `Zigzag levels: ${JSON.stringify(result)}.` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 107,
    title: "Binary Tree Level Order Traversal II",
    difficulty: "medium",
    category: "tree",
    tags: ["bfs", "tree", "queue"],
    inputSchema: "tree-array",
    statement: `# 107. Binary Tree Level Order Traversal II

Return bottom-up level order (leaf level first).`,
    testcases: [
      { label: "Example 1", input: { values: [3, 9, 20, null, null, 15, 7] } },
      { label: "Example 2", input: { values: [1] } },
    ],
    solutions: [
      sol<TreeIn>({
        id: "107-bottom-up-bfs",
        name: "BFS Bottom-Up",
        time: "O(n)",
        space: "O(n)",
        code: `function levelOrderBottom(root): number[][] {
  const levels = [];
  // standard BFS, then reverse levels array
  return levels.reverse();
}`,
        execute({ values }) {
          const r = new EventRecorder("107-bottom-up-bfs");
          const root = treeFromLevelOrder(values);
          const levels: number[][] = [];
          if (!root) {
            r.returnValue([]);
            r.done([]);
            return r.getEvents();
          }
          const q: TreeNode[] = [root];
          showTreeBfs(r, root, q.map((n) => n.value), levels, "Standard BFS — collect levels top-down.", {});
          while (q.length) {
            const level: number[] = [];
            showTreeBfs(r, root, q.map((n) => n.value), levels, `BFS level ${levels.length + 1}.`, {});
            for (let sz = q.length; sz; sz--) {
              const node = q.shift()!;
              r.visitNode(node.id, undefined, {
                description: `Visit ${node.value} at current level.`,
              });
              level.push(node.value as number);
              if (node.left) q.push(node.left);
              if (node.right) q.push(node.right);
              showTreeBfs(r, root, q.map((n) => n.value), levels, `Level so far: [${level.join(", ")}].`, {});
            }
            levels.push([...level]);
            showTreeBfs(r, root, q.map((n) => n.value), levels, `Push level [${level.join(", ")}].`, {
              vars: { levels: levels.length },
            });
          }
          showTreeBfs(r, root, [], levels, "Reverse collected levels for bottom-up order.", {});
          levels.reverse();
          showTreeBfs(r, root, [], levels, `Bottom-up result: ${JSON.stringify(levels)}.`, {
            vars: { result: levels.map((l) => `[${l.join(",")}]`).join(" | ") },
          });
          r.returnValue(levels, { description: "Return reversed level order." });
          r.done(levels);
          return r.getEvents();
        },
      }),
    ],
  }),
];
