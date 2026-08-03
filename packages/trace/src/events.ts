/**
 * AlgoVerse Trace v0.1 — public event vocabulary.
 *
 * Exactly seven event types. Emitters (Python, TS, …) must produce these.
 * Renderers never see events — they consume frames produced by reduce().
 */

/** Semantic highlight roles used by array (and later structure) views. */
export type HighlightKind =
  | "comparing"
  | "swapped"
  | "selected"
  | "sorted"
  | "pivot"
  | "found"
  | "current"
  | "searching"
  | "left"
  | "right"
  | "merged"
  | "minimum"
  | "active"
  | "visited"
  | "write";

export type TraceEventType =
  | "assign"
  | "compare"
  | "swap"
  | "call"
  | "return"
  | "line"
  | "highlight";

interface TraceEventBase {
  /** Monotonic clock within the trace (emitter-defined units). */
  timestamp: number;
  /** Optional 1-based source line; mirrored onto the frame. */
  line?: number;
  /** Optional human narration for this step. */
  description?: string;
}

/** Bind a name to a value. Pure variable assignment — never seeds structures. */
export interface AssignEvent extends TraceEventBase {
  type: "assign";
  data: {
    name: string;
    value: unknown;
  };
}

/** Compare two array indices (and optional raw values). */
export interface CompareEvent extends TraceEventBase {
  type: "compare";
  data: {
    i: number;
    j: number;
    values?: unknown[];
  };
}

/** Swap two array indices in place. */
export interface SwapEvent extends TraceEventBase {
  type: "swap";
  data: {
    i: number;
    j: number;
  };
}

/** Enter a named call frame (stack depth +1). */
export interface CallEvent extends TraceEventBase {
  type: "call";
  data: {
    frame: string;
    args?: Record<string, unknown>;
  };
}

/** Leave a named call frame (stack depth -1). */
export interface ReturnEvent extends TraceEventBase {
  type: "return";
  data: {
    frame: string;
    value?: unknown;
  };
}

/** Explicit program-counter update without other side effects. */
export interface LineEvent extends TraceEventBase {
  type: "line";
  data: {
    line: number;
  };
}

/** Update visual highlights on array indices. */
export interface HighlightEvent extends TraceEventBase {
  type: "highlight";
  data: {
    indices?: number[];
    /** Keys are stringified indices (JSON-friendly). */
    kinds?: Record<string, string>;
    sorted?: number[];
    clear?: boolean;
  };
}

export type TraceEvent =
  | AssignEvent
  | CompareEvent
  | SwapEvent
  | CallEvent
  | ReturnEvent
  | LineEvent
  | HighlightEvent;

export const TRACE_EVENT_TYPES: readonly TraceEventType[] = [
  "assign",
  "compare",
  "swap",
  "call",
  "return",
  "line",
  "highlight",
] as const;
