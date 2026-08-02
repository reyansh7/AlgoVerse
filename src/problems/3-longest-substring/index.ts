import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { slidingWindowSolution } from "./solutions/sliding-window";

export const problem3: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 3. Longest Substring Without Repeating Characters

Find the length of the longest substring without repeating characters.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [slidingWindowSolution],
};
