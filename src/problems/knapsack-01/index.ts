import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { knapsackDp } from "./solutions/dp";

export const problemKnapsack: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 0/1 Knapsack

Maximize value without exceeding capacity; each item at most once.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [knapsackDp],
};
