import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { segmentTreeBuild } from "./solutions/build";

export const problemSegmentTree: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Segment Tree (Range Sum)

Build a segment tree and answer a range-sum query.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [segmentTreeBuild],
};
