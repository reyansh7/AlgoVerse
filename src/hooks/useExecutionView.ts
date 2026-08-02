"use client";

import { usePlaybackStore } from "@/store/playback-store";
import type { ExecutionState } from "@/core/types/execution";

/** Reactive view of the current / previous execution states. */
export function useExecutionView(): {
  state: ExecutionState | null;
  previous: ExecutionState | null;
  currentStep: number;
  totalSteps: number;
} {
  const currentStep = usePlaybackStore((s) => s.currentStep);
  const timeline = usePlaybackStore((s) => s.timeline);

  const state = timeline?.states[currentStep] ?? null;
  const previous =
    timeline && currentStep > 0
      ? (timeline.states[currentStep - 1] ?? null)
      : null;

  return {
    state,
    previous,
    currentStep,
    totalSteps: timeline?.states.length ?? 0,
  };
}
