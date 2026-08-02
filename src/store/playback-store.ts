"use client";

import { create } from "zustand";
import { diffStates, type StateDiff } from "@/core/animation/diff";
import { runAlgorithm } from "@/core/execution/engine";
import { runSolution } from "@/engine/execution/run-solution";
import type { ReferenceSolution } from "@/problems/types";
import type { ExecutionState, Timeline } from "@/core/types/execution";

interface PlaybackState {
  timeline: Timeline | null;
  currentStep: number;
  isPlaying: boolean;
  speed: number;
  loadTimeline: (timeline: Timeline) => void;
  run: (algorithmId: string, input: unknown) => Timeline;
  /** Run a curated reference solution (Learn mode) — never user code. */
  runSolution: (solution: ReferenceSolution, input: unknown) => Timeline;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  next: () => void;
  prev: () => void;
  jump: (step: number) => void;
  setSpeed: (speed: number) => void;
  current: () => ExecutionState | null;
  previous: () => ExecutionState | null;
  diff: () => StateDiff | null;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  timeline: null,
  currentStep: 0,
  isPlaying: false,
  speed: 1,

  loadTimeline: (timeline) =>
    set({ timeline, currentStep: 0, isPlaying: false }),

  run: (algorithmId, input) => {
    const timeline = runAlgorithm(algorithmId, input);
    set({ timeline, currentStep: 0, isPlaying: false });
    return timeline;
  },

  runSolution: (solution, input) => {
    const timeline = runSolution(solution, input);
    set({ timeline, currentStep: 0, isPlaying: false });
    return timeline;
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

  restart: () => set({ currentStep: 0, isPlaying: false }),

  next: () =>
    set((s) => {
      if (!s.timeline) return s;
      const max = s.timeline.states.length - 1;
      const nextStep = Math.min(s.currentStep + 1, max);
      return {
        currentStep: nextStep,
        isPlaying: nextStep < max ? s.isPlaying : false,
      };
    }),

  prev: () =>
    set((s) => ({
      currentStep: Math.max(0, s.currentStep - 1),
      isPlaying: false,
    })),

  jump: (step) =>
    set((s) => {
      if (!s.timeline) return s;
      const max = Math.max(0, s.timeline.states.length - 1);
      return {
        currentStep: Math.max(0, Math.min(step, max)),
        isPlaying: false,
      };
    }),

  setSpeed: (speed) => set({ speed }),

  current: () => {
    const { timeline, currentStep } = get();
    return timeline?.states[currentStep] ?? null;
  },

  previous: () => {
    const { timeline, currentStep } = get();
    if (!timeline || currentStep <= 0) return null;
    return timeline.states[currentStep - 1] ?? null;
  },

  diff: () => diffStates(get().previous(), get().current()),
}));
