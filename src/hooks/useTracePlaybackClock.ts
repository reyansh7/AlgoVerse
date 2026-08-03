"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { stepIntervalMs } from "@/core/scheduler";

/** rAF clock for Trace Player — mirrors usePlaybackClock for Learn mode. */
export function useTracePlaybackClock() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const speed = usePlayerStore((s) => s.speed);
  const frameCount = usePlayerStore((s) => s.frames.length);

  useEffect(() => {
    if (!isPlaying || frameCount === 0) return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      acc += now - last;
      last = now;
      const stepMs = stepIntervalMs(usePlayerStore.getState().speed);

      while (acc >= stepMs) {
        acc -= stepMs;
        const store = usePlayerStore.getState();
        if (!store.isPlaying || store.frames.length === 0) return;
        if (store.currentStep >= store.frames.length - 1) {
          store.pause();
          return;
        }
        store.next();
      }

      if (!usePlayerStore.getState().isPlaying) return;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, frameCount]);
}
