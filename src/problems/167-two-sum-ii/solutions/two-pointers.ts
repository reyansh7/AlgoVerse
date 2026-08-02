import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";
import type { TwoSumInput } from "@/problems/1-two-sum/solutions/brute-force";

export const twoPointersSolution: ReferenceSolution<TwoSumInput> = {
  id: "167-two-pointers",
  name: "Two Pointers",
  approach: "optimal",
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  code: `function twoSum(numbers: number[], target: number): number[] {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
  execute({ array, target }) {
    const r = new EventRecorder("167-two-pointers");
    const nums = [...array];
    let left = 0;
    let right = nums.length - 1;
    r.setStructure({ array: nums }, { description: `Two pointers for target ${target}.` });
    r.updateVariable("target", target);

    while (left < right) {
      const sum = nums[left] + nums[right];
      r.movePointer("left", left);
      r.movePointer("right", right);
      r.compare({
        indices: [left, right],
        values: [nums[left], nums[right]],
        line: 3,
        description: `${nums[left]} + ${nums[right]} = ${sum} vs ${target}.`,
      });
      r.highlight({
        kinds: { [left]: "left", [right]: "right" },
        line: 3,
        description: `${nums[left]} + ${nums[right]} = ${sum} vs ${target}.`,
      });
      if (sum === target) {
        r.highlight({
          kinds: { [left]: "found", [right]: "found" },
          description: `Found 1-indexed pair [${left + 1}, ${right + 1}].`,
        });
        r.returnValue([left + 1, right + 1]);
        r.done([left + 1, right + 1]);
        return r.getEvents();
      }
      if (sum < target) left++;
      else right--;
    }
    r.returnValue([]);
    r.done([]);
    return r.getEvents();
  },
};
