"use client";

import { useEffect, useRef } from "react";
import type { TraceEvent } from "@/core/trace";
import { useSelectionStore } from "@/store/selectionStore";
import { cn } from "@/lib/cn";

interface Props {
  events: TraceEvent[];
  activeIndex: number;
}

const TYPE_COLOR: Record<string, string> = {
  compare: "#60a5fa",
  swap: "#f87171",
  assign: "#f0b429",
  call: "#2ee6a6",
  return: "#3ecbff",
  line: "#8b9bb4",
  highlight: "#c084fc",
};

function summarize(e: TraceEvent): string {
  switch (e.type) {
    case "assign":
      return `${e.data.name} = ${JSON.stringify(e.data.value)}`;
    case "compare":
      return `[${e.data.i}] vs [${e.data.j}]`;
    case "swap":
      return `[${e.data.i}] ↔ [${e.data.j}]`;
    case "call":
      return e.data.frame;
    case "return":
      return `${e.data.frame}${e.data.value !== undefined ? ` → ${JSON.stringify(e.data.value)}` : ""}`;
    case "line":
      return `L${e.data.line}`;
    case "highlight":
      return e.data.clear
        ? "clear"
        : `indices ${(e.data.indices ?? []).join(",")}`;
    default:
      return "";
  }
}

export function EventLog({ events, activeIndex }: Props) {
  const selected = useSelectionStore((s) => s.selectedEventIndex);
  const selectEvent = useSelectionStore((s) => s.selectEvent);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-border-glass px-4 py-2.5 text-xs uppercase tracking-wider text-text-muted">
        <span>Event log</span>
        <span className="font-mono normal-case tracking-normal text-text-muted/80">
          {events.length} steps
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 font-mono text-[11px]">
        {events.length === 0 ? (
          <p className="px-2 py-3 text-sm text-text-muted">No events loaded.</p>
        ) : (
          events.map((e, i) => {
            const color = TYPE_COLOR[e.type] ?? "#8b9bb4";
            const isActive = i === activeIndex;
            return (
              <button
                key={`${e.timestamp}-${i}`}
                ref={isActive ? activeRef : undefined}
                type="button"
                onClick={() => selectEvent(i)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition",
                  isActive && "bg-accent/15 text-accent",
                  i === selected && !isActive && "bg-white/5",
                  !isActive &&
                    "text-text-muted hover:bg-white/[0.03] hover:text-text-primary",
                )}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="w-8 shrink-0 text-right opacity-60">{i}</span>
                <span
                  className="w-20 shrink-0 font-semibold"
                  style={isActive ? undefined : { color }}
                >
                  {e.type}
                </span>
                <span className="min-w-0 flex-1 truncate opacity-80">
                  {summarize(e)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
