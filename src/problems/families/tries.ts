import { EventRecorder } from "@/engine/events/recorder";
import type { TreeNode } from "@/core/types/structures";
import { createProblem, sol } from "@/problems/define";
import { showArray } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type TrieOps = {
  ops: Array<{ op: string; word?: string }>;
};
type BoardWords = { board: string[][]; words: string[] };
type DictSentence = { dictionary: string[]; sentence: string };

type TNode = { children: Record<string, TNode>; end: boolean; id: string };

function trieToTree(node: TNode, label = "•"): TreeNode {
  const keys = Object.keys(node.children).sort();
  const tree: TreeNode = { id: node.id, value: label + (node.end ? "*" : "") };
  if (keys[0]) tree.left = trieToTree(node.children[keys[0]], keys[0]);
  if (keys[1]) tree.right = trieToTree(node.children[keys[1]], keys[1]);
  let cur = tree.right;
  for (let i = 2; i < keys.length; i++) {
    const child = trieToTree(node.children[keys[i]], keys[i]);
    if (!cur) {
      tree.right = child;
      cur = child;
    } else {
      cur.right = child;
      cur = child;
    }
  }
  return tree;
}

function showTrie(r: EventRecorder, root: TNode, description: string, opts = {}) {
  r.setStructure({ tree: trieToTree(root) }, { description, ...opts });
}

