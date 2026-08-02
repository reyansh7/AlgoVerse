import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";
import type { ArrayInput } from "./bubble-sort";

export const insertionSortAdapter: AlgorithmAdapter<ArrayInput> = {
  id: "insertion-sort",
  execute({ array }) {
    const b = new SnapshotBuilder("insertion-sort");
    const nums = [...array];
    const n = nums.length;

    b.emit({
      line: 0,
      variables: { n },
      structures: { array: [...nums] },
      highlights: mark({ 0: "sorted" }, [0]),
      operation: "init",
      description:
        "Insertion Sort grows a sorted prefix — index 0 starts sorted.",
    });

    for (let i = 1; i < n; i++) {
      const key = nums[i];
      let j = i - 1;

      b.emit({
        line: 2,
        variables: { i, key, j },
        structures: { array: [...nums] },
        highlights: mark(
          { [i]: "selected", ...Object.fromEntries(
            Array.from({ length: i }, (_, k) => [k, "sorted" as const]),
          ) },
          Array.from({ length: i }, (_, k) => k),
        ),
        operation: "select",
        description: `Pick key = ${key} at index ${i}.`,
      });

      while (j >= 0 && nums[j] > key) {
        b.emit({
          line: 4,
          variables: { i, key, j, comparing: nums[j] },
          structures: { array: [...nums] },
          highlights: mark(
            {
              [j]: "comparing",
              [j + 1]: "current",
              ...Object.fromEntries(
                Array.from({ length: j }, (_, k) => [k, "sorted" as const]),
              ),
            },
            Array.from({ length: j }, (_, k) => k),
          ),
          operation: "compare",
          description: `${nums[j]} > ${key} — shift right.`,
        });

        nums[j + 1] = nums[j];
        b.emit({
          line: 5,
          variables: { i, key, j },
          structures: { array: [...nums] },
          highlights: mark(
            { [j + 1]: "write", [j]: "current" },
            Array.from({ length: j }, (_, k) => k),
          ),
          operation: "shift",
          description: `Shift ${nums[j + 1]} to index ${j + 1}.`,
        });
        j--;
      }

      nums[j + 1] = key;
      const sorted = Array.from({ length: i + 1 }, (_, k) => k);
      b.emit({
        line: 7,
        variables: { i, key, placedAt: j + 1 },
        structures: { array: [...nums] },
        highlights: mark({ [j + 1]: "found" }, sorted),
        operation: "insert",
        description: `Insert ${key} at index ${j + 1}. Sorted prefix grows.`,
      });
    }

    b.emit({
      line: 9,
      variables: { n },
      structures: { array: [...nums] },
      highlights: mark(
        {},
        Array.from({ length: n }, (_, i) => i),
      ),
      operation: "done",
      description: "Insertion Sort complete.",
    });

    return b.build();
  },
};
