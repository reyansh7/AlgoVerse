import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { dfsIterative, dfsRecursive } from "./solutions/recursive";

export const problemDfs: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Depth-First Search

Explore as far as possible along each branch before backtracking.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [dfsRecursive, dfsIterative],
};
