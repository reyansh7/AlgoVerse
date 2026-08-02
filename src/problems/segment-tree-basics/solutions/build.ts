import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export const segmentTreeBuild: ReferenceSolution<{
  array: number[];
  query: [number, number];
}> = {
  id: "segment-tree-build",
  name: "Build + Range Sum",
  approach: "iterative",
  timeComplexity: "O(n) build, O(log n) query",
  spaceComplexity: "O(n)",
  code: `function build(nums) {
  const n = nums.length;
  const tree = Array(n * 4).fill(0);
  function b(i, lo, hi) {
    if (lo === hi) { tree[i] = nums[lo]; return; }
    const mid = (lo + hi) >> 1;
    b(i*2, lo, mid); b(i*2+1, mid+1, hi);
    tree[i] = tree[i*2] + tree[i*2+1];
  }
  b(1, 0, n - 1);
  return tree;
}`,
  execute({ array, query }) {
    const r = new EventRecorder("segment-tree-build");
    const nums = [...array];
    const n = nums.length;
    const tree = Array(n * 4).fill(0);
    r.setStructure({ array: nums, table: [tree.map((x) => x)] }, { description: "Build segment tree." });

    function build(i: number, lo: number, hi: number) {
      r.updateVariable("node", i);
      r.updateVariable("lo", lo);
      r.updateVariable("hi", hi, { description: `Build node ${i} covering [${lo}, ${hi}].` });
      if (lo === hi) {
        tree[i] = nums[lo];
        r.setStructure({ array: nums, table: [[...tree]] });
        r.highlight({ kinds: { [lo]: "write" }, description: `Leaf = ${nums[lo]}.` });
        return;
      }
      const mid = (lo + hi) >> 1;
      build(i * 2, lo, mid);
      build(i * 2 + 1, mid + 1, hi);
      tree[i] = tree[i * 2] + tree[i * 2 + 1];
      r.setStructure({ array: nums, table: [[...tree]] });
      r.describe(`Node ${i} sum = ${tree[i]}.`);
    }

    build(1, 0, n - 1);

    const [L, R] = query;
    function querySum(i: number, lo: number, hi: number, l: number, rr: number): number {
      if (rr < lo || hi < l) return 0;
      if (l <= lo && hi <= rr) {
        r.highlight({
          kinds: Object.fromEntries(
            Array.from({ length: hi - lo + 1 }, (_, k) => [lo + k, "selected" as const]),
          ),
          description: `Fully covered [${lo}, ${hi}] → ${tree[i]}.`,
        });
        return tree[i];
      }
      const mid = (lo + hi) >> 1;
      return (
        querySum(i * 2, lo, mid, l, rr) + querySum(i * 2 + 1, mid + 1, hi, l, rr)
      );
    }

    const ans = querySum(1, 0, n - 1, L, R);
    r.returnValue(ans, { description: `Range sum [${L}, ${R}] = ${ans}.` });
    r.done(ans);
    return r.getEvents();
  },
};
