/**
 * Re-exports @algoverse/trace for the Next.js web client.
 * Import from here inside `src/` so the website never depends on event dialects.
 */

export {
  TRACE_VERSION,
  TRACE_EVENT_TYPES,
  reduceTrace,
  applyTraceEvent,
  TracePlayer,
  parseTrace,
  serializeTrace,
  validateTrace,
  TraceValidationError,
  TraceRecorder,
} from "@algoverse/trace";

export type {
  TraceDocument,
  TraceSource,
  TraceMetadata,
  TraceInitialState,
  TraceVersion,
  Frame,
  FrameHighlights,
  FrameStructures,
  TraceEvent,
  TraceEventType,
  HighlightKind,
  AssignEvent,
  CompareEvent,
  SwapEvent,
  CallEvent,
  ReturnEvent,
  LineEvent,
  HighlightEvent,
} from "@algoverse/trace";
