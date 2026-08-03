/**
 * Reduce a TraceDocument into absolute Frame snapshots (one frame per event).
 */

import type { TraceEvent } from "./events";
import type { Frame, FrameHighlights, FrameStructures, TraceDocument } from "./schema";

interface MutableFrame {
  line: number;
  variables: Record<string, unknown>;
  structures: FrameStructures;
  highlights: FrameHighlights;
  operation: string;
  description: string;
  callStack: string[];
}

function emptyHighlights(sorted: number[] = []): FrameHighlights {
  return {
    nodes: [],
    edges: [],
    indices: [],
    indexKinds: {},
    sorted: [...sorted],
  };
}

function createMutableFrame(doc: TraceDocument): MutableFrame {
  const initialArray = doc.metadata.initial.array;
  return {
    line: 0,
    variables: {},
    structures: { array: [...initialArray] },
    highlights: emptyHighlights(),
    operation: "init",
    description: "",
    callStack: [],
  };
}

function cloneFrame(frame: MutableFrame, step: number, algorithm: string): Frame {
  return {
    step,
    line: frame.line,
    algorithm,
    variables: { ...frame.variables },
    structures: {
      ...frame.structures,
      array: frame.structures.array ? [...frame.structures.array] : undefined,
    },
    highlights: {
      nodes: [...frame.highlights.nodes],
      edges: [...frame.highlights.edges],
      indices: [...frame.highlights.indices],
      indexKinds: { ...(frame.highlights.indexKinds ?? {}) },
      sorted: [...(frame.highlights.sorted ?? [])],
    },
    operation: frame.operation,
    description: frame.description,
    callStack: [...frame.callStack],
  };
}

function parseKinds(
  kinds: Record<string, string> | undefined,
): Record<number, string> {
  const out: Record<number, string> = {};
  if (!kinds) return out;
  for (const [k, v] of Object.entries(kinds)) {
    const i = Number(k);
    if (!Number.isNaN(i)) out[i] = v;
  }
  return out;
}

/** Apply one TraceEvent onto a mutable frame (in place). */
export function applyTraceEvent(frame: MutableFrame, event: TraceEvent): void {
  if (event.line !== undefined) frame.line = event.line;
  if (event.description !== undefined) frame.description = event.description;
  frame.operation = event.type;

  switch (event.type) {
    case "assign": {
      // Pure variable bind — never seeds or mutates structures.
      const { name, value } = event.data;
      frame.variables[name] = value;
      break;
    }
    case "compare": {
      const { i, j, values } = event.data;
      frame.variables.__compare = { i, j, values };
      frame.highlights = {
        ...emptyHighlights(frame.highlights.sorted),
        indices: [i, j],
        indexKinds: { [i]: "comparing", [j]: "comparing" },
      };
      if (!frame.description) {
        const left = values?.[0] ?? frame.structures.array?.[i];
        const right = values?.[1] ?? frame.structures.array?.[j];
        frame.description = `Compare indices ${i} and ${j}` +
          (left !== undefined && right !== undefined
            ? ` (${String(left)} vs ${String(right)})`
            : ".");
      }
      break;
    }
    case "swap": {
      const { i, j } = event.data;
      const arr = frame.structures.array;
      if (arr) {
        const next = [...arr];
        const tmp = next[i];
        next[i] = next[j];
        next[j] = tmp;
        // Mutate structure only; variables update solely via assign.
        frame.structures = { ...frame.structures, array: next };
      }
      frame.highlights = {
        ...emptyHighlights(frame.highlights.sorted),
        indices: [i, j],
        indexKinds: { [i]: "swapped", [j]: "swapped" },
      };
      if (!frame.description) {
        frame.description = `Swap indices ${i} and ${j}.`;
      }
      break;
    }
    case "call": {
      frame.callStack.push(event.data.frame);
      frame.variables.__callStack = [...frame.callStack];
      if (event.data.args) {
        for (const [k, v] of Object.entries(event.data.args)) {
          frame.variables[k] = v;
        }
      }
      if (!frame.description) {
        frame.description = `Call ${event.data.frame}`;
      }
      break;
    }
    case "return": {
      const top = frame.callStack[frame.callStack.length - 1];
      if (top === event.data.frame || frame.callStack.length > 0) {
        // Pop matching frame, or last if names diverge slightly.
        const idx = frame.callStack.lastIndexOf(event.data.frame);
        if (idx >= 0) frame.callStack.splice(idx, 1);
        else frame.callStack.pop();
      }
      frame.variables.__callStack = [...frame.callStack];
      if (event.data.value !== undefined) {
        frame.variables.result = event.data.value;
      }
      if (!frame.description) {
        frame.description =
          event.data.value !== undefined
            ? `Return from ${event.data.frame}: ${JSON.stringify(event.data.value)}`
            : `Return from ${event.data.frame}`;
      }
      break;
    }
    case "line": {
      frame.line = event.data.line;
      break;
    }
    case "highlight": {
      const { indices, kinds, sorted, clear } = event.data;
      if (clear) {
        frame.highlights = emptyHighlights(sorted ?? []);
      } else {
        const indexKinds = parseKinds(kinds);
        const idx =
          indices ??
          Object.keys(indexKinds).map(Number).filter((n) => !Number.isNaN(n));
        frame.highlights = {
          nodes: [],
          edges: [],
          indices: idx,
          indexKinds,
          sorted: sorted ?? frame.highlights.sorted ?? [],
        };
      }
      break;
    }
    default: {
      const _exhaustive: never = event;
      void _exhaustive;
    }
  }
}

/**
 * Materialize one absolute Frame per event.
 * Array structure is seeded only from metadata.initial.array (see validateTrace).
 */
export function reduceTrace(doc: TraceDocument): Frame[] {
  const frame = createMutableFrame(doc);
  const frames: Frame[] = [];

  for (let i = 0; i < doc.events.length; i++) {
    applyTraceEvent(frame, doc.events[i]);
    frames.push(cloneFrame(frame, i, doc.algorithm));
  }

  return frames;
}
