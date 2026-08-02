import type { HighlightKind, Highlights } from "@/core/types/execution";

/** alg0.dev-inspired palette — distinct role per operation. */
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

/** Build typed index highlights (alg0 Step.highlights shape). */
export function mark(
  kinds: Record<number, HighlightKind>,
  sorted: number[] = [],
): Highlights {
  return {
    indices: Object.keys(kinds).map(Number),
    indexKinds: kinds,
    sorted: [...sorted],
    nodes: [],
    edges: [],
  };
}

export function barColor(
  index: number,
  kinds: Record<number, HighlightKind> | undefined,
  sorted: number[] | undefined,
): string {
  const kind = kinds?.[index];
  if (kind) return HIGHLIGHT_COLORS[kind];
  if (sorted?.includes(index)) return HIGHLIGHT_COLORS.sorted;
  return DEFAULT_BAR_COLOR;
}
