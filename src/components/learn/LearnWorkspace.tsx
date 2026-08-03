"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProblemPackage } from "@/problems/types";
import { StructureStage } from "@/renderers/StructureStage";
import { VariablesPanel, PlaybackControls } from "@/panels";
import { StatementPanel } from "@/components/learn/StatementPanel";
import { MonacoPane } from "@/components/learn/MonacoPane";
import { usePlaybackStore } from "@/store/playback-store";
import { useExecutionView } from "@/hooks/useExecutionView";
import { usePlaybackClock } from "@/hooks/usePlaybackClock";
import { createId } from "@/lib/id";
import {
  EDITOR_LANGUAGES,
  getSolutionCode,
  type EditorLanguage,
} from "@/lib/code-languages";
import { cn } from "@/lib/cn";

interface Props {
  problem: ProblemPackage;
}

function stringifyInput(input: unknown) {
  return JSON.stringify(input, null, 2);
}

export function LearnWorkspace({ problem }: Props) {
  const runSolution = usePlaybackStore((s) => s.runSolution);
  const jump = usePlaybackStore((s) => s.jump);
  const timeline = usePlaybackStore((s) => s.timeline);
  const { state, previous, currentStep, totalSteps } = useExecutionView();
  usePlaybackClock();

  const [solutionId, setSolutionId] = useState(problem.solutions[0]?.id ?? "");
  const solution = useMemo(
    () =>
      problem.solutions.find((s) => s.id === solutionId) ?? problem.solutions[0],
    [problem.solutions, solutionId],
  );

  const [lang, setLang] = useState<EditorLanguage>("typescript");
  const monacoLang =
    EDITOR_LANGUAGES.find((l) => l.id === lang)?.monaco ?? "typescript";

  const [editorCode, setEditorCode] = useState("");
  const [caseIndex, setCaseIndex] = useState(0);
  const [caseJson, setCaseJson] = useState(
    stringifyInput(problem.testcases[0]?.input ?? {}),
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const loadReference = useCallback(
    (nextLang: EditorLanguage = lang) => {
      if (!solution) return;
      setEditorCode(getSolutionCode(solution, nextLang));
    },
    [lang, solution],
  );

  useEffect(() => {
    setSolutionId(problem.solutions[0]?.id ?? "");
    setCaseIndex(0);
    setCaseJson(stringifyInput(problem.testcases[0]?.input ?? {}));
    setLang("typescript");
  }, [problem.metadata.slug, problem.solutions, problem.testcases]);

  useEffect(() => {
    if (solution) setEditorCode(getSolutionCode(solution, lang));
  }, [solution, lang]);

  const animate = useCallback(() => {
    if (!solution) return;
    try {
      const input = JSON.parse(caseJson) as unknown;
      setParseError(null);
      runSolution(solution, input);
    } catch {
      setParseError("Invalid JSON test case.");
    }
  }, [caseJson, runSolution, solution]);

  useEffect(() => {
    if (solution && problem.testcases[0]) {
      runSolution(solution, problem.testcases[0].input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.metadata.slug, solutionId]);

  return (
    <div className="flex min-h-screen flex-col gap-3 px-3 pb-4 pt-20 md:px-4">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3">
        <div>
          <Link
            href="/learn"
            className="text-xs text-text-muted transition hover:text-accent"
          >
            ← Learn
          </Link>
          <div className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            {problem.metadata.id}. {problem.metadata.title}
          </div>
        </div>
        <a
          href={problem.metadata.leetcodeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-accent underline-offset-2 hover:underline"
        >
          Open on LeetCode
        </a>
      </div>

      <div className="mx-auto grid w-full max-w-[1800px] flex-1 grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(420px,1fr)_auto]">
        <div className="min-h-[280px] lg:row-span-2">
          <StatementPanel
            title={problem.metadata.title}
            difficulty={problem.metadata.difficulty}
            statement={problem.statement}
            tags={problem.metadata.tags}
          />
        </div>

        <div className="glass flex min-h-[360px] flex-col overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
            <span className="text-xs uppercase tracking-[0.15em] text-text-muted">
              Visualization
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {solution?.timeComplexity} · {solution?.spaceComplexity}
            </span>
          </div>
          <div className="min-h-0 flex-1 p-2">
            <StructureStage state={state} previous={previous} />
          </div>
          <div className="border-t border-white/5 px-3 py-2">
            <div className="mb-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.15em] text-accent">
                Step explanation
              </div>
              <p className="mt-1 text-sm leading-relaxed text-text-primary">
                {state?.description ??
                  "Select a test case and click Animate to see each step explained."}
              </p>
            </div>
            <PlaybackControls />
            {timeline && totalSteps > 0 ? (
              <input
                type="range"
                min={0}
                max={Math.max(0, totalSteps - 1)}
                value={currentStep}
                onChange={(e) => jump(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent)]"
                aria-label="Timeline scrubber"
              />
            ) : null}
          </div>
        </div>

        <div className="flex min-h-[360px] flex-col gap-3">
          <div className="glass rounded-2xl p-3">
            <label className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
              Reference solution
            </label>
            <select
              value={solution?.id}
              onChange={(e) => setSolutionId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-bg-deep px-3 py-2 text-sm"
            >
              {problem.solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.approach})
                </option>
              ))}
            </select>

            <div className="mt-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-text-muted">
                Editor language
              </div>
              <div className="flex flex-wrap gap-1">
                {EDITOR_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLang(l.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs transition",
                      lang === l.id
                        ? "bg-accent/20 text-accent"
                        : "text-text-muted hover:text-text-primary",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => loadReference(lang)}
                className="mt-2 text-[11px] text-accent underline-offset-2 hover:underline"
              >
                Reset to reference (
                {EDITOR_LANGUAGES.find((l) => l.id === lang)?.label})
              </button>
            </div>
          </div>

          <div className="min-h-[220px] flex-1">
            <MonacoPane
              value={editorCode}
              language={monacoLang}
              onChange={setEditorCode}
              readOnlyHint="Write or edit in TypeScript, Java, Python, or C++ for study. Animate always runs the curated reference engine — never your buffer."
            />
          </div>

          <div className="glass rounded-2xl p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
                Test case (JSON)
              </label>
              <select
                value={caseIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setCaseIndex(idx);
                  const tc = problem.testcases[idx];
                  if (tc) setCaseJson(stringifyInput(tc.input));
                }}
                className="rounded-lg border border-white/10 bg-bg-deep px-2 py-1 text-xs"
              >
                {problem.testcases.map((tc, i) => (
                  <option key={tc.id || createId("tc")} value={i}>
                    {tc.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={caseJson}
              onChange={(e) => setCaseJson(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-bg-deep px-3 py-2 font-mono text-xs"
            />
            {parseError ? (
              <p className="mt-1 text-xs text-red-400">{parseError}</p>
            ) : null}
            <button
              type="button"
              onClick={animate}
              className="mt-2 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-bg-deep transition hover:brightness-110"
            >
              Animate
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-3 lg:col-start-2 lg:col-end-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.15em] text-text-muted">
            Variables · step {totalSteps ? currentStep + 1 : 0}/{totalSteps}
          </div>
          <VariablesPanel state={state} />
        </div>
      </div>
    </div>
  );
}
