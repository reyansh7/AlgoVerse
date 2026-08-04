/**
 * Backward-compatible re-exports — prefer `@/lib/visual-language`.
 */
import type { HighlightKind, Highlights } from "@/core/types/execution";
import {
  HIGHLIGHT_COLORS,
  DEFAULT_BAR_COLOR,
} from "@/lib/visual-language";

export { HIGHLIGHT_COLORS, DEFAULT_BAR_COLOR };

/** Build typed index highlights. */
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
