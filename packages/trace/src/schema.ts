/**
 * Trace document envelope — the portable, language-independent unit of work.
 */

import type { TraceEvent } from "./events";

export const TRACE_VERSION = "0.1" as const;

export type TraceVersion = typeof TRACE_VERSION;

export interface TraceSource {
  /** Original file path, if known. */
  path?: string;
  /** Full source text for code highlighting in clients. */
  code?: string;
}

export interface TraceInitialState {
  /**
   * Explicit array structure bootstrap for v0.1.
   * Required whenever `metadata.initial` is present.
   * Never inferred from `assign` or variable names.
   */
  array: (number | string)[];
}

export interface TraceMetadata {
  /** Structure bootstrap. Required by validateTrace for v0.1 array traces. */
  initial: TraceInitialState;
  [key: string]: unknown;
}

/**
 * Canonical AlgoVerse Trace Document.
 *
 * Clients (web, CLI, VSCode) load this JSON. The `language` field is metadata
 * only — renderers must ignore it.
 *
 * v0.1: `metadata.initial.array` is the only structure bootstrap path.
 * `assign` events never seed or mutate `structures`.
 */
export interface TraceDocument {
  version: TraceVersion;
  language: string;
  algorithm: string;
  source?: TraceSource;
  /** Required for a valid v0.1 document (enforced by validateTrace). */
  metadata: TraceMetadata;
  events: TraceEvent[];
}

/**
 * Absolute visual/runtime snapshot after applying one event.
 * Shape is intentionally compatible with the web app's ExecutionState.
 */
export interface FrameHighlights {
  nodes: string[];
  edges: string[];
  indices: number[];
  indexKinds?: Record<number, string>;
  sorted?: number[];
}

export interface FrameStructures {
  array?: (number | string)[];
  [key: string]: unknown;
}

export interface Frame {
  step: number;
  line: number;
  algorithm: string;
  variables: Record<string, unknown>;
  structures: FrameStructures;
  highlights: FrameHighlights;
  operation: string;
  description: string;
  /** Call stack after this event (frame names, oldest → newest). */
  callStack: string[];
}
