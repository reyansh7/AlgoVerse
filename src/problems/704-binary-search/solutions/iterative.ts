import { EventRecorder } from "@/engine/events/recorder";
import type { ExecutionEvent } from "@/engine/events/types";
import type { ReferenceSolution } from "@/problems/types";

export interface ArrayTargetInput {
  array: number[];
  target: number;
}

const CODE = `function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
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

export const iterativeBinarySearch: ReferenceSolution<ArrayTargetInput> = {
  id: "704-iterative",
  name: "Iterative Binary Search",
  approach: "iterative",
  timeComplexity: "O(log n)",
  spaceComplexity: "O(1)",
  code: CODE,
  execute({ array, target }): ExecutionEvent[] {
    const r = new EventRecorder("704-iterative");
    const nums = [...array];
    let left = 0;
    let right = nums.length - 1;

    r.setStructure(
      { array: nums },
      {
        line: 1,
        description: `Search for ${target} — bounds start at [0, ${right}].`,
      },
    );
    r.movePointer("left", left);
    r.movePointer("right", right);
    r.updateVariable("target", target);
    r.updateVariable("mid", null);
    r.highlight({
      kinds: windowKinds(nums.length, left, right),
      line: 1,
      description: `Search for ${target} — bounds start at [0, ${right}].`,
    });

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      r.movePointer("mid", mid, {
        line: 5,
        description: `Mid = ${mid} → value ${nums[mid]}.`,
      });
      r.updateVariable("midValue", nums[mid]);
      r.highlight({
        kinds: windowKinds(nums.length, left, right, mid),
        line: 5,
        description: `Mid = ${mid} → value ${nums[mid]}.`,
      });

      r.compare({
        indices: [mid],
        values: [nums[mid], target],
        line: 6,
        description: `Compare nums[${mid}] = ${nums[mid]} with target ${target}.`,
      });
      r.highlight({
        kinds: {
          ...windowKinds(nums.length, left, right, mid),
          [mid]: "comparing",
        },
        line: 6,
        description: `Compare nums[${mid}] = ${nums[mid]} with target ${target}.`,
      });

      if (nums[mid] === target) {
        r.highlight({
          kinds: { [mid]: "found" },
          line: 6,
          description: `Found! Target ${target} is at index ${mid}.`,
        });
        r.returnValue(mid, {
          line: 6,
          description: `Found! Target ${target} is at index ${mid}.`,
        });
        r.done(mid);
        return r.getEvents();
      }

      if (nums[mid] < target) {
        left = mid + 1;
        r.movePointer("left", left, {
          line: 7,
          description: `${nums[mid]} < ${target} → discard left half, left = ${left}.`,
        });
        r.highlight({
          kinds: windowKinds(nums.length, left, right),
          line: 7,
          description: `${nums[mid]} < ${target} → discard left half, left = ${left}.`,
        });
      } else {
        right = mid - 1;
        r.movePointer("right", right, {
          line: 8,
          description: `${nums[mid]} > ${target} → discard right half, right = ${right}.`,
        });
        r.highlight({
          kinds: windowKinds(nums.length, left, right),
          line: 8,
          description: `${nums[mid]} > ${target} → discard right half, right = ${right}.`,
        });
      }
    }

    r.highlight({
      clear: true,
      line: 10,
      description: `Target ${target} is not in the array.`,
    });
    r.returnValue(-1, {
      line: 10,
      description: `Target ${target} is not in the array.`,
    });
    r.done(-1);
    return r.getEvents();
  },
};
