/**
 * @algoverse/trace — public API
 *
 * Pure TypeScript. Zero React / DOM / GSAP.
 */

export { TRACE_VERSION } from "./schema";
export type {
  TraceDocument,
  TraceSource,
  TraceMetadata,
  TraceInitialState,
  TraceVersion,
  Frame,
  FrameHighlights,
  FrameStructures,
} from "./schema";

export { TRACE_EVENT_TYPES } from "./events";
export type {
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
} from "./events";

export { reduceTrace, applyTraceEvent } from "./reduce";
export { TracePlayer } from "./player";
export {
  parseTrace,
  serializeTrace,
  validateTrace,
  TraceValidationError,
} from "./serializer";
export { TraceRecorder } from "./recorder";
