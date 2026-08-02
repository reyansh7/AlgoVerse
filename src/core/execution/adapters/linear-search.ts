import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";
import type { ArrayTargetInput } from "./binary-search";

export const linearSearchAdapter: AlgorithmAdapter<ArrayTargetInput> = {
  id: "linear-search",
  execute({ array, target }) {
    const b = new SnapshotBuilder("linear-search");
    const nums = [...array];

    b.emit({
      line: 0,
      variables: { target, i: null },
      structures: { array: nums },
      highlights: mark({}),
      operation: "init",
      description: `Linear Search scans left → right for ${target}.`,
    });

    for (let i = 0; i < nums.length; i++) {
      b.emit({
        line: 2,
        variables: { i, target, value: nums[i] },
        structures: { array: nums },
        highlights: mark({ [i]: "comparing" }),
        operation: "compare",
        description: `Check index ${i}: ${nums[i]} === ${target}?`,
      });

      if (nums[i] === target) {
        b.emit({
          line: 3,
          variables: { i, target, found: true },
          structures: { array: nums },
          highlights: mark({ [i]: "found" }),
          operation: "found",
          description: `Found ${target} at index ${i}.`,
        });
        return b.build();
      }

      b.emit({
        line: 2,
        variables: { i, target },
        structures: { array: nums },
        highlights: mark({ [i]: "visited" }),
        operation: "advance",
        description: `${nums[i]} ≠ ${target} — keep scanning.`,
      });
    }

    b.emit({
      line: 5,
      variables: { target, found: false },
      structures: { array: nums },
      highlights: mark({}),
      operation: "not-found",
      description: `Target ${target} not found.`,
    });

    return b.build();
  },
};
