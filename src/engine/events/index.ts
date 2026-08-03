/**
 * @deprecated Import from `@/core/events` — Learn event vocabulary moved to core.
 */
export type { ExecutionEvent, ExecutionEventType, EventMeta } from "@/core/events/types";
export { EventRecorder } from "@/core/events/recorder";
export {
  eventsToStates,
  applyEvent,
  createEmptyFrame,
  type FrameState,
} from "@/core/events/reduce";