export const triesFamily: ProblemPackage[] = [
  createProblem({
    id: 211,
    title: "Design Add and Search Words Data Structure",
    difficulty: "medium",
    category: "trie",
    tags: ["trie", "design", "dfs"],
    inputSchema: "trie-ops",
    statement: `# 211. Design Add and Search Words Data Structure

Support adding words and searching with '.' wildcards using a trie.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          ops: [
            { op: "add", word: "bad" },
            { op: "add", word: "dad" },
            { op: "add", word: "mad" },
            { op: "search", word: "pad" },
            { op: "search", word: "bad" },
            { op: "search", word: ".ad" },
            { op: "search", word: "b.." },
          ],
        },
      },
    ],
    solutions: [
      sol<TrieOps>({
        id: "211-trie-wildcard",
        name: "Trie + DFS Search",
        time: "O(L) add, O(26^wildcards) search",
        space: "O(total chars)",
        code: `class WordDictionary {
  root = {};
  addWord(word) { /* insert chars */ }
  search(word) { /* dfs on '.' branches */ }
}`,
        execute({ ops }) {
          const r = new EventRecorder("211-trie-wildcard");
          let id = 0;
          const root: TNode = { children: {}, end: false, id: `t${id++}` };
          const results: unknown[] = [];
          showTrie(r, root, "Empty trie — add words, search with '.' wildcards.");

          const insert = (word: string) => {
            let node = root;
            for (const ch of word) {
              if (!node.children[ch]) {
                node.children[ch] = { children: {}, end: false, id: `t${id++}` };
                r.insertNode(node.children[ch].id, { value: ch, description: `Create '${ch}'.` });
              }
              node = node.children[ch];
              r.visitNode(node.id, undefined, { description: `Walk '${ch}'.` });
            }
            node.end = true;
            showTrie(r, root, `Marked end of "${word}".`);
          };

          const dfs = (node: TNode, i: number, word: string): boolean => {
            if (i === word.length) return node.end;
            const ch = word[i];
            if (ch === ".") {
              for (const k of Object.keys(node.children)) {
                r.describe(`Wildcard '.' — try branch '${k}'.`);
                if (dfs(node.children[k], i + 1, word)) return true;
              }
              return false;
            }
            if (!node.children[ch]) return false;
            r.visitNode(node.children[ch].id, undefined, { description: `Match '${ch}'.` });
            return dfs(node.children[ch], i + 1, word);
          };

          for (const op of ops) {
            if (op.op === "add" && op.word) {
              r.updateVariable("word", op.word, { description: `addWord("${op.word}").` });
              insert(op.word);
            } else if (op.op === "search" && op.word) {
              r.updateVariable("query", op.word, { description: `search("${op.word}").` });
              showTrie(r, root, `Search pattern "${op.word}".`);
              const found = dfs(root, 0, op.word);
              results.push(found);
              r.describe(`search("${op.word}") → ${found}.`);
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
    id: 212,
    title: "Word Search II",
    difficulty: "hard",
    category: "trie",
    tags: ["trie", "backtracking", "matrix"],
    inputSchema: "array",
    statement: `# 212. Word Search II

Find all words from a dictionary that can be formed on a board by adjacent cells.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          board: [
            ["o", "a", "a", "n"],
            ["e", "t", "a", "e"],
            ["i", "h", "k", "r"],
            ["i", "f", "l", "v"],
          ],
          words: ["oath", "pea", "eat", "rain"],
        },
      },
    ],
    solutions: [
      sol<BoardWords>({
        id: "212-trie-backtrack",
        name: "Trie + Backtrack",
        time: "O(m·n·4^L)",
        space: "O(W·L)",
        code: `function findWords(board, words) {
  // build trie, dfs from each cell, prune on trie prefix
}`,
        execute({ board, words }) {
          const r = new EventRecorder("212-trie-backtrack");
          let nid = 0;
          const root: TNode & { word?: string } = { children: {}, end: false, id: `t${nid++}` };
          const flat = board.flat();
          showArray(r, flat, `Build trie from ${words.length} dictionary words.`, {
            vars: { words },
          });

          for (const w of words) {
            let node: typeof root = root;
            for (const ch of w) {
              if (!node.children[ch]) node.children[ch] = { children: {}, end: false, id: `t${nid++}` };
              node = node.children[ch] as typeof root;
            }
            node.end = true;
            (node as typeof root).word = w;
          }
          showTrie(r, root, "Trie built — DFS from each cell.");

          const m = board.length;
          const n = board[0].length;
          const found = new Set<string>();
          const visited = new Set<string>();

          const dfs = (r0: number, c0: number, node: typeof root, path: string) => {
            const key = `${r0},${c0}`;
            if (visited.has(key)) return;
            const ch = board[r0][c0];
            if (!node.children[ch]) return;
            visited.add(key);
            const next = node.children[ch] as typeof root;
            const p = path + ch;
            const idx = r0 * n + c0;
            showArray(
              r,
              flat,
              `Cell (${r0},${c0})='${ch}' — path "${p}".`,
              { kinds: { [idx]: "current" }, vars: { path: p } },
            );
            if (next.end && next.word) {
              found.add(next.word);
              r.describe(`Found word "${next.word}".`);
            }
            for (const [dr, dc] of [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
            ]) {
              const nr = r0 + dr;
              const nc = c0 + dc;
              if (nr >= 0 && nr < m && nc >= 0 && nc < n) dfs(nr, nc, next, p);
            }
            visited.delete(key);
          };

          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              showArray(r, flat, `Start DFS from (${i},${j}).`, {
                kinds: { [i * n + j]: "searching" },
              });
              dfs(i, j, root, "");
            }
          }
          const result = [...found];
          r.returnValue(result, { description: `Found: [${result.join(", ")}].` });
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 648,
    title: "Replace Words",
    difficulty: "medium",
    category: "trie",
    tags: ["trie", "string"],
    inputSchema: "array",
    statement: `# 648. Replace Words

Replace words in a sentence with their shortest matching dictionary root.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          dictionary: ["cat", "bat", "rat"],
          sentence: "the cattle was rattled by the battery",
        },
      },
    ],
    solutions: [
      sol<DictSentence>({
        id: "648-trie-roots",
        name: "Trie Prefix Replacement",
        time: "O(D·L + S·L)",
        space: "O(D·L)",
        code: `function replaceWords(dictionary, sentence) {
  // trie of roots; for each word take shortest root prefix
}`,
        execute({ dictionary, sentence }) {
          const r = new EventRecorder("648-trie-roots");
          let nid = 0;
          const root: TNode = { children: {}, end: false, id: `t${nid++}` };
          for (const w of dictionary) {
            let node = root;
            for (const ch of w) {
              if (!node.children[ch]) node.children[ch] = { children: {}, end: false, id: `t${nid++}` };
              node = node.children[ch];
            }
            node.end = true;
          }
          showTrie(r, root, "Trie of dictionary roots.");

          const tokens = sentence.split(" ");
          const out: string[] = [];
          showArray(r, tokens, `Tokenize sentence into ${tokens.length} words.`, {});

          for (let ti = 0; ti < tokens.length; ti++) {
            const word = tokens[ti];
            let node = root;
            let prefix = "";
            let replaced = word;
            for (let i = 0; i < word.length; i++) {
              const ch = word[i];
              if (!node.children[ch]) break;
              prefix += ch;
              node = node.children[ch];
              if (node.end) {
                replaced = prefix;
                r.describe(`"${word}" → shortest root "${prefix}".`);
                break;
              }
            }
            out.push(replaced);
            showArray(r, out, `Word ${ti}: "${word}" → "${replaced}".`, {
              kinds: { [ti]: "write" },
              vars: { token: word, replaced },
            });
          }
          const result = out.join(" ");
          r.returnValue(result);
          r.done(result);
          return r.getEvents();
        },
      }),
    ],
  }),
];
