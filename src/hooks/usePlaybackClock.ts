"use client";

import { useEffect } from "react";
import { usePlaybackStore } from "@/store/playback-store";

/** Base duration per step at 1x — long enough for cell/node tweens to read. */
const BASE_STEP_MS = 900;

/**
 * Drives timeline playback with rAF so step advances stay smooth and
 * interruptible when speed or play state changes.
 */
export function usePlaybackClock() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const timelineId = usePlaybackStore((s) => s.timeline?.id ?? null);

  useEffect(() => {
    if (!isPlaying || !timelineId) return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      acc += now - last;
      last = now;

      const stepMs = BASE_STEP_MS / usePlaybackStore.getState().speed;

      // Re-read state every iteration; the store object is replaced on each set()
      while (acc >= stepMs) {
        acc -= stepMs;
        const store = usePlaybackStore.getState();
        if (!store.isPlaying || !store.timeline) return;
        if (store.currentStep >= store.timeline.states.length - 1) {
          store.pause();
          return;
        }
        store.next();
      }

      if (!usePlaybackStore.getState().isPlaying) return;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, timelineId]);
}
