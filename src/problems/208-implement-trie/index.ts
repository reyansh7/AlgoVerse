import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { trieInsert } from "./solutions/insert";

export const problem208: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 208. Implement Trie

Insert words into a prefix tree and visualize structure growth.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [trieInsert],
};
