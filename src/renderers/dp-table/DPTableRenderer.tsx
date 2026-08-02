"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { ExecutionState } from "@/core/types/execution";
import { HIGHLIGHT_COLORS } from "@/lib/highlight-colors";

interface Props {
  state: ExecutionState | null;
}

export function DPTableRenderer({ state }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const table = state?.structures.table ?? [];
  const highlightFlat = new Set(state?.highlights.indices ?? []);
  const cols = table[0]?.length ?? 0;
  const step = state?.step;
  const operation = state?.operation ?? "";

  const activeColor =
    operation === "skip"
      ? HIGHLIGHT_COLORS.visited
      : operation === "done"
        ? HIGHLIGHT_COLORS.found
        : operation === "update"
          ? HIGHLIGHT_COLORS.write
          : HIGHLIGHT_COLORS.comparing;

  useLayoutEffect(() => {
    if (!ref.current || step === undefined) return;
    const active = ref.current.querySelectorAll<HTMLElement>(
      "[data-active='true']",
    );
    if (!active.length) return;

    gsap.killTweensOf(active);
    gsap.fromTo(
      active,
      { scale: 0.72 },
      {
        scale: 1.12,
        duration: 0.28,
        ease: "back.out(2)",
        yoyo: true,
        repeat: 1,
        overwrite: "auto",
      },
    );
  }, [step]);

  if (!table.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-text-muted">
        No DP table in current state
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 overflow-auto p-6"
    >
      <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: HIGHLIGHT_COLORS.comparing }}
          />
          evaluate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: HIGHLIGHT_COLORS.write }}
          />
          update
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: HIGHLIGHT_COLORS.found }}
          />
          answer
        </span>
      </div>

      <div className="inline-flex flex-col gap-1">
        <div className="mb-1 flex gap-1 pl-9">
          {Array.from({ length: cols }, (_, c) => (
            <span
              key={c}
              className="w-10 text-center font-mono text-[10px] text-text-muted"
            >
              w{c}
            </span>
          ))}
        </div>
        {table.map((row, r) => (
          <div key={r} className="flex items-center gap-1">
            <span className="w-8 text-right font-mono text-[10px] text-text-muted">
              i{r}
            </span>
            {row.map((cell, c) => {
              const active = highlightFlat.has(r * cols + c);
              const filled = cell !== 0 && cell != null;
              return (
                <div
                  key={c}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-xs tabular-nums will-change-transform",
                    "transition-[background-color,border-color,color] duration-300",
                  )}
                  style={
                    active
                      ? {
                          borderColor: activeColor,
                          backgroundColor: `${activeColor}33`,
                          color: activeColor,
                          boxShadow: `0 0 16px ${activeColor}55`,
                        }
                      : filled
                        ? {
                            borderColor: "rgba(52,211,153,0.25)",
                            backgroundColor: "rgba(52,211,153,0.08)",
                            color: "#e8eef7",
                          }
                        : undefined
                  }
                >
                  {cell ?? "·"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
