import type { ExecutionState, HighlightKind, Structures } from "@/core/types/execution";
import type { Frame, FrameStructures } from "@/core/trace";

const KINDS = new Set<string>([
  "comparing",
  "swapped",
  "selected",
  "sorted",
  "pivot",
  "found",
  "current",
  "searching",
  "left",
  "right",
  "merged",
  "minimum",
  "active",
  "visited",
  "write",
]);

function asHighlightKind(v: string): HighlightKind {
  return (KINDS.has(v) ? v : "active") as HighlightKind;
}

/**
 * Map Trace Frame.structures → web Structures by key presence.
 * No algorithm / language logic — pass through known structure shapes only.
 */
function structuresFromFrame(s: FrameStructures): Structures {
  const out: Structures = {};
  if (Array.isArray(s.array)) {
    out.array = [...(s.array as (number | string)[])];
  }
  // Trace v0.2+ may emit tree/graph/etc.; clone when present without interpretation.
  if ("tree" in s && s.tree !== undefined) {
    out.tree = s.tree as Structures["tree"];
  }
  if (s.graph && typeof s.graph === "object") {
    out.graph = s.graph as Structures["graph"];
  }
  if (Array.isArray(s.queue)) {
    out.queue = [...(s.queue as (number | string)[])];
  }
  if (Array.isArray(s.stack)) {
    out.stack = [...(s.stack as (number | string)[])];
  }
  if (s.linkedList && typeof s.linkedList === "object") {
    out.linkedList = s.linkedList as Structures["linkedList"];
  }
  if (Array.isArray(s.table)) {
    out.table = s.table as Structures["table"];
  }
  if (s.hashmap && typeof s.hashmap === "object" && !Array.isArray(s.hashmap)) {
    out.hashmap = { ...(s.hashmap as Record<string, number | string | null>) };
  }
  return out;
}

/** Adapt a Trace Frame to the web ExecutionState renderer contract. */
export function frameToExecutionState(frame: Frame | null): ExecutionState | null {
  if (!frame) return null;
  const kinds = frame.highlights.indexKinds ?? {};
  const indexKinds: Record<number, HighlightKind> = {};
  for (const [k, v] of Object.entries(kinds)) {
    indexKinds[Number(k)] = asHighlightKind(String(v));
  }

  return {
    step: frame.step,
    line: frame.line,
    algorithm: frame.algorithm,
    variables: { ...frame.variables },
    structures: structuresFromFrame(frame.structures),
    highlights: {
      nodes: [...frame.highlights.nodes],
      edges: [...frame.highlights.edges],
      indices: [...frame.highlights.indices],
      indexKinds,
      sorted: frame.highlights.sorted ? [...frame.highlights.sorted] : [],
    },
    operation: frame.operation,
    description: frame.description,
    callStack: frame.callStack ? [...frame.callStack] : [],
  };
}
