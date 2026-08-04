import type { TraceEvent } from "@/core/trace";
import {
  MOMENT_LABELS,
  type MomentKind,
} from "@/lib/visual-language";

export interface ExecutionMoment {
  id: string;
  kind: MomentKind;
  label: string;
  start: number;
  end: number;
}

function classifyEvent(
  event: TraceEvent,
  index: number,
  events: TraceEvent[],
): MomentKind {
  const isTrailing =
    index >= Math.max(0, events.length - 3) ||
    (event.type === "return" && index > events.length * 0.7);

  if (event.type === "return" && isTrailing) return "complete";
  if (event.type === "highlight") {
    const sorted = event.data.sorted?.length ?? 0;
    const n = Object.keys(event.data.kinds ?? {}).length;
    // All-sorted style lock near the end → completion
    if (sorted > 0 && index > events.length * 0.85) return "complete";
    if (
      event.data.kinds &&
      Object.values(event.data.kinds).every((k) => k === "sorted") &&
      n > 0
    ) {
      return index > events.length * 0.7 ? "complete" : "focus";
    }
    return "focus";
  }
  if (event.type === "compare") return "decision";
  if (event.type === "swap") return "mutation";
  if (event.type === "call" || event.type === "return") return "scope";
  if (event.type === "assign") {
    // Leading assigns before first compare/swap/highlight → init
    const earlierBusy = events
      .slice(0, index)
      .some((e) =>
        e.type === "compare" || e.type === "swap" || e.type === "highlight",
      );
    return earlierBusy ? "mutation" : "init";
  }
  if (event.type === "line") {
    // Inherit from nearest prior meaningful event
    for (let j = index - 1; j >= 0; j--) {
      const prev = events[j]!;
      if (prev.type === "line") continue;
      return classifyEvent(prev, j, events);
    }
    return "init";
  }
  return "init";
}

function momentLabel(kind: MomentKind, first: TraceEvent): string {
  const authored =
    typeof first.description === "string" ? first.description.trim() : "";
  if (authored && authored.length <= 42) return authored;
  return MOMENT_LABELS[kind];
}

/**
 * Group Trace events into algorithm-agnostic execution moments.
 * Playback still advances one event per step; this is UI chaptering only.
 */
export function buildMoments(events: TraceEvent[]): ExecutionMoment[] {
  if (!events.length) return [];

  const kinds = events.map((e, i) => classifyEvent(e, i, events));

  // Leading run before first decision/mutation/focus → force init
  const firstBusy = kinds.findIndex((k) =>
    k === "decision" || k === "mutation" || k === "focus",
  );
  if (firstBusy > 0) {
    for (let i = 0; i < firstBusy; i++) {
      if (kinds[i] === "scope" || kinds[i] === "init" || kinds[i] === "mutation") {
        kinds[i] = "init";
      }
    }
  }

  const moments: ExecutionMoment[] = [];
  let start = 0;
  for (let i = 1; i <= events.length; i++) {
    if (i < events.length && kinds[i] === kinds[start]) continue;
    const kind = kinds[start]!;
    const first = events[start]!;
    moments.push({
      id: `m-${start}-${i - 1}`,
      kind,
      label: momentLabel(kind, first),
      start,
      end: i - 1,
    });
    start = i;
  }

  return moments;
}

/** Find the moment containing a step index. */
export function momentAt(
  moments: ExecutionMoment[],
  step: number,
): ExecutionMoment | null {
  for (const m of moments) {
    if (step >= m.start && step <= m.end) return m;
  }
  return null;
}
