import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";
import type { TwoSumInput } from "./brute-force";

export const hashmapTwoSum: ReferenceSolution<TwoSumInput> = {
  id: "1-hashmap",
  name: "Hash Map",
  approach: "optimal",
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
  execute({ array, target }) {
    const r = new EventRecorder("1-hashmap");
    const nums = [...array];
    const map: Record<string, number> = {};
    r.setStructure(
      { array: nums, hashmap: { ...map } },
      { line: 1, description: `One-pass hash map for target ${target}.` },
    );
    r.updateVariable("target", target);

    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      r.movePointer("i", i);
      r.updateVariable("need", need, {
        line: 3,
        description: `At i=${i}, need ${need} to pair with ${nums[i]}.`,
      });
      r.highlight({
        kinds: { [i]: "current" },
        line: 3,
        description: `At i=${i}, need ${need} to pair with ${nums[i]}.`,
      });

      if (need in map) {
        const j = map[String(need)];
        r.highlight({
          kinds: { [j]: "found", [i]: "found" },
          line: 4,
          description: `Found ${need} at index ${j}. Return [${j}, ${i}].`,
        });
        r.returnValue([j, i]);
        r.done([j, i]);
        return r.getEvents();
      }

      map[String(nums[i])] = i;
      r.setStructure(
        { array: nums, hashmap: { ...map } },
        {
          line: 5,
          description: `Store ${nums[i]} → index ${i} in the map.`,
        },
      );
    }
    r.returnValue([]);
    r.done([]);
    return r.getEvents();
  },
};
