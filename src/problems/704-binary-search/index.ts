import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { iterativeBinarySearch } from "./solutions/iterative";
import { recursiveBinarySearch } from "./solutions/recursive";

const statement = `# 704. Binary Search

Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

## Constraints

- \`1 <= nums.length <= 10^4\`
- \`-10^4 < nums[i], target < 10^4\`
- All integers in \`nums\` are **unique**
- \`nums\` is sorted in ascending order

## Examples

**Example 1**

- Input: \`nums = [-1,0,3,5,9,12]\`, \`target = 9\`
- Output: \`4\`

**Example 2**

- Input: \`nums = [-1,0,3,5,9,12]\`, \`target = 2\`
- Output: \`-1\`
`;

export const problem704: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [iterativeBinarySearch, recursiveBinarySearch],
};
