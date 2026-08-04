"use client";

import type { LegendEntry, StepLesson, TraceIntro, TraceSummary } from "@/engine/explain";
import { HIGHLIGHT_COLORS } from "@/lib/visual-language";
import { TraceLegend } from "./TraceLegend";
import { cn } from "@/lib/cn";

interface Props {
  lesson: StepLesson;
  legend: LegendEntry[];
  step: number;
  total: number;
  intro: TraceIntro | null;
  summary: TraceSummary | null;
  showIntro: boolean;
  showSummary: boolean;
  onDismissIntro?: () => void;
}

export function LearningPanel({
  lesson,
  legend,
  step,
  total,
  intro,
  summary,
  showIntro,
  showSummary,
  onDismissIntro,
}: Props) {
  return (
    <div className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-border-glass px-4 py-2.5">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          Guide
        </span>
        <span className="font-mono text-[11px] text-text-muted">
          {total > 0 ? `${step + 1} / ${total}` : "—"}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        {showIntro && intro && (
          <section
            className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-3"
            aria-label="Execution introduction"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-accent">
                About this execution
              </p>
              {onDismissIntro && (
                <button
                  type="button"
                  onClick={onDismissIntro}
                  className="text-[10px] text-text-muted hover:text-text-primary"
                >
                  Dismiss
                </button>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-text-primary/95">
              {intro.preview}
            </p>
            <p className="mt-2 font-mono text-[11px] text-text-muted">
              {intro.totalEvents} steps
              {intro.structureKinds.length > 0
                ? ` · ${intro.structureKinds.join(", ")}`
                : ""}
              {intro.language ? ` · ${intro.language}` : ""}
            </p>
          </section>
        )}

        {showSummary && summary && (
          <section
            className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-3 py-3"
            aria-label="Execution summary"
          >
            <p className="text-[10px] uppercase tracking-wider text-emerald-400">
              Execution complete
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-text-primary/90">
              <li>{summary.totalEvents} steps</li>
              <li>{summary.comparisons} compares</li>
              <li>{summary.swaps} swaps</li>
              <li>{summary.assigns} assigns</li>
              <li>{summary.calls} calls</li>
              <li>{summary.highlights} highlights</li>
            </ul>
            {summary.structuresTouched.length > 0 && (
              <p className="mt-2 text-[11px] text-text-muted">
                Structures: {summary.structuresTouched.join(", ")}
              </p>
            )}
          </section>
        )}

        <section>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">
            Current operation
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-text-primary">
            {lesson.operationTitle}
          </h2>
          <p
            className={cn(
              "mt-2 text-sm leading-relaxed",
              lesson.confidence === "authored"
                ? "text-text-primary/95"
                : "text-text-primary/85",
            )}
          >
            {lesson.whatHappened}
          </p>
        </section>

        {lesson.whatChanged.length > 0 && (
          <section>
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-text-muted">
              What changed
            </p>
            <ul className="space-y-1">
              {lesson.whatChanged.map((item) => (
                <li
                  key={item}
                  className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-text-primary/90"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {lesson.notice && (
          <section className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Notice
            </p>
            <p className="mt-1 text-sm text-accent">{lesson.notice}</p>
          </section>
        )}

        {lesson.structureHints.length > 0 && (
          <section>
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-text-muted">
              Structure
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lesson.structureHints.map((h, i) => {
                const color =
                  h.colorKey && h.colorKey in HIGHLIGHT_COLORS
                    ? HIGHLIGHT_COLORS[
                        h.colorKey as keyof typeof HIGHLIGHT_COLORS
                      ]
                    : "#8b9bb4";
                return (
                  <span
                    key={`${h.kind}-${h.label}-${i}`}
                    className="rounded-md px-2 py-0.5 font-mono text-[10px]"
                    style={{
                      color,
                      backgroundColor: `${color}22`,
                      border: `1px solid ${color}55`,
                    }}
                  >
                    {h.kind === "variable" ? h.label : h.label}
                    {h.detail ? ` ${h.detail}` : ""}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <TraceLegend entries={legend} />
      </div>
    </div>
  );
}
