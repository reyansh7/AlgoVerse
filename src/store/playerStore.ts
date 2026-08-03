"use client";

/**
 * React binding over @algoverse/trace TracePlayer.
 * Play/pause clock is owned here; pure seek math stays in packages/trace.
 */

import { create } from "zustand";
import { TracePlayer, type Frame, type TraceDocument } from "@/core/trace";

const player = new TracePlayer();

interface PlayerStoreState {
  frames: Frame[];
  currentStep: number;
  isPlaying: boolean;
  speed: number;
  load: (doc: TraceDocument) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  next: () => void;
  prev: () => void;
  jump: (step: number) => void;
  setSpeed: (speed: number) => void;
  current: () => Frame | null;
  previous: () => Frame | null;
  clear: () => void;
}

function syncFromPlayer(
  patch: Partial<PlayerStoreState> = {},
): Partial<PlayerStoreState> {
  return {
    frames: [...player.frames],
    currentStep: player.index,
    ...patch,
  };
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  frames: [],
  currentStep: 0,
  isPlaying: false,
  speed: 1,

  load: (doc) => {
    player.load(doc);
    set(syncFromPlayer({ isPlaying: false }));
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

  restart: () => {
    player.restart();
    set(syncFromPlayer({ isPlaying: false }));
  },

  next: () => {
    const max = Math.max(0, player.length - 1);
    player.next();
    set(
      syncFromPlayer({
        isPlaying: player.index < max ? get().isPlaying : false,
      }),
    );
  },

  prev: () => {
    player.previous();
    set(syncFromPlayer({ isPlaying: false }));
  },

  jump: (step) => {
    player.seek(step);
    set(syncFromPlayer({ isPlaying: false }));
  },

  setSpeed: (speed) => set({ speed }),

  current: () => player.currentFrame,
  previous: () => player.previousFrame,

  clear: () => {
    player.clear();
    set({ frames: [], currentStep: 0, isPlaying: false });
  },
}));
