import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";

/** @deprecated Prefer Trace v0.1 / Learn EventRecorder. Snapshot adapter for Playground only. */
export interface ArrayInput {
  array: number[];
}

export const bubbleSortAdapter: AlgorithmAdapter<ArrayInput> = {
  id: "bubble-sort",
  execute({ array }) {
    const b = new SnapshotBuilder("bubble-sort");
    const nums = [...array];
    const n = nums.length;
    const sorted: number[] = [];

    b.emit({
      line: 0,
      variables: { i: null, j: null, n },
      structures: { array: [...nums] },
      highlights: mark({}, sorted),
      operation: "init",
      description:
        "Initial array. Bubble Sort compares adjacent pairs and swaps when out of order.",
    });

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        b.emit({
          line: 2,
          variables: { i, j, n, a: nums[j], b: nums[j + 1] },
          structures: { array: [...nums] },
          highlights: mark(
            { [j]: "comparing", [j + 1]: "comparing" },
            sorted,
          ),
          operation: "compare",
          description: `Comparing ${nums[j]} and ${nums[j + 1]}.`,
        });

        if (nums[j] > nums[j + 1]) {
          [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];
          b.emit({
            line: 3,
            variables: { i, j, n },
            structures: { array: [...nums] },
            highlights: mark({ [j]: "swapped", [j + 1]: "swapped" }, sorted),
            operation: "swap",
            description: `Swapped! ${nums[j]} ↔ ${nums[j + 1]}.`,
          });
        }
      }
      sorted.push(n - i - 1);
      b.emit({
        line: 2,
        variables: { i, j: null, n, sortedBoundary: n - i - 1 },
        structures: { array: [...nums] },
        highlights: mark({}, sorted),
        operation: "pass",
        description: `Pass ${i + 1} done — index ${n - i - 1} is locked in place.`,
      });
    }

    sorted.push(0);
    b.emit({
      line: 5,
      variables: { n },
      structures: { array: [...nums] },
      highlights: mark(
        {},
        Array.from({ length: n }, (_, i) => i),
      ),
      operation: "done",
      description: "Array is sorted! Bubble Sort complete.",
    });

    return b.build();
  },
};
