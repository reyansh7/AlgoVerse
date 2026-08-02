import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { inorderIterative, inorderRecursive } from "./solutions/recursive";

export const problem94: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 94. Binary Tree Inorder Traversal

Return the inorder traversal of a binary tree (Left → Root → Right).`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [inorderRecursive, inorderIterative],
};
