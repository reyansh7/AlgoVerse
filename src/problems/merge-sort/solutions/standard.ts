import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";
import type { ArrayInput } from "@/problems/bubble-sort/solutions/standard";

export const mergeSortSolution: ReferenceSolution<ArrayInput> = {
  id: "merge-sort-standard",
  name: "Merge Sort",
  approach: "recursive",
  timeComplexity: "O(n log n)",
  spaceComplexity: "O(n)",
  code: `function mergeSort(nums: number[]): number[] {
  if (nums.length <= 1) return nums;
  const mid = Math.floor(nums.length / 2);
  return merge(mergeSort(nums.slice(0, mid)), mergeSort(nums.slice(mid)));
}`,
  execute({ array }) {
    const r = new EventRecorder("merge-sort-standard");
    const nums = [...array];
    r.setStructure({ array: [...nums] }, { description: "Start Merge Sort." });

    function mergeSortRange(lo: number, hi: number): void {
      if (hi - lo <= 1) return;
      const mid = Math.floor((lo + hi) / 2);
      r.updateVariable("lo", lo);
      r.updateVariable("hi", hi);
      r.updateVariable("mid", mid, {
        line: 3,
        description: `Divide [${lo}, ${hi}) at mid=${mid}.`,
      });
      r.highlight({
        kinds: Object.fromEntries(
          Array.from({ length: hi - lo }, (_, k) => [lo + k, "searching" as const]),
        ),
        line: 3,
        description: `Divide [${lo}, ${hi}) at mid=${mid}.`,
      });
      mergeSortRange(lo, mid);
      mergeSortRange(mid, hi);

      const left = nums.slice(lo, mid);
      const right = nums.slice(mid, hi);
      let i = 0;
      let j = 0;
      let k = lo;
      while (i < left.length && j < right.length) {
        r.compare({
          indices: [lo + i < mid ? lo + i : mid + j, mid + j],
          line: 4,
          description: `Merge: compare ${left[i]} and ${right[j]}.`,
        });
        if (left[i] <= right[j]) {
          nums[k] = left[i++];
        } else {
          nums[k] = right[j++];
        }
        r.setStructure(
          { array: [...nums] },
          {
            line: 4,
            description: `Write ${nums[k]} at index ${k}.`,
          },
        );
        r.highlight({
          kinds: { [k]: "merged" },
          line: 4,
          description: `Write ${nums[k]} at index ${k}.`,
        });
        k++;
      }
      while (i < left.length) {
        nums[k] = left[i++];
        r.setStructure({ array: [...nums] });
        r.highlight({ kinds: { [k]: "merged" }, description: `Copy remaining ${nums[k]}.` });
        k++;
      }
      while (j < right.length) {
        nums[k] = right[j++];
        r.setStructure({ array: [...nums] });
        r.highlight({ kinds: { [k]: "merged" }, description: `Copy remaining ${nums[k]}.` });
        k++;
      }
    }

    mergeSortRange(0, nums.length);
    r.highlight({
      sorted: nums.map((_, i) => i),
      kinds: {},
      description: "Merge Sort complete.",
    });
    r.done([...nums]);
    return r.getEvents();
  },
};
