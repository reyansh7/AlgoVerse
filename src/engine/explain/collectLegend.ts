import type { TraceDocument, TraceEvent } from "@/core/trace";
import type { HighlightKind } from "@/core/types/execution";
import {
  EVENT_BLURBS,
  EVENT_COLORS,
  EVENT_TITLES,
  HIGHLIGHT_COLORS,
  KIND_BLURBS,
  KIND_TITLES,
} from "@/lib/visual-language";
import type { LegendEntry } from "./types";

const KNOWN_KINDS = new Set<string>(Object.keys(HIGHLIGHT_COLORS));

/**
 * Legend entries for operations / highlight kinds present in this Trace only.
 */
export function collectLegend(doc: TraceDocument | null): LegendEntry[] {
  if (!doc?.events?.length) return [];

  const eventTypes = new Set<TraceEvent["type"]>();
  const kinds = new Set<HighlightKind>();

  for (const e of doc.events) {
    eventTypes.add(e.type);
    if (e.type === "highlight") {
      for (const k of Object.values(e.data.kinds ?? {})) {
        if (KNOWN_KINDS.has(String(k))) kinds.add(k as HighlightKind);
      }
      if (e.data.sorted?.length) kinds.add("sorted");
      if (e.data.clear) {
        // still show highlight as event type
      }
    }
  }

  const entries: LegendEntry[] = [];

  // Prefer event-type entries for the primary vocabulary.
  for (const t of [
    "compare",
    "swap",
    "assign",
    "call",
    "return",
    "highlight",
    "line",
  ] as const) {
    if (!eventTypes.has(t)) continue;
    // Skip line in legend — low teaching value unless alone
    if (t === "line" && eventTypes.size > 1) continue;
    entries.push({
      id: `event:${t}`,
      label: EVENT_TITLES[t],
      blurb: EVENT_BLURBS[t],
      color: EVENT_COLORS[t],
      source: "event",
    });
  }

  // Add highlight kinds not already covered by event titles.
  const coveredLabels = new Set(entries.map((e) => e.label.toLowerCase()));
  for (const k of [
    "visited",
    "write",
    "sorted",
    "pivot",
    "found",
    "selected",
    "current",
    "searching",
    "left",
    "right",
    "merged",
    "minimum",
    "active",
    "comparing",
    "swapped",
  ] as HighlightKind[]) {
    if (!kinds.has(k)) continue;
    const label = KIND_TITLES[k] ?? k;
    if (coveredLabels.has(label.toLowerCase())) continue;
    // Skip comparing/swapped if compare/swap events already listed
    if (k === "comparing" && eventTypes.has("compare")) continue;
    if (k === "swapped" && eventTypes.has("swap")) continue;
    entries.push({
      id: `kind:${k}`,
      label,
      blurb: KIND_BLURBS[k] ?? k,
      color: HIGHLIGHT_COLORS[k],
      source: "kind",
    });
    coveredLabels.add(label.toLowerCase());
  }

  return entries;
}
