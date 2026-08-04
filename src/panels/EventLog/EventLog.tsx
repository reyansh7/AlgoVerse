"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TraceEvent } from "@/core/trace";
import { useSelectionStore } from "@/store/selectionStore";
import { EVENT_COLORS } from "@/lib/visual-language";
import { cn } from "@/lib/cn";

interface Props {
  events: TraceEvent[];
  activeIndex: number;
  /** When true, start collapsed (debug secondary panel). */
  defaultOpen?: boolean;
}

const WINDOW = 80;

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

/**
 * Secondary debug log — collapsible, windowed around the active step
 * so large traces stay responsive.
 */
export function EventLog({
  events,
  activeIndex,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const selected = useSelectionStore((s) => s.selectedEventIndex);
  const selectEvent = useSelectionStore((s) => s.selectEvent);
  const activeRef = useRef<HTMLButtonElement>(null);

  const windowed = useMemo(() => {
    if (events.length <= WINDOW * 2) {
      return events.map((e, i) => ({ e, i }));
    }
    const half = WINDOW;
    let start = Math.max(0, activeIndex - half);
    let end = Math.min(events.length, start + WINDOW * 2);
    start = Math.max(0, end - WINDOW * 2);
    const slice: { e: TraceEvent; i: number }[] = [];
    for (let i = start; i < end; i++) {
      slice.push({ e: events[i]!, i });
    }
    return slice;
  }, [events, activeIndex]);

  useEffect(() => {
    if (!open) return;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex, open]);

  return (
    <div className="glass flex min-h-0 flex-col overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between border-b border-border-glass px-4 py-2.5 text-left text-xs uppercase tracking-wider text-text-muted transition hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span>Event log</span>
        <span className="font-mono normal-case tracking-normal text-text-muted/80">
          {events.length} steps · {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="min-h-0 max-h-48 flex-1 overflow-y-auto overscroll-contain p-2 font-mono text-[11px] sm:max-h-56">
          {events.length === 0 ? (
            <p className="px-2 py-3 text-sm text-text-muted">No events loaded.</p>
          ) : (
            <>
              {windowed[0]?.i > 0 && (
                <p className="px-2 py-1 text-[10px] text-text-muted/70">
                  … {windowed[0].i} earlier events
                </p>
              )}
              {windowed.map(({ e, i }) => {
                const color = EVENT_COLORS[e.type] ?? "#8b9bb4";
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
              })}
              {windowed.length > 0 &&
                windowed[windowed.length - 1]!.i < events.length - 1 && (
                  <p className="px-2 py-1 text-[10px] text-text-muted/70">
                    … {events.length - 1 - windowed[windowed.length - 1]!.i} later
                    events
                  </p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
