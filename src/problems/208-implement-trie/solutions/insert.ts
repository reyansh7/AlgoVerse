import { EventRecorder } from "@/engine/events/recorder";
import type { TreeNode } from "@/core/types/structures";
import type { ReferenceSolution } from "@/problems/types";

export const trieInsert: ReferenceSolution<{ words: string[] }> = {
  id: "208-insert",
  name: "Insert Words",
  approach: "iterative",
  timeComplexity: "O(L)",
  spaceComplexity: "O(Σ L)",
  code: `class Trie {
  insert(word: string) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new Node();
      node = node.children[ch];
    }
    node.end = true;
  }
}`,
  execute({ words }) {
    const r = new EventRecorder("208-insert");
    type TNode = { children: Record<string, TNode>; end: boolean; id: string };
    let id = 0;
    const root: TNode = { children: {}, end: false, id: `t${id++}` };

    function toTree(node: TNode, label = "root"): TreeNode {
      const keys = Object.keys(node.children);
      const tree: TreeNode = { id: node.id, value: label };
      if (keys[0]) tree.left = toTree(node.children[keys[0]], keys[0]);
      if (keys[1]) tree.right = toTree(node.children[keys[1]], keys[1]);
      // Chain remaining children under right spine for viz
      let cur = tree.right;
      for (let i = 2; i < keys.length; i++) {
        const child = toTree(node.children[keys[i]], keys[i]);
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

    r.setStructure({ tree: toTree(root) }, { description: "Empty trie." });

    for (const word of words) {
      let node = root;
      r.updateVariable("word", word, { description: `Insert "${word}".` });
      for (const ch of word) {
        if (!node.children[ch]) {
          node.children[ch] = { children: {}, end: false, id: `t${id++}` };
          r.insertNode(node.children[ch].id, {
            value: ch,
            description: `Create child '${ch}'.`,
          });
        }
        node = node.children[ch];
        r.visitNode(node.id, undefined, { description: `Walk to '${ch}'.` });
        r.setStructure({ tree: toTree(root) });
      }
      node.end = true;
      r.describe(`Mark end of word "${word}".`);
    }
    r.done(words);
    return r.getEvents();
  },
};
