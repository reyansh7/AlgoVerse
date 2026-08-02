import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { mergeSortSolution } from "./solutions/standard";

export const problemMergeSort: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Merge Sort

Divide the array into halves, sort each half recursively, then merge the sorted halves.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [mergeSortSolution],
};
