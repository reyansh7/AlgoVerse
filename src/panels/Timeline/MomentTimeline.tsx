"use client";

import { useMemo } from "react";
import type { ExecutionMoment } from "@/engine/timeline/buildMoments";
import { momentAt } from "@/engine/timeline/buildMoments";
import { MOMENT_COLORS } from "@/lib/visual-language";
import { cn } from "@/lib/cn";

interface Props {
  moments: ExecutionMoment[];
  currentStep: number;
  total: number;
  onJump: (step: number) => void;
  disabled?: boolean;
}

/**
 * Chaptered execution progress — one segment per inferred moment.
 * Clicking a segment seeks to its start event index.
 */
export function MomentTimeline({
  moments,
  currentStep,
  total,
  onJump,
  disabled,
}: Props) {
  const active = useMemo(
    () => momentAt(moments, currentStep),
    [moments, currentStep],
  );

  if (total <= 0 || moments.length === 0) {
    return (
      <div className="h-2 rounded-full bg-white/5" aria-hidden />
    );
  }

  const max = Math.max(total - 1, 1);

  return (
    <div className="space-y-2">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-white/10"
        role="group"
        aria-label="Execution moments"
      >
        {moments.map((m) => {
          const widthPct = ((m.end - m.start + 1) / total) * 100;
          const isActive = active?.id === m.id;
          const isPast = currentStep > m.end;
          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              title={`${m.label} (steps ${m.start + 1}–${m.end + 1})`}
              aria-label={`${m.label}, steps ${m.start + 1} to ${m.end + 1}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onJump(m.start)}
              className={cn(
                "relative h-full min-w-[4px] transition-opacity disabled:opacity-40",
                isActive ? "opacity-100" : isPast ? "opacity-70" : "opacity-45",
                "hover:opacity-100",
              )}
              style={{
                width: `${widthPct}%`,
                backgroundColor: MOMENT_COLORS[m.kind],
              }}
            />
          );
        })}
      </div>

      {/* Playhead */}
      <div className="relative h-1">
        <div
          className="absolute top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(46,230,166,0.6)]"
          style={{
            left: `${(Math.min(currentStep, max) / max) * 100}%`,
          }}
          aria-hidden
        />
      </div>

      {active && (
        <p className="truncate font-mono text-[10px] text-text-muted">
          <span className="text-text-primary/80">{active.label}</span>
          {" · "}
          steps {active.start + 1}–{active.end + 1}
        </p>
      )}
    </div>
  );
}
