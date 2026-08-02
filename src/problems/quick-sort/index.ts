import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { quickSortSolution } from "./solutions/standard";

export const problemQuickSort: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Quick Sort

Pick a pivot, partition elements around it, then recursively sort the partitions.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [quickSortSolution],
};
