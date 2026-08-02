import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export interface TwoSumInput {
  array: number[];
  target: number;
}

export const bruteForceTwoSum: ReferenceSolution<TwoSumInput> = {
  id: "1-brute",
  name: "Brute Force",
  approach: "brute",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  code: `function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`,
  execute({ array, target }) {
    const r = new EventRecorder("1-brute");
    const nums = [...array];
    r.setStructure({ array: nums }, { line: 1, description: `Find two numbers that sum to ${target}.` });
    r.updateVariable("target", target);

    for (let i = 0; i < nums.length; i++) {
      r.movePointer("i", i, { line: 2, description: `Outer index i = ${i} (value ${nums[i]}).` });
      for (let j = i + 1; j < nums.length; j++) {
        r.movePointer("j", j);
        r.compare({
          indices: [i, j],
          values: [nums[i], nums[j]],
          line: 3,
          description: `Check ${nums[i]} + ${nums[j]} = ${nums[i] + nums[j]} vs ${target}.`,
        });
        r.highlight({
          kinds: { [i]: "comparing", [j]: "comparing" },
          line: 3,
          description: `Check ${nums[i]} + ${nums[j]} = ${nums[i] + nums[j]} vs ${target}.`,
        });
        if (nums[i] + nums[j] === target) {
          r.highlight({
            kinds: { [i]: "found", [j]: "found" },
            line: 4,
            description: `Found pair at indices [${i}, ${j}].`,
          });
          r.returnValue([i, j]);
          r.done([i, j]);
          return r.getEvents();
        }
      }
    }
    r.returnValue([]);
    r.done([]);
    return r.getEvents();
  },
};
