import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export interface KnapsackInput {
  weights: number[];
  values: number[];
  capacity: number;
}

export const knapsackDp: ReferenceSolution<KnapsackInput> = {
  id: "knapsack-dp",
  name: "DP Table",
  approach: "optimal",
  timeComplexity: "O(nW)",
  spaceComplexity: "O(nW)",
  code: `function knapsack(weights, values, W) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
      }
    }
  }
  return dp[n][W];
}`,
  execute({ weights, values, capacity }) {
    const r = new EventRecorder("knapsack-dp");
    const n = weights.length;
    const W = capacity;
    const dp: (number | null)[][] = Array.from({ length: n + 1 }, () =>
      Array(W + 1).fill(0),
    );
    r.setStructure({ table: dp.map((row) => [...row]) }, { description: "Fill 0/1 knapsack DP table." });
    r.updateVariable("capacity", W);

    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        dp[i][w] = dp[i - 1][w];
        if (weights[i - 1] <= w) {
          dp[i][w] = Math.max(
            dp[i][w] as number,
            (dp[i - 1][w - weights[i - 1]] as number) + values[i - 1],
          );
        }
        r.setStructure({ table: dp.map((row) => [...row]) });
        r.updateVariable("i", i);
        r.updateVariable("w", w, {
          description: `dp[${i}][${w}] = ${dp[i][w]} (item weight ${weights[i - 1]}, value ${values[i - 1]}).`,
        });
      }
    }
    const ans = dp[n][W];
    r.returnValue(ans);
    r.done(ans);
    return r.getEvents();
  },
};
