import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { reverseListIterative, reverseListRecursive } from "./solutions/iterative";

export const problem206: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 206. Reverse Linked List

Reverse a singly linked list.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [reverseListIterative, reverseListRecursive],
};
