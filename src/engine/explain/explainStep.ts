import type { TraceEvent, HighlightEvent } from "@/core/trace";
import type { ExecutionState, HighlightKind } from "@/core/types/execution";
import type { StateDiff } from "@/core/animation/diff";
import {
  EVENT_TITLES,
  KIND_TITLES,
} from "@/lib/visual-language";
import type { StepLesson, StructureHint } from "./types";

const KNOWN_KINDS = new Set<string>([
  "comparing",
  "swapped",
  "selected",
  "sorted",
  "pivot",
  "found",
  "current",
  "searching",
  "left",
  "right",
  "merged",
  "minimum",
  "active",
  "visited",
  "write",
]);

function asKind(v: string): HighlightKind | null {
  return KNOWN_KINDS.has(v) ? (v as HighlightKind) : null;
}

function formatValue(value: unknown): string {
  try {
    const s = JSON.stringify(value);
    return s.length > 48 ? `${s.slice(0, 45)}…` : s;
  } catch {
    return String(value);
  }
}

function highlightTitle(event: HighlightEvent): string {
  if (event.data.clear) return "Clear highlights";
  const kinds = event.data.kinds ?? {};
  const unique = [
    ...new Set(Object.values(kinds).map(String).filter(Boolean)),
  ];
  if (unique.length === 1) {
    const k = asKind(unique[0]!);
    if (k && KIND_TITLES[k]) return KIND_TITLES[k]!;
  }
  if (event.data.sorted?.length && unique.length === 0) {
    return KIND_TITLES.sorted ?? "Mark complete";
  }
  if (unique.includes("visited")) return KIND_TITLES.visited ?? "Visit";
  if (unique.includes("write")) return KIND_TITLES.write ?? "Update";
  if (unique.includes("sorted") || (event.data.sorted?.length ?? 0) > 0) {
    return KIND_TITLES.sorted ?? "Mark complete";
  }
  return EVENT_TITLES.highlight;
}

function operationTitle(event: TraceEvent): string {
  switch (event.type) {
    case "highlight":
      return highlightTitle(event);
    default:
      return EVENT_TITLES[event.type] ?? event.type;
  }
}

function derivedWhatHappened(event: TraceEvent): string {
  switch (event.type) {
    case "compare": {
      const vals = event.data.values;
      if (vals && vals.length >= 2) {
        return `Compared indices [${event.data.i}] and [${event.data.j}] (${formatValue(vals[0])} vs ${formatValue(vals[1])}).`;
      }
      return `Compared indices [${event.data.i}] and [${event.data.j}].`;
    }
    case "swap":
      return `Swapped indices [${event.data.i}] and [${event.data.j}].`;
    case "assign":
      return `Assigned ${event.data.name} = ${formatValue(event.data.value)}.`;
    case "call":
      return `Entered ${event.data.frame}.`;
    case "return":
      return event.data.value !== undefined
        ? `Returned from ${event.data.frame} with ${formatValue(event.data.value)}.`
        : `Returned from ${event.data.frame}.`;
    case "line":
      return `Advanced to line ${event.data.line}.`;
    case "highlight": {
      if (event.data.clear) return "Cleared structure highlights.";
      const parts: string[] = [];
      if (event.data.indices?.length) {
        parts.push(`focused indices [${event.data.indices.join(", ")}]`);
      }
      if (event.data.sorted?.length) {
        parts.push(`marked sorted [${event.data.sorted.join(", ")}]`);
      }
      const kinds = Object.entries(event.data.kinds ?? {});
      if (kinds.length) {
        parts.push(
          kinds
            .map(([idx, k]) => `[${idx}]→${k}`)
            .slice(0, 6)
            .join(", "),
        );
      }
      return parts.length
        ? `Updated highlights: ${parts.join("; ")}.`
        : "Updated structure highlights.";
    }
    default:
      return "Execution advanced one step.";
  }
}

