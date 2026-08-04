import type { HighlightKind } from "@/core/types/execution";

export type StructureHintKind =
  | "index"
  | "node"
  | "edge"
  | "cell"
  | "variable"
  | "structure";

export interface StructureHint {
  kind: StructureHintKind;
  label: string;
  detail?: string;
  colorKey?: HighlightKind | string;
}

export interface StepLesson {
  operationTitle: string;
  whatHappened: string;
  whatChanged: string[];
  notice: string | null;
  structureHints: StructureHint[];
  confidence: "authored" | "derived";
}

export interface LegendEntry {
  id: string;
  label: string;
  blurb: string;
  color: string;
  source: "event" | "kind";
}

export interface TraceIntro {
  language: string;
  algorithmLabel: string;
  structureKinds: string[];
  eventCounts: Record<string, number>;
  totalEvents: number;
  /** One sentence derived only from Trace contents. */
  preview: string;
}

export interface TraceSummary {
  totalEvents: number;
  eventCounts: Record<string, number>;
  structuresTouched: string[];
  comparisons: number;
  swaps: number;
  assigns: number;
  calls: number;
  returns: number;
  highlights: number;
}
