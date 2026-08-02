import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { twoPointersSolution } from "./solutions/two-pointers";

export const problem167: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 167. Two Sum II

Sorted array two-sum using opposing pointers.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [twoPointersSolution],
};
