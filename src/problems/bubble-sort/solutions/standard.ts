import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export interface ArrayInput {
  array: number[];
}

export const bubbleSortSolution: ReferenceSolution<ArrayInput> = {
  id: "bubble-sort-standard",
  name: "Bubble Sort",
  approach: "iterative",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  code: `function bubbleSort(nums: number[]): number[] {
  const a = [...nums];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    }
  }
  return a;
}`,
  execute({ array }) {
    const r = new EventRecorder("bubble-sort-standard");
    const nums = [...array];
    const n = nums.length;
    const sorted: number[] = [];
    r.setStructure({ array: [...nums] }, { description: "Start Bubble Sort." });
    r.highlight({ sorted, clear: true });

    for (let i = 0; i < n - 1; i++) {
      r.updateVariable("i", i);
      for (let j = 0; j < n - i - 1; j++) {
        r.movePointer("j", j);
        r.compare({
          indices: [j, j + 1],
          line: 3,
          description: `Compare ${nums[j]} and ${nums[j + 1]}.`,
        });
        r.highlight({
          kinds: { [j]: "comparing", [j + 1]: "comparing" },
          sorted,
          line: 3,
          description: `Compare ${nums[j]} and ${nums[j + 1]}.`,
        });
        if (nums[j] > nums[j + 1]) {
          r.swap(j, j + 1, {
            line: 4,
            description: `Swap ${nums[j]} and ${nums[j + 1]}.`,
          });
          // swap event already mutates array in reducer
          [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];
        }
      }
      sorted.push(n - i - 1);
      r.highlight({
        sorted: [...sorted],
        clear: false,
        kinds: {},
        line: 2,
        description: `Pass ${i + 1} done — index ${n - i - 1} locked.`,
      });
    }
    r.highlight({
      sorted: nums.map((_, i) => i),
      kinds: {},
      description: "Array fully sorted.",
    });
    r.done([...nums]);
    return r.getEvents();
  },
};
