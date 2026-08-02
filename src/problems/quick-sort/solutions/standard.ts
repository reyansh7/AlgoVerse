import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";
import type { ArrayInput } from "@/problems/bubble-sort/solutions/standard";

export const quickSortSolution: ReferenceSolution<ArrayInput> = {
  id: "quick-sort-standard",
  name: "Quick Sort (Lomuto)",
  approach: "recursive",
  timeComplexity: "O(n log n) average",
  spaceComplexity: "O(log n)",
  code: `function quickSort(nums: number[]): number[] {
  const a = [...nums];
  function sort(lo: number, hi: number) {
    if (lo >= hi) return;
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  }
  function partition(lo: number, hi: number) {
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (a[j] < pivot) {
        [a[i], a[j]] = [a[j], a[i]];
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    return i;
  }
  sort(0, a.length - 1);
  return a;
}`,
  execute({ array }) {
    const r = new EventRecorder("quick-sort-standard");
    const nums = [...array];
    r.setStructure({ array: [...nums] }, { description: "Start Quick Sort." });

    function partition(lo: number, hi: number): number {
      const pivot = nums[hi];
      r.movePointer("hi", hi);
      r.updateVariable("pivot", pivot, {
        line: 8,
        description: `Pivot = ${pivot} at index ${hi}.`,
      });
      r.highlight({
        kinds: { [hi]: "pivot" },
        line: 8,
        description: `Pivot = ${pivot} at index ${hi}.`,
      });
      let i = lo;
      r.movePointer("i", i);
      for (let j = lo; j < hi; j++) {
        r.movePointer("j", j);
        r.compare({
          indices: [j, hi],
          line: 11,
          description: `Compare ${nums[j]} with pivot ${pivot}.`,
        });
        r.highlight({
          kinds: { [j]: "comparing", [hi]: "pivot", [i]: "selected" },
          line: 11,
          description: `Compare ${nums[j]} with pivot ${pivot}.`,
        });
        if (nums[j] < pivot) {
          if (i !== j) {
            r.swap(i, j, { description: `Swap ${nums[i]} and ${nums[j]}.` });
            [nums[i], nums[j]] = [nums[j], nums[i]];
          }
          i++;
          r.movePointer("i", i);
        }
      }
      r.swap(i, hi, { description: `Place pivot at index ${i}.` });
      [nums[i], nums[hi]] = [nums[hi], nums[i]];
      r.highlight({
        kinds: { [i]: "sorted" },
        description: `Pivot locked at index ${i}.`,
      });
      return i;
    }

    function sort(lo: number, hi: number) {
      if (lo >= hi) return;
      const p = partition(lo, hi);
      sort(lo, p - 1);
      sort(p + 1, hi);
    }

    sort(0, nums.length - 1);
    r.highlight({
      sorted: nums.map((_, i) => i),
      kinds: {},
      description: "Quick Sort complete.",
    });
    r.done([...nums]);
    return r.getEvents();
  },
};
