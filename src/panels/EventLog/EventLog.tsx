"use client";

import type { TraceEvent } from "@/core/trace";
import { useSelectionStore } from "@/store/selectionStore";
import { cn } from "@/lib/cn";

interface Props {
  events: TraceEvent[];
  activeIndex: number;
}

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

  return (
    <div className="glass flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl">
      <div className="border-b border-border-glass px-4 py-3 text-xs uppercase tracking-wider text-text-muted">
        Event log
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-[11px]">
        {events.length === 0 ? (
          <p className="px-2 py-3 text-sm text-text-muted">No events loaded.</p>
        ) : (
          events.map((e, i) => (
            <button
              key={`${e.timestamp}-${i}`}
              type="button"
              onClick={() => selectEvent(i)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition",
                i === activeIndex && "bg-accent/15 text-accent",
                i === selected && i !== activeIndex && "bg-white/5",
                i !== activeIndex && "text-text-muted hover:bg-white/[0.03] hover:text-text-primary",
              )}
            >
              <span className="w-8 shrink-0 text-right opacity-60">{i}</span>
              <span className="w-20 shrink-0 font-semibold">{e.type}</span>
              <span className="min-w-0 flex-1 truncate opacity-80">
                {summarize(e)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
