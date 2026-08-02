import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";

export interface ArrayTargetInput {
  array: number[];
  target: number;
}

export const binarySearchAdapter: AlgorithmAdapter<ArrayTargetInput> = {
  id: "binary-search",
  execute({ array, target }) {
    const b = new SnapshotBuilder("binary-search");
    const nums = [...array];
    let left = 0;
    let right = nums.length - 1;

    const windowKinds = (mid: number | null = null) => {
      const kinds: Record<number, "left" | "right" | "searching" | "current"> = {};
      for (let i = 0; i < nums.length; i++) {
        if (i < left || i > right) continue;
        if (i === left) kinds[i] = "left";
        else if (i === right) kinds[i] = "right";
        else kinds[i] = "searching";
      }
      if (mid !== null && mid >= left && mid <= right) kinds[mid] = "current";
      return kinds;
    };

    b.emit({
      line: 0,
      variables: { left, right, mid: null, target },
      structures: { array: nums },
      highlights: mark(windowKinds()),
      operation: "init",
      description: `Search for ${target} in a sorted array — bounds start at [0, ${right}].`,
    });

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      b.emit({
        line: 2,
        variables: { left, right, mid, target, midValue: nums[mid] },
        structures: { array: nums },
        highlights: mark(windowKinds(mid)),
        operation: "mid",
        description: `Mid = ${mid} → value ${nums[mid]}.`,
      });

      b.emit({
        line: 3,
        variables: { left, right, mid, target, midValue: nums[mid] },
        structures: { array: nums },
        highlights: mark({ ...windowKinds(mid), [mid]: "comparing" }),
        operation: "compare",
        description: `Compare nums[${mid}] = ${nums[mid]} with target ${target}.`,
      });

      if (nums[mid] === target) {
        b.emit({
          line: 4,
          variables: { left, right, mid, target, found: true },
          structures: { array: nums },
          highlights: mark({ [mid]: "found" }),
          operation: "found",
          description: `Found! Target ${target} is at index ${mid}.`,
        });
        return b.build();
      }

      if (nums[mid] < target) {
        left = mid + 1;
        b.emit({
          line: 6,
          variables: { left, right, mid, target },
          structures: { array: nums },
          highlights: mark(windowKinds()),
          operation: "left",
          description: `${nums[mid]} < ${target} → discard left half, left = ${left}.`,
        });
      } else {
        right = mid - 1;
        b.emit({
          line: 8,
          variables: { left, right, mid, target },
          structures: { array: nums },
          highlights: mark(windowKinds()),
          operation: "right",
          description: `${nums[mid]} > ${target} → discard right half, right = ${right}.`,
        });
      }
    }

    b.emit({
      line: 10,
      variables: { left, right, mid: null, target, found: false },
      structures: { array: nums },
      highlights: mark({}),
      operation: "not-found",
      description: `Target ${target} is not in the array.`,
    });

    return b.build();
  },
};
