"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
  Keyboard,
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useTraceStore } from "@/store/traceStore";
import { useTracePlaybackClock } from "@/hooks/useTracePlaybackClock";
import { buildMoments } from "@/engine/timeline/buildMoments";
import { MomentTimeline } from "./MomentTimeline";
import { cn } from "@/lib/cn";

const SPEEDS: { value: number; label: string }[] = [
  { value: 0.25, label: "0.25×" },
  { value: 0.5, label: "0.5×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 4, label: "4×" },
  { value: 16, label: "∞" },
];

/** Playback chrome bound to the Trace playerStore. */
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

  const events = useTraceStore((s) => s.document?.events);
  const [showKeys, setShowKeys] = useState(false);

  const total = frames.length;
  const max = Math.max(0, total - 1);
  const empty = total === 0;

  const moments = useMemo(
    () => buildMoments(events ?? []),
    [events],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (empty) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) jump(Math.min(max, currentStep + 10));
        else next();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) jump(Math.max(0, currentStep - 10));
        else prev();
      } else if (e.code === "Home") {
        e.preventDefault();
        jump(0);
      } else if (e.code === "End") {
        e.preventDefault();
        jump(max);
      } else if (e.key === "[" ) {
        const idx = SPEEDS.findIndex((s) => s.value === speed);
        if (idx > 0) setSpeed(SPEEDS[idx - 1]!.value);
      } else if (e.key === "]") {
        const idx = SPEEDS.findIndex((s) => s.value === speed);
        if (idx >= 0 && idx < SPEEDS.length - 1) setSpeed(SPEEDS[idx + 1]!.value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    toggle,
    next,
    prev,
    empty,
    jump,
    max,
    currentStep,
    speed,
    setSpeed,
  ]);

  const btn =
    "rounded-lg p-2 text-text-muted transition hover:bg-white/5 hover:text-text-primary disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl px-4 py-3">
      <MomentTimeline
        moments={moments}
        currentStep={currentStep}
        total={total}
        onJump={jump}
        disabled={empty}
      />

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
          {empty ? "—" : `Step ${currentStep + 1} / ${total}`}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSpeed(s.value)}
              disabled={empty}
              aria-pressed={speed === s.value}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[10px] transition disabled:opacity-30",
                speed === s.value
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowKeys((v) => !v)}
            className={btn}
            aria-label="Keyboard shortcuts"
            aria-pressed={showKeys}
          >
            <Keyboard className="h-4 w-4" />
          </button>
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
        aria-label="Scrub timeline"
      />

      {showKeys && (
        <p className="text-[10px] leading-relaxed text-text-muted">
          Space play/pause · ← → step · Shift+←/→ ±10 · Home/End · [ ] speed
        </p>
      )}
    </div>
  );
}
