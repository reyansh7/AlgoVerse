/**
 * Learn-mode execution events (extended vocabulary used by ReferenceSolutions).
 * Portable Trace v0.1 events live in `@algoverse/trace` / `@/core/trace`.
 */
export type { ExecutionEvent, ExecutionEventType, EventMeta } from "./types";
export { EventRecorder } from "./recorder";
export {
  eventsToStates,
  applyEvent,
  createEmptyFrame,
  type FrameState,
} from "./reduce";
