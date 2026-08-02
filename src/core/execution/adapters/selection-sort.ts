import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";
import type { ArrayInput } from "./bubble-sort";

export const selectionSortAdapter: AlgorithmAdapter<ArrayInput> = {
  id: "selection-sort",
  execute({ array }) {
    const b = new SnapshotBuilder("selection-sort");
    const nums = [...array];
    const n = nums.length;
    const sorted: number[] = [];

    b.emit({
      line: 0,
      variables: { n },
      structures: { array: [...nums] },
      highlights: mark({}, sorted),
      operation: "init",
      description:
        "Selection Sort finds the minimum in the unsorted region and places it next.",
    });

    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;
      b.emit({
        line: 2,
        variables: { i, minIndex, n },
        structures: { array: [...nums] },
        highlights: mark({ [i]: "selected", [minIndex]: "minimum" }, sorted),
        operation: "select",
        description: `Assume minimum is at index ${i} (${nums[i]}).`,
      });

      for (let j = i + 1; j < n; j++) {
        b.emit({
          line: 4,
          variables: { i, j, minIndex, n, candidate: nums[j], min: nums[minIndex] },
          structures: { array: [...nums] },
          highlights: mark(
            {
              [i]: "selected",
              [minIndex]: "minimum",
              [j]: "comparing",
            },
            sorted,
          ),
          operation: "compare",
          description: `Comparing ${nums[j]} with current min ${nums[minIndex]}.`,
        });

        if (nums[j] < nums[minIndex]) {
          minIndex = j;
          b.emit({
            line: 5,
            variables: { i, j, minIndex, n },
            structures: { array: [...nums] },
            highlights: mark(
              { [i]: "selected", [minIndex]: "minimum" },
              sorted,
            ),
            operation: "minimum",
            description: `New minimum: ${nums[minIndex]} at index ${minIndex}.`,
          });
        }
      }

      if (minIndex !== i) {
        [nums[i], nums[minIndex]] = [nums[minIndex], nums[i]];
        b.emit({
          line: 8,
          variables: { i, minIndex, n },
          structures: { array: [...nums] },
          highlights: mark({ [i]: "swapped", [minIndex]: "swapped" }, sorted),
          operation: "swap",
          description: `Swap ${nums[minIndex]} into position ${i}.`,
        });
      }

      sorted.push(i);
      b.emit({
        line: 2,
        variables: { i, n },
        structures: { array: [...nums] },
        highlights: mark({}, sorted),
        operation: "placed",
        description: `Index ${i} is now sorted.`,
      });
    }

    sorted.push(n - 1);
    b.emit({
      line: 11,
      variables: { n },
      structures: { array: [...nums] },
      highlights: mark(
        {},
        Array.from({ length: n }, (_, i) => i),
      ),
      operation: "done",
      description: "Selection Sort complete.",
    });

    return b.build();
  },
};
