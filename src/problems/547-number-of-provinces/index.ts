import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { unionFindProvinces } from "./solutions/union-find";

export const problem547: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# 547. Number of Provinces

Count connected components (provinces) with Union-Find.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [unionFindProvinces],
};
