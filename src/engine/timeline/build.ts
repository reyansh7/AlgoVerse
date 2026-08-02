import { createId } from "@/lib/id";
import type { Timeline } from "@/core/types/execution";
import type { ExecutionEvent } from "../events/types";
import { eventsToStates } from "../events/reduce";

export interface EventTimeline extends Timeline {
  events: ExecutionEvent[];
}

/** Convert execution events into a scrubbable timeline. */
export function buildTimelineFromEvents(
  algorithmId: string,
  input: unknown,
  events: ExecutionEvent[],
): EventTimeline {
  const states = eventsToStates(algorithmId, events);
  return {
    id: createId("timeline"),
    algorithmId,
    input,
    states,
    events,
    createdAt: Date.now(),
  };
}
