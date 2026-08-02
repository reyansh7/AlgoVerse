import type { ExecutionEvent } from "../events/types";
import type { ExecutionState } from "@/core/types/execution";
import { diffStates } from "@/core/animation/diff";
import { planAnimation } from "@/core/animation/orchestrator";

/**
 * Animation engine entry: understands events/timeline frames only,
 * never algorithm names. Maps frame transitions to GSAP plans.
 */
export function planStepAnimation(
  previous: ExecutionState | null,
  current: ExecutionState | null,
  _event?: ExecutionEvent,
) {
  const diff = diffStates(previous, current);
  return planAnimation(diff);
}
