/**
 * Core public surface — framework-agnostic.
 *
 * Prefer deep imports (`@/core/trace`, `@/core/events`, …) in app code.
 * This barrel is for discoverability; avoid star-exporting overlapping names.
 */
export {
  TRACE_VERSION,
  TRACE_EVENT_TYPES,
  reduceTrace,
  TracePlayer,
  parseTrace,
  serializeTrace,
  validateTrace,
  TraceValidationError,
  TraceRecorder,
} from "./trace";
export type {
  TraceDocument,
  Frame,
  TraceEvent,
  TraceEventType,
} from "./trace";

export {
  EventRecorder,
  eventsToStates,
  applyEvent,
  createEmptyFrame,
} from "./events";
export type { ExecutionEvent, ExecutionEventType, EventMeta } from "./events";

export { TimelineController } from "./player";
export { BASE_STEP_MS, stepIntervalMs, clampStep } from "./scheduler";
