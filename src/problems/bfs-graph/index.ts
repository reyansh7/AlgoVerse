import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { bfsIterative } from "./solutions/iterative";

export const problemBfs: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Breadth-First Search

Explore a graph level by level using a queue.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [bfsIterative],
};
