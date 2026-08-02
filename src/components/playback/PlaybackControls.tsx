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
import { usePlaybackStore } from "@/store/playback-store";
import { usePlaybackClock } from "@/hooks/usePlaybackClock";
import { cn } from "@/lib/cn";

const SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3];

export function PlaybackControls() {
  usePlaybackClock();

  const timeline = usePlaybackStore((s) => s.timeline);
  const currentStep = usePlaybackStore((s) => s.currentStep);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const play = usePlaybackStore((s) => s.play);
  const pause = usePlaybackStore((s) => s.pause);
  const toggle = usePlaybackStore((s) => s.toggle);
  const next = usePlaybackStore((s) => s.next);
  const prev = usePlaybackStore((s) => s.prev);
  const restart = usePlaybackStore((s) => s.restart);
  const jump = usePlaybackStore((s) => s.jump);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);

  const total = timeline?.states.length ?? 0;
  const max = Math.max(0, total - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
  }, [toggle, next, prev]);

  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="mb-3 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max || 0}
          value={currentStep}
          onChange={(e) => jump(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent"
          disabled={!timeline}
        />
        <span className="shrink-0 font-mono text-xs text-text-muted">
          {total ? currentStep + 1 : 0}/{total}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <ControlButton onClick={restart} label="Restart" disabled={!timeline}>
            <RotateCcw className="h-4 w-4" />
          </ControlButton>
          <ControlButton
            onClick={() => jump(0)}
            label="First step"
            disabled={!timeline}
          >
            <ChevronsLeft className="h-4 w-4" />
          </ControlButton>
          <ControlButton onClick={prev} label="Previous" disabled={!timeline}>
            <SkipBack className="h-4 w-4" />
          </ControlButton>
          <button
            type="button"
            onClick={() => (isPlaying ? pause() : play())}
            disabled={!timeline || total === 0}
            className="mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-bg-deep transition hover:brightness-110 disabled:opacity-40"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-0.5" />
            )}
          </button>
          <ControlButton onClick={next} label="Next" disabled={!timeline}>
            <SkipForward className="h-4 w-4" />
          </ControlButton>
          <ControlButton
            onClick={() => jump(max)}
            label="Last step"
            disabled={!timeline}
          >
            <ChevronsRight className="h-4 w-4" />
          </ControlButton>
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "rounded-lg px-2 py-1 font-mono text-xs transition",
                speed === s
                  ? "bg-white/15 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-glass bg-white/5 text-text-primary transition hover:bg-white/10 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
