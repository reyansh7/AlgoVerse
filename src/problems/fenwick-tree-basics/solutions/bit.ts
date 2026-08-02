import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export const fenwickTreeSolution: ReferenceSolution<{
  array: number[];
  query: [number, number];
}> = {
  id: "fenwick-bit",
  name: "Binary Indexed Tree",
  approach: "iterative",
  timeComplexity: "O(n log n) build, O(log n) query",
  spaceComplexity: "O(n)",
  code: `function fenwick(nums) {
  const n = nums.length;
  const bit = Array(n + 1).fill(0);
  const add = (i, v) => { for (; i <= n; i += i & -i) bit[i] += v; };
  const sum = (i) => { let s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; };
  nums.forEach((v, i) => add(i + 1, v));
  return { sum };
}`,
  execute({ array, query }) {
    const r = new EventRecorder("fenwick-bit");
    const nums = [...array];
    const n = nums.length;
    const bit = Array(n + 1).fill(0);
    r.setStructure(
      { array: nums, table: [[...bit]] },
      { description: "Build Fenwick tree (1-indexed BIT)." },
    );

    const add = (i: number, v: number) => {
      for (; i <= n; i += i & -i) {
        bit[i] += v;
        r.setStructure({ array: nums, table: [[...bit]] });
        r.updateVariable("i", i, { description: `BIT[${i}] += ${v} → ${bit[i]}.` });
        r.highlight({ kinds: { [Math.min(i - 1, n - 1)]: "write" } });
      }
    };

    const prefix = (i: number) => {
      let s = 0;
      for (; i > 0; i -= i & -i) {
        s += bit[i];
        r.updateVariable("prefix", s, { description: `Accumulate BIT[${i}] → ${s}.` });
      }
      return s;
    };

    nums.forEach((v, idx) => add(idx + 1, v));
    const [L, R] = query;
    // query is inclusive indices in 0-based array; convert to 1-based prefix
    const ans = prefix(R + 1) - (L > 0 ? prefix(L) : 0);
    r.returnValue(ans, { description: `Sum [${L}, ${R}] = ${ans}.` });
    r.done(ans);
    return r.getEvents();
  },
};