function whatChangedFromEvent(
  event: TraceEvent,
  diff: StateDiff | null,
): string[] {
  const items: string[] = [];

  switch (event.type) {
    case "compare":
      items.push(`[${event.data.i}] compared with [${event.data.j}]`);
      break;
    case "swap":
      items.push(`[${event.data.i}] ↔ [${event.data.j}]`);
      break;
    case "assign":
      items.push(`${event.data.name} = ${formatValue(event.data.value)}`);
      break;
    case "call":
      items.push(`call stack + ${event.data.frame}`);
      if (event.data.args) {
        for (const [k, v] of Object.entries(event.data.args)) {
          items.push(`arg ${k} = ${formatValue(v)}`);
        }
      }
      break;
    case "return":
      items.push(`call stack − ${event.data.frame}`);
      if (event.data.value !== undefined) {
        items.push(`result = ${formatValue(event.data.value)}`);
      }
      break;
    case "line":
      // Pure PC update — only list if something else also changed.
      break;
    case "highlight":
      if (event.data.clear) items.push("highlights cleared");
      if (event.data.indices?.length) {
        items.push(`indices [${event.data.indices.join(", ")}]`);
      }
      if (event.data.sorted?.length) {
        items.push(`sorted [${event.data.sorted.join(", ")}]`);
      }
      break;
  }

  if (diff) {
    for (const key of diff.variableChanges) {
      if (key.startsWith("__")) continue;
      const already = items.some((s) => s.startsWith(`${key} =`));
      if (!already && event.type !== "assign") {
        items.push(`variable ${key} changed`);
      }
    }
    for (const sk of diff.structureKeysChanged) {
      items.push(`structure.${sk} changed`);
    }
    if (diff.swappedIndices) {
      const [a, b] = diff.swappedIndices;
      const swapLine = `[${a}] ↔ [${b}]`;
      if (!items.includes(swapLine)) items.push(swapLine);
    }
  }

  return items;
}

function buildNotice(
  event: TraceEvent,
  diff: StateDiff | null,
  state: ExecutionState | null,
): string | null {
  if (event.type === "compare") {
    return `Watch indices [${event.data.i}] and [${event.data.j}].`;
  }
  if (event.type === "swap") {
    return `Watch indices [${event.data.i}] and [${event.data.j}] exchange.`;
  }
  if (diff?.swappedIndices) {
    const [a, b] = diff.swappedIndices;
    return `Watch indices [${a}] and [${b}] exchange.`;
  }
  if (event.type === "highlight" && event.data.sorted?.length) {
    return `Notice sorted lock on [${event.data.sorted.join(", ")}].`;
  }
  const kinds = state?.highlights.indexKinds ?? {};
  const comparing = Object.entries(kinds)
    .filter(([, k]) => k === "comparing")
    .map(([i]) => i);
  if (comparing.length >= 2) {
    return `Watch comparing indices [${comparing.join(", ")}].`;
  }
  return null;
}

function structureHints(
  event: TraceEvent,
  diff: StateDiff | null,
  state: ExecutionState | null,
): StructureHint[] {
  const hints: StructureHint[] = [];

  const pushIndex = (i: number, detail?: string, colorKey?: HighlightKind) => {
    hints.push({
      kind: "index",
      label: `[${i}]`,
      detail,
      colorKey,
    });
  };

  switch (event.type) {
    case "compare":
      pushIndex(event.data.i, "compare", "comparing");
      pushIndex(event.data.j, "compare", "comparing");
      break;
    case "swap":
      pushIndex(event.data.i, "swap", "swapped");
      pushIndex(event.data.j, "swap", "swapped");
      break;
    case "assign":
      hints.push({
        kind: "variable",
        label: event.data.name,
        detail: formatValue(event.data.value),
        colorKey: "selected",
      });
      break;
    case "highlight": {
      for (const i of event.data.indices ?? []) {
        const k = event.data.kinds?.[String(i)];
        pushIndex(i, k, asKind(String(k ?? "")) ?? "active");
      }
      for (const i of event.data.sorted ?? []) {
        pushIndex(i, "sorted", "sorted");
      }
      break;
    }
  }

  for (const n of state?.highlights.nodes ?? []) {
    if (!hints.some((h) => h.kind === "node" && h.label === n)) {
      hints.push({ kind: "node", label: n, colorKey: "visited" });
    }
  }
  for (const e of state?.highlights.edges ?? []) {
    if (!hints.some((h) => h.kind === "edge" && h.label === e)) {
      hints.push({ kind: "edge", label: e, colorKey: "active" });
    }
  }

  if (diff) {
    for (const sk of diff.structureKeysChanged) {
      if (!hints.some((h) => h.kind === "structure" && h.label === sk)) {
        hints.push({ kind: "structure", label: String(sk) });
      }
    }
  }

  return hints;
}

/**
 * Build a teaching lesson for one Trace step.
 * Never invents behavior — only event data, frame description, and diffs.
 */
export function explainStep(
  event: TraceEvent | null | undefined,
  state: ExecutionState | null,
  diff: StateDiff | null,
): StepLesson {
  if (!event) {
    return {
      operationTitle: "Ready",
      whatHappened: "Load a trace to begin guided execution.",
      whatChanged: [],
      notice: null,
      structureHints: [],
      confidence: "derived",
    };
  }

  const authored =
    (typeof event.description === "string" && event.description.trim()) ||
    (typeof state?.description === "string" && state.description.trim()) ||
    "";

  return {
    operationTitle: operationTitle(event),
    whatHappened: authored || derivedWhatHappened(event),
    whatChanged: whatChangedFromEvent(event, diff),
    notice: buildNotice(event, diff, state),
    structureHints: structureHints(event, diff, state),
    confidence: authored ? "authored" : "derived",
  };
}
