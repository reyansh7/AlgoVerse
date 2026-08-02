"use client";

import { useCallback, useEffect } from "react";
import { Bookmark, Save } from "lucide-react";
import type { ProblemDefinition } from "@/core/types/execution";
import { StructureStage } from "@/renderers/StructureStage";
import { CodePanel } from "@/components/panels/CodePanel";
import { VariablesPanel } from "@/components/panels/VariablesPanel";
import { TestCasePanel } from "@/components/panels/TestCasePanel";
import { PlaybackControls } from "@/components/playback/PlaybackControls";
import { usePlaybackStore } from "@/store/playback-store";
import { useHistoryStore } from "@/store/history-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useTestCaseStore } from "@/store/testcase-store";
import { useExecutionView } from "@/hooks/useExecutionView";

interface Props {
  problem: ProblemDefinition;
}

export function Playground({ problem }: Props) {
  const run = usePlaybackStore((s) => s.run);
  const timeline = usePlaybackStore((s) => s.timeline);
  const saveExecution = useHistoryStore((s) => s.saveExecution);
  const toggleFavorite = useFavoritesStore((s) => s.toggleProblem);
  const isFavorite = useFavoritesStore((s) => s.problemSlugs.includes(problem.slug));
  const getActive = useTestCaseStore((s) => s.getActive);
  const ensureDefaults = useTestCaseStore((s) => s.ensureDefaults);

  const { state, previous, currentStep } = useExecutionView();

  const handleRun = useCallback(
    (input: unknown) => {
      run(problem.slug, input);
    },
    [problem.slug, run],
  );

  useEffect(() => {
    ensureDefaults(problem.slug);
    const active = getActive(problem.slug);
    if (active) handleRun(active.input);
    // Only re-run when the problem changes — not on every store identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.slug]);

  return (
    <div className="flex min-h-screen flex-col gap-4 px-4 pb-6 pt-24">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Playground · {problem.category}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {problem.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(problem.slug)}
            className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-muted transition hover:text-accent-warm"
          >
            <Bookmark
              className={`h-4 w-4 ${isFavorite ? "fill-accent-warm text-accent-warm" : ""}`}
            />
            {isFavorite ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            disabled={!timeline}
            onClick={() => {
              if (!timeline) return;
              saveExecution(
                problem.slug,
                `${problem.name} · step ${currentStep + 1}`,
                timeline,
              );
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-bg-deep transition hover:brightness-110 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Save run
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <div className="min-h-[420px] xl:min-h-0">
          <TestCasePanel problem={problem} onRun={handleRun} />
        </div>

        <div className="flex min-h-[520px] flex-col gap-3">
          <div className="glass relative min-h-[400px] flex-1 overflow-hidden rounded-2xl">
            <div className="absolute inset-0">
              <StructureStage state={state} previous={previous} />
            </div>
            {state && (
              <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-border-glass bg-black/45 px-3 py-1.5 font-mono text-[11px] text-accent backdrop-blur-md">
                {state.operation}
              </div>
            )}
          </div>
          <PlaybackControls />
        </div>

        <div className="grid min-h-[420px] grid-rows-2 gap-3">
          <CodePanel code={problem.code} activeLine={state?.line ?? null} />
          <VariablesPanel state={state} />
        </div>
      </div>
    </div>
  );
}
