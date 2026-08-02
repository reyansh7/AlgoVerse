import type { StateDiff } from "./diff";

/**
 * Algorithm-agnostic animation hints derived from state diffs.
 * Renderers consume these; this module never contains algorithm logic.
 */
export interface AnimationPlan {
  pulseIndices: number[];
  pulseNodes: string[];
  pulseEdges: string[];
  swap: [number, number] | null;
  emphasizeOperation: string;
}

export function planAnimation(diff: StateDiff | null): AnimationPlan {
  if (!diff) {
    return {
      pulseIndices: [],
      pulseNodes: [],
      pulseEdges: [],
      swap: null,
      emphasizeOperation: "",
    };
  }

  return {
    pulseIndices: diff.highlights.indices,
    pulseNodes: diff.highlights.nodes,
    pulseEdges: diff.highlights.edges,
    swap: diff.swappedIndices,
    emphasizeOperation: diff.operation,
  };
}
