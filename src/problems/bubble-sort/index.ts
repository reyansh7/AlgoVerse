import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { bubbleSortSolution } from "./solutions/standard";

export const problemBubbleSort: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Bubble Sort

Repeatedly compare adjacent elements and swap them if they are in the wrong order.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [bubbleSortSolution],
};
