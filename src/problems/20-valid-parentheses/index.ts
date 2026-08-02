import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { validParenthesesStack } from "./solutions/stack";

export const problem20: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 20. Valid Parentheses

Determine if a string of brackets is valid using a stack.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [validParenthesesStack],
};
