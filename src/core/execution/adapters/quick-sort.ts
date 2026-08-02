import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";
import type { ArrayInput } from "./bubble-sort";

export const quickSortAdapter: AlgorithmAdapter<ArrayInput> = {
  id: "quick-sort",
  execute({ array }) {
    const b = new SnapshotBuilder("quick-sort");
    const nums = [...array];
    const sorted: number[] = [];

    b.emit({
      line: 0,
      variables: { low: 0, high: nums.length - 1 },
      structures: { array: [...nums] },
      highlights: mark({}, sorted),
      operation: "init",
      description: "Quick Sort partitions around a pivot, then sorts each side.",
    });

    function partition(low: number, high: number): number {
      const pivot = nums[high];
      let i = low - 1;

      b.emit({
        line: 3,
        variables: { low, high, pivot, i },
        structures: { array: [...nums] },
        highlights: mark({ [high]: "pivot" }, sorted),
        operation: "pivot",
        description: `Pivot = ${pivot} at index ${high}.`,
      });

      for (let j = low; j < high; j++) {
        b.emit({
          line: 5,
          variables: { low, high, pivot, i, j, value: nums[j] },
          structures: { array: [...nums] },
          highlights: mark(
            { [j]: "comparing", [high]: "pivot" },
            sorted,
          ),
          operation: "compare",
          description: `Compare ${nums[j]} with pivot ${pivot}.`,
        });

        if (nums[j] < pivot) {
          i++;
          if (i !== j) {
            [nums[i], nums[j]] = [nums[j], nums[i]];
            b.emit({
              line: 6,
              variables: { low, high, pivot, i, j },
              structures: { array: [...nums] },
              highlights: mark(
                { [i]: "swapped", [j]: "swapped", [high]: "pivot" },
                sorted,
              ),
              operation: "swap",
              description: `Swap indices ${i} and ${j} (smaller than pivot).`,
            });
          }
        }
      }

      [nums[i + 1], nums[high]] = [nums[high], nums[i + 1]];
      const pivotIndex = i + 1;
      sorted.push(pivotIndex);
      b.emit({
        line: 8,
        variables: { low, high, pivotIndex, pivot },
        structures: { array: [...nums] },
        highlights: mark({ [pivotIndex]: "found" }, sorted),
        operation: "partition",
        description: `Pivot locked at index ${pivotIndex}.`,
      });

      return pivotIndex;
    }

    function sort(low: number, high: number) {
      if (low >= high) {
        if (low === high && !sorted.includes(low)) sorted.push(low);
        return;
      }
      const p = partition(low, high);
      sort(low, p - 1);
      sort(p + 1, high);
    }

    sort(0, nums.length - 1);

    b.emit({
      line: 11,
      variables: {},
      structures: { array: [...nums] },
      highlights: mark(
        {},
        Array.from({ length: nums.length }, (_, i) => i),
      ),
      operation: "done",
      description: "Quick Sort complete.",
    });

    return b.build();
  },
};
