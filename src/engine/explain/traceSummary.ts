import type { TraceDocument } from "@/core/trace";
import { EVENT_TITLES } from "@/lib/visual-language";
import type { TraceIntro, TraceSummary } from "./types";

function countEvents(doc: TraceDocument): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of doc.events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
}

function structuresFromDoc(doc: TraceDocument): string[] {
  const kinds = new Set<string>();
  if (doc.metadata?.initial?.array) kinds.add("array");
  // Future frames may carry more structures via reduce — peek is not available
  // here without frames; callers may merge frame-derived keys.
  return [...kinds];
}

function structuresFromCounts(
  doc: TraceDocument,
  extra: string[] = [],
): string[] {
  const set = new Set([...structuresFromDoc(doc), ...extra]);
  return [...set];
}

/** Intro copy derived only from Trace document contents. */
export function buildTraceIntro(
  doc: TraceDocument | null,
  structureKinds: string[] = [],
): TraceIntro | null {
  if (!doc) return null;
  const eventCounts = countEvents(doc);
  const structures = structuresFromCounts(doc, structureKinds);
  const opParts = Object.keys(eventCounts)
    .filter((t) => t !== "line")
    .map((t) => EVENT_TITLES[t as keyof typeof EVENT_TITLES] ?? t)
    .slice(0, 5);

  const preview =
    opParts.length > 0
      ? `You will watch execution unfold through ${opParts.join(", ").toLowerCase()}${Object.keys(eventCounts).length > opParts.length ? ", …" : ""}.`
      : "You will watch recorded execution step by step.";

  return {
    language: doc.language,
    algorithmLabel: doc.algorithm,
    structureKinds: structures,
    eventCounts,
    totalEvents: doc.events.length,
    preview,
  };
}

/** End-of-playback summary — counts only, no invented pedagogy. */
export function buildTraceSummary(
  doc: TraceDocument | null,
  structureKinds: string[] = [],
): TraceSummary | null {
  if (!doc) return null;
  const eventCounts = countEvents(doc);
  return {
    totalEvents: doc.events.length,
    eventCounts,
    structuresTouched: structuresFromCounts(doc, structureKinds),
    comparisons: eventCounts.compare ?? 0,
    swaps: eventCounts.swap ?? 0,
    assigns: eventCounts.assign ?? 0,
    calls: eventCounts.call ?? 0,
    returns: eventCounts.return ?? 0,
    highlights: eventCounts.highlight ?? 0,
  };
}
