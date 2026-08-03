/**
 * Engine public API.
 *
 * Event vocabulary for Learn solutions: prefer `@/core/events`.
 * Portable Trace: `@/core/trace` / `@algoverse/trace`.
 */
export type { ExecutionEvent, ExecutionEventType } from "@/core/events/types";
export { EventRecorder } from "@/core/events/recorder";
export {
  eventsToStates,
  applyEvent,
  createEmptyFrame,
} from "@/core/events/reduce";
export { buildTimelineFromEvents } from "./timeline/build";
export type { EventTimeline } from "./timeline/build";
export { runSolution } from "./execution/run-solution";
export { planStepAnimation } from "./animation/apply";
export { frameToExecutionState } from "./state";
