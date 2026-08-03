"use client";

import { useEffect } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useTracePlaybackClock } from "@/hooks/useTracePlaybackClock";
import { cn } from "@/lib/cn";

const SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3];

/** Playback chrome bound to the Trace playerStore (not Learn playback-store). */
export function TracePlaybackControls() {
  useTracePlaybackClock();

  const frames = usePlayerStore((s) => s.frames);
  const currentStep = usePlayerStore((s) => s.currentStep);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const speed = usePlayerStore((s) => s.speed);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const restart = usePlayerStore((s) => s.restart);
  const jump = usePlayerStore((s) => s.jump);
  const setSpeed = usePlayerStore((s) => s.setSpeed);

  const total = frames.length;
  const max = Math.max(0, total - 1);
  const empty = total === 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (empty) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") {
        next();
      } else if (e.code === "ArrowLeft") {
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, next, prev, empty]);

  const btn =
    "rounded-lg p-2 text-text-muted transition hover:bg-white/5 hover:text-text-primary disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={restart}
            disabled={empty}
            className={btn}
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => jump(0)}
            disabled={empty}
            className={btn}
            aria-label="First"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={prev}
            disabled={empty}
            className={btn}
            aria-label="Previous"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => (isPlaying ? pause() : play())}
            disabled={empty}
            className="rounded-xl bg-accent p-2.5 text-bg-deep transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-30"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={empty}
            className={btn}
            aria-label="Next"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => jump(max)}
            disabled={empty}
            className={btn}
            aria-label="Last"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>

        <div className="font-mono text-xs text-text-muted">
          {empty ? "—" : `${currentStep + 1} / ${total}`}
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              disabled={empty}
              aria-pressed={speed === s}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[10px] transition disabled:opacity-30",
                speed === s
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(currentStep, max)}
        onChange={(e) => jump(Number(e.target.value))}
        disabled={empty}
        className="w-full accent-accent"
        aria-label="Timeline"
      />
      <p className="text-[10px] text-text-muted">
        Shortcuts: Space play/pause · ← → step
      </p>
    </div>
  );
}
