import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { bruteForceTwoSum } from "./solutions/brute-force";
import { hashmapTwoSum } from "./solutions/hashmap";

export const problem1: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 1. Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [bruteForceTwoSum, hashmapTwoSum],
};
