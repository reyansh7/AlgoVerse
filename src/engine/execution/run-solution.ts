import type { Timeline } from "@/core/types/execution";
import type { ReferenceSolution } from "@/problems/types";
import { buildTimelineFromEvents } from "../timeline/build";

/** Run a curated reference solution — never user code. */
export function runSolution(
  solution: ReferenceSolution,
  input: unknown,
): Timeline {
  const events = solution.execute(input);
  return buildTimelineFromEvents(solution.id, input, events);
}
