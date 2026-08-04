/**
 * Universal Trace Player visual language.
 * Colors, motion tokens, and human titles — never algorithm-specific.
 */

import type { HighlightKind } from "@/core/types/execution";
import type { TraceEventType } from "@/core/trace";
import { BASE_STEP_MS } from "@/core/scheduler";

/** Semantic colors aligned to HighlightKind. */
export const HIGHLIGHT_COLORS: Record<HighlightKind, string> = {
  comparing: "#60a5fa",
  swapped: "#f87171",
  selected: "#fbbf24",
  sorted: "#34d399",
  pivot: "#c084fc",
  found: "#4ade80",
  current: "#fb923c",
  searching: "#38bdf8",
  left: "#60a5fa",
  right: "#f472b6",
  merged: "#818cf8",
  minimum: "#fbbf24",
  active: "#2ee6a6",
  visited: "#a78bfa",
  write: "#818cf8",
};

export const DEFAULT_BAR_COLOR = "#3a4a63";

/** Event-type accent colors for timeline / markers. */
export const EVENT_COLORS: Record<TraceEventType, string> = {
  compare: HIGHLIGHT_COLORS.comparing,
  swap: HIGHLIGHT_COLORS.swapped,
  assign: HIGHLIGHT_COLORS.selected,
  call: HIGHLIGHT_COLORS.active,
  return: "#3ecbff",
  line: "#8b9bb4",
  highlight: HIGHLIGHT_COLORS.visited,
};

/** Human titles for Trace event types. */
export const EVENT_TITLES: Record<TraceEventType, string> = {
  compare: "Compare",
  swap: "Swap",
  assign: "Assign",
  call: "Enter",
  return: "Return",
  line: "Line",
  highlight: "Highlight",
};

/** Short legend blurbs for event types. */
export const EVENT_BLURBS: Record<TraceEventType, string> = {
  compare: "Two elements are evaluated against each other",
  swap: "Two elements exchange positions",
  assign: "A variable receives a new value",
  call: "Execution enters a function frame",
  return: "Execution leaves a function frame",
  line: "Program counter advances to a source line",
  highlight: "Visual focus updates on structure elements",
};

/** Titles refined from HighlightKind (used when event type is highlight). */
export const KIND_TITLES: Partial<Record<HighlightKind, string>> = {
  comparing: "Compare",
  swapped: "Swap",
  visited: "Visit",
  write: "Update",
  sorted: "Mark complete",
  found: "Found",
  pivot: "Pivot",
  selected: "Select",
  current: "Current",
  searching: "Search",
  left: "Left bound",
  right: "Right bound",
  merged: "Merge",
  minimum: "Minimum",
  active: "Active",
};

export const KIND_BLURBS: Partial<Record<HighlightKind, string>> = {
  comparing: "Elements under comparison",
  swapped: "Elements that just exchanged",
  visited: "Nodes or cells already visited",
  write: "Cells or slots that were written",
  sorted: "Elements locked in final position",
  found: "Target match",
  pivot: "Pivot element",
  selected: "Currently selected element",
  current: "Current focus",
  searching: "Search window",
  left: "Left boundary",
  right: "Right boundary",
  merged: "Merged region",
  minimum: "Current minimum",
  active: "Active element",
};

export type MomentKind =
  | "init"
  | "decision"
  | "mutation"
  | "focus"
  | "scope"
  | "complete";

export const MOMENT_LABELS: Record<MomentKind, string> = {
  init: "Initialization",
  decision: "Decision",
  mutation: "Mutation",
  focus: "Focus",
  scope: "Scope",
  complete: "Completion",
};

export const MOMENT_COLORS: Record<MomentKind, string> = {
  init: EVENT_COLORS.call,
  decision: EVENT_COLORS.compare,
  mutation: EVENT_COLORS.swap,
  focus: EVENT_COLORS.highlight,
  scope: EVENT_COLORS.return,
  complete: HIGHLIGHT_COLORS.sorted,
};

/** Shared GSAP / CSS motion tokens (fraction of step budget). */
export const MOTION = {
  easeDefault: "power2.out",
  easeSwap: "power2.inOut",
  easePulse: "power1.inOut",
  /** Fraction of step interval used for primary motion. */
  stepFraction: 0.72,
  pulseScale: 1.08,
  swapLiftPx: 18,
} as const;

export function stepBudgetSec(speed: number): number {
  const s = Math.max(0.25, Math.min(speed, 32));
  return (BASE_STEP_MS / s / 1000) * MOTION.stepFraction;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
