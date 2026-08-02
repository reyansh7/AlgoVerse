import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";
import { mark } from "@/lib/highlight-colors";
import type { ArrayInput } from "./bubble-sort";

export const mergeSortAdapter: AlgorithmAdapter<ArrayInput> = {
  id: "merge-sort",
  execute({ array }) {
    const b = new SnapshotBuilder("merge-sort");
    const nums = [...array];

    b.emit({
      line: 0,
      variables: { low: 0, high: nums.length - 1 },
      structures: { array: [...nums] },
      highlights: mark({}),
      operation: "init",
      description: "Start merge sort — divide, then conquer by merging.",
    });

    function rangeKinds(
      low: number,
      mid: number,
      high: number,
      mode: "split" | "merge" | "left" | "right" | "write",
      focus?: number,
    ) {
      const kinds: Record<number, "left" | "right" | "merged" | "comparing" | "write"> =
        {};
      for (let i = low; i <= mid; i++) kinds[i] = mode === "right" ? "left" : "left";
      for (let i = mid + 1; i <= high; i++) kinds[i] = "right";
      if (mode === "merge" || mode === "split") {
        // keep left/right coloring
      }
      if (focus !== undefined) {
        kinds[focus] = mode === "write" ? "write" : "comparing";
      }
      if (mode === "write" && focus !== undefined) {
        for (let i = low; i <= high; i++) {
          if (i !== focus) kinds[i] = "merged";
        }
        kinds[focus] = "write";
      }
      return kinds;
    }

    function merge(low: number, mid: number, high: number) {
      const left = nums.slice(low, mid + 1);
      const right = nums.slice(mid + 1, high + 1);
      let i = 0;
      let j = 0;
      let k = low;

      b.emit({
        line: 6,
        variables: { low, mid, high },
        structures: { array: [...nums] },
        highlights: mark(rangeKinds(low, mid, high, "merge")),
        operation: "merge",
        description: `Merge [${low}..${mid}] with [${mid + 1}..${high}].`,
      });

      while (i < left.length && j < right.length) {
        b.emit({
          line: 7,
          variables: { low, mid, high, leftVal: left[i], rightVal: right[j] },
          structures: { array: [...nums] },
          highlights: mark(rangeKinds(low, mid, high, "merge", k)),
          operation: "compare",
          description: `Compare ${left[i]} (left) with ${right[j]} (right).`,
        });

        if (left[i] <= right[j]) {
          nums[k] = left[i++];
        } else {
          nums[k] = right[j++];
        }

        b.emit({
          line: 8,
          variables: { low, mid, high, k, written: nums[k] },
          structures: { array: [...nums] },
          highlights: mark(rangeKinds(low, mid, high, "write", k)),
          operation: "write",
          description: `Write ${nums[k]} into index ${k}.`,
        });
        k++;
      }

      while (i < left.length) {
        nums[k] = left[i++];
        b.emit({
          line: 9,
          variables: { k, written: nums[k] },
          structures: { array: [...nums] },
          highlights: mark(rangeKinds(low, mid, high, "write", k)),
          operation: "write",
          description: `Drain left remainder → index ${k}.`,
        });
        k++;
      }

      while (j < right.length) {
        nums[k] = right[j++];
        b.emit({
          line: 10,
          variables: { k, written: nums[k] },
          structures: { array: [...nums] },
          highlights: mark(rangeKinds(low, mid, high, "write", k)),
          operation: "write",
          description: `Drain right remainder → index ${k}.`,
        });
        k++;
      }
    }

    function sort(low: number, high: number) {
      if (low >= high) return;
      const mid = Math.floor((low + high) / 2);
      b.emit({
        line: 2,
        variables: { low, mid, high },
        structures: { array: [...nums] },
        highlights: mark(rangeKinds(low, mid, high, "split")),
        operation: "split",
        description: `Split [${low}..${high}] at mid ${mid}.`,
      });
      sort(low, mid);
      sort(mid + 1, high);
      merge(low, mid, high);
    }

    sort(0, nums.length - 1);

    b.emit({
      line: 12,
      variables: {},
      structures: { array: [...nums] },
      highlights: mark(
        {},
        Array.from({ length: nums.length }, (_, i) => i),
      ),
      operation: "done",
      description: "Merge Sort complete.",
    });

    return b.build();
  },
};
