import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { kthLargestHeap, kthLargestSort } from "./solutions/heap";

export const problem215: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 215. Kth Largest Element in an Array

Return the k-th largest element in the array.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [kthLargestHeap, kthLargestSort],
};
