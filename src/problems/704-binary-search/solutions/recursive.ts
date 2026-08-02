import { EventRecorder } from "@/engine/events/recorder";
import type { ExecutionEvent } from "@/engine/events/types";
import type { ReferenceSolution } from "@/problems/types";
import type { ArrayTargetInput } from "./iterative";

const CODE = `function search(nums: number[], target: number): number {
  function helper(left: number, right: number): number {
    if (left > right) return -1;
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) return helper(mid + 1, right);
    return helper(left, mid - 1);
  }
  return helper(0, nums.length - 1);
}`;

function windowKinds(
  length: number,
  left: number,
  right: number,
  mid: number | null = null,
) {
  const kinds: Record<number, "left" | "right" | "searching" | "current"> = {};
  for (let i = 0; i < length; i++) {
    if (i < left || i > right) continue;
    if (i === left) kinds[i] = "left";
    else if (i === right) kinds[i] = "right";
    else kinds[i] = "searching";
  }
  if (mid !== null && mid >= left && mid <= right) kinds[mid] = "current";
  return kinds;
}

export const recursiveBinarySearch: ReferenceSolution<ArrayTargetInput> = {
  id: "704-recursive",
  name: "Recursive Binary Search",
  approach: "recursive",
  timeComplexity: "O(log n)",
  spaceComplexity: "O(log n)",
  code: CODE,
  execute({ array, target }): ExecutionEvent[] {
    const r = new EventRecorder("704-recursive");
    const nums = [...array];

    r.setStructure(
      { array: nums },
      {
        line: 1,
        description: `Recursive search for ${target}.`,
      },
    );
    r.updateVariable("target", target);
    r.updateVariable("depth", 0);

    function helper(left: number, right: number, depth: number): number {
      r.movePointer("left", left);
      r.movePointer("right", right);
      r.updateVariable("depth", depth, {
        line: 2,
        description: `Call helper(left=${left}, right=${right}) depth=${depth}.`,
      });

      if (left > right) {
        r.highlight({
          clear: true,
          line: 3,
          description: `Base case: left > right — not found.`,
        });
        return -1;
      }

      const mid = Math.floor((left + right) / 2);
      r.movePointer("mid", mid, {
        line: 4,
        description: `Mid = ${mid} → value ${nums[mid]}.`,
      });
      r.highlight({
        kinds: windowKinds(nums.length, left, right, mid),
        line: 4,
        description: `Mid = ${mid} → value ${nums[mid]}.`,
      });

      r.compare({
        indices: [mid],
        values: [nums[mid], target],
        line: 5,
        description: `Compare nums[${mid}] = ${nums[mid]} with ${target}.`,
      });
      r.highlight({
        kinds: {
          ...windowKinds(nums.length, left, right, mid),
          [mid]: "comparing",
        },
        line: 5,
        description: `Compare nums[${mid}] = ${nums[mid]} with ${target}.`,
      });

      if (nums[mid] === target) {
        r.highlight({
          kinds: { [mid]: "found" },
          line: 5,
          description: `Found at index ${mid}.`,
        });
        return mid;
      }

      if (nums[mid] < target) {
        r.describe(`${nums[mid]} < ${target} → recurse on right half.`, {
          line: 6,
        });
        return helper(mid + 1, right, depth + 1);
      }

      r.describe(`${nums[mid]} > ${target} → recurse on left half.`, {
        line: 7,
      });
      return helper(left, mid - 1, depth + 1);
    }

    const result = helper(0, nums.length - 1, 0);
    r.returnValue(result, {
      line: 9,
      description:
        result === -1
          ? `Target ${target} is not in the array.`
          : `Return index ${result}.`,
    });
    r.done(result);
    return r.getEvents();
  },
};
