import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

/** Visualize selection via sorting (heap concept) — educational. */
export const kthLargestSort: ReferenceSolution<{ array: number[]; target: number }> = {
  id: "215-sort",
  name: "Sort & Index",
  approach: "better",
  timeComplexity: "O(n log n)",
  spaceComplexity: "O(1)",
  code: `function findKthLargest(nums: number[], k: number): number {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}`,
  execute({ array, target: k }) {
    const r = new EventRecorder("215-sort");
    const nums = [...array];
    r.setStructure({ array: [...nums] }, { description: `Find ${k}-th largest.` });
    r.updateVariable("k", k);
    nums.sort((a, b) => b - a);
    for (let i = 0; i < nums.length; i++) {
      r.setStructure({ array: [...nums] });
      r.highlight({
        kinds: { [i]: i < k ? "selected" : "searching" },
        sorted: Array.from({ length: i + 1 }, (_, j) => j),
        description: `Sorted descending — focus on top ${k}.`,
      });
    }
    const ans = nums[k - 1];
    r.highlight({
      kinds: { [k - 1]: "found" },
      description: `Answer is ${ans} at index ${k - 1}.`,
    });
    r.returnValue(ans);
    r.done(ans);
    return r.getEvents();
  },
};

export const kthLargestHeap: ReferenceSolution<{ array: number[]; target: number }> = {
  id: "215-heap",
  name: "Max-Heap Select",
  approach: "optimal",
  timeComplexity: "O(n + k log n)",
  spaceComplexity: "O(n)",
  code: `function findKthLargest(nums: number[], k: number): number {
  // max-heap conceptually: pop k times
  const heap = [...nums].sort((a, b) => b - a);
  for (let i = 0; i < k - 1; i++) heap.shift();
  return heap[0];
}`,
  execute({ array, target: k }) {
    const r = new EventRecorder("215-heap");
    let heap = [...array].sort((a, b) => b - a);
    r.setStructure(
      { array: [...heap], stack: [...heap] },
      { description: `Build max-heap view for k=${k}.` },
    );
    for (let i = 0; i < k - 1; i++) {
      const top = heap.shift()!;
      r.pop(top, { description: `Pop largest ${top}.` });
      r.setStructure({ array: [...heap], stack: [...heap] });
      r.highlight({
        kinds: { [0]: "current" },
        description: `Next largest is now ${heap[0]}.`,
      });
    }
    const ans = heap[0];
    r.highlight({ kinds: { [0]: "found" }, description: `k-th largest = ${ans}.` });
    r.returnValue(ans);
    r.done(ans);
    return r.getEvents();
  },
};
