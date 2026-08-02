import type { ProblemPackage } from "@/problems/types";
import metadata from "./metadata.json";
import testcases from "./testcases.json";
import { queueFifo } from "./solutions/fifo";

export const problemQueue: ProblemPackage = {
  metadata: metadata as ProblemPackage["metadata"],
  statement: `# Queue Operations

A queue is FIFO. Visualize enqueue and dequeue.`,
  testcases: testcases as ProblemPackage["testcases"],
  solutions: [queueFifo],
};
