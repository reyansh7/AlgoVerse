import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { fenwickTreeSolution } from "./solutions/bit";

export const problemFenwick: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Fenwick Tree

Binary Indexed Tree for prefix sums and point updates.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [fenwickTreeSolution],
};
