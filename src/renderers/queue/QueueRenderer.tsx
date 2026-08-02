"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { ExecutionState } from "@/core/types/execution";

interface Props {
  state: ExecutionState | null;
  mode?: "queue" | "stack";
}

export function QueueStackRenderer({ state, mode = "queue" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const items =
    mode === "queue"
      ? (state?.structures.queue ?? [])
      : (state?.structures.stack ?? []);
  const step = state?.step;

  useLayoutEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll<HTMLElement>("[data-item]");
    if (!els.length) return;
    gsap.killTweensOf(els);
    gsap.fromTo(
      els,
      {
        x: mode === "queue" ? 16 : 0,
        y: mode === "stack" ? 12 : 0,
        opacity: 0.4,
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.04,
        ease: "power3.out",
        overwrite: "auto",
      },
    );
  }, [step, items.length, mode]);

  return (
    <div
      ref={ref}
      className="flex flex-col gap-2 rounded-xl border border-border-glass bg-black/40 p-3 backdrop-blur-md"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted">
        <span>{mode}</span>
        <span>{items.length} items</span>
      </div>
      <div
        className={cn(
          "flex gap-2",
          mode === "stack" ? "flex-col-reverse items-stretch" : "flex-row flex-wrap items-center",
        )}
      >
        {items.length === 0 && (
          <span className="text-xs text-text-muted">empty</span>
        )}
        {items.map((item, i) => (
          <div
            key={`${item}-${i}-${items.length}`}
            data-item
            className="rounded-lg border border-accent-2/40 bg-accent-2/15 px-3 py-2 font-mono text-sm text-accent-2 will-change-transform"
          >
            {String(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
