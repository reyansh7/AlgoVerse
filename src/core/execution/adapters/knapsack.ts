import type { AlgorithmAdapter } from "../../types/execution";
import { SnapshotBuilder } from "../snapshot";

export interface KnapsackInput {
  weights: number[];
  values: number[];
  capacity: number;
}

export const knapsackAdapter: AlgorithmAdapter<KnapsackInput> = {
  id: "knapsack",
  execute({ weights, values, capacity }) {
    const b = new SnapshotBuilder("knapsack");
    const n = weights.length;
    const dp: (number | null)[][] = Array.from({ length: n + 1 }, () =>
      Array.from({ length: capacity + 1 }, () => 0),
    );

    b.emit({
      line: 0,
      variables: { n, capacity },
      structures: { table: dp.map((r) => [...r]) },
      operation: "init",
      description: "Initialize DP table with zeros.",
    });

    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= capacity; w++) {
        const weight = weights[i - 1];
        const value = values[i - 1];

        b.emit({
          line: 2,
          variables: { i, w, weight, value, exclude: dp[i - 1][w] },
          structures: { table: dp.map((r) => [...r]) },
          highlights: { indices: [i * (capacity + 1) + w], nodes: [], edges: [] },
          operation: "transition",
          description: `Evaluate item ${i} at capacity ${w}.`,
        });

        if (weight > w) {
          dp[i][w] = dp[i - 1][w];
          b.emit({
            line: 3,
            variables: { i, w, result: dp[i][w] },
            structures: { table: dp.map((r) => [...r]) },
            highlights: {
              indices: [i * (capacity + 1) + w],
              nodes: [],
              edges: [],
            },
            operation: "skip",
            description: `Item too heavy — dp[${i}][${w}] = ${dp[i][w]}.`,
          });
        } else {
          const include = (dp[i - 1][w - weight] ?? 0) + value;
          const exclude = dp[i - 1][w] ?? 0;
          dp[i][w] = Math.max(include, exclude);
          b.emit({
            line: 5,
            variables: { i, w, include, exclude, result: dp[i][w] },
            structures: { table: dp.map((r) => [...r]) },
            highlights: {
              indices: [i * (capacity + 1) + w],
              nodes: [],
              edges: [],
            },
            operation: "update",
            description: `dp[${i}][${w}] = max(${include}, ${exclude}) = ${dp[i][w]}.`,
          });
        }
      }
    }

    b.emit({
      line: 7,
      variables: { answer: dp[n][capacity] },
      structures: { table: dp.map((r) => [...r]) },
      highlights: {
        indices: [n * (capacity + 1) + capacity],
        nodes: [],
        edges: [],
      },
      operation: "done",
      description: `Optimal value is ${dp[n][capacity]}.`,
    });

    return b.build();
  },
};
