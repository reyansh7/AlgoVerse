"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import type { ProblemDefinition } from "@/core/types/execution";
import { useTestCaseStore } from "@/store/testcase-store";
import { cn } from "@/lib/cn";

interface Props {
  problem: ProblemDefinition;
  onRun: (input: unknown) => void;
}

export function TestCasePanel({ problem, onRun }: Props) {
  const cases = useTestCaseStore((s) => s.cases[problem.slug] ?? []);
  const activeId = useTestCaseStore((s) => s.activeCaseId[problem.slug]);
  const setActive = useTestCaseStore((s) => s.setActive);
  const addCase = useTestCaseStore((s) => s.addCase);
  const updateCase = useTestCaseStore((s) => s.updateCase);
  const deleteCase = useTestCaseStore((s) => s.deleteCase);
  const toggleFavorite = useTestCaseStore((s) => s.toggleFavorite);
  const ensureDefaults = useTestCaseStore((s) => s.ensureDefaults);

  const active = useMemo(
    () => cases.find((c) => c.id === activeId) ?? cases[0] ?? null,
    [cases, activeId],
  );

  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureDefaults(problem.slug);
  }, [ensureDefaults, problem.slug]);

  useEffect(() => {
    if (!active) return;
    setDraft(JSON.stringify(active.input, null, 2));
    setError(null);
  }, [active]);

  const applyDraft = () => {
    if (!active) return;
    try {
      const parsed = JSON.parse(draft);
      updateCase(problem.slug, active.id, { input: parsed });
      setError(null);
      onRun(parsed);
    } catch {
      setError("Invalid JSON input");
    }
  };

  const handleAdd = () => {
    const template = active?.input ?? problem.defaultCases[0]?.input ?? {};
    const tc = addCase(
      problem.slug,
      `Custom ${cases.length + 1}`,
      structuredClone(template),
    );
    setDraft(JSON.stringify(tc.input, null, 2));
  };

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border-glass px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted">
            {problem.id}
          </div>
          <div className="font-display text-base font-semibold">{problem.name}</div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 rounded-lg border border-border-glass px-2 py-1 text-xs text-text-muted transition hover:text-text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Case
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border-glass px-2 py-2">
        {cases.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setActive(problem.slug, c.id);
              onRun(c.input);
            }}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition",
              c.id === active?.id
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-text-muted hover:text-text-primary",
            )}
          >
            {c.favorite && (
              <Star className="h-3 w-3 fill-accent-warm text-accent-warm" />
            )}
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="min-h-40 flex-1 resize-none rounded-xl border border-border-glass bg-black/30 p-3 font-mono text-xs leading-5 text-text-primary outline-none focus:border-accent/40"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyDraft}
            className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-bg-deep transition hover:brightness-110"
          >
            Run case
          </button>
          {active && (
            <>
              <button
                type="button"
                onClick={() => toggleFavorite(problem.slug, active.id)}
                className="rounded-xl border border-border-glass px-3 py-2 text-xs text-text-muted transition hover:text-accent-warm"
              >
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  Favorite
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteCase(problem.slug, active.id)}
                disabled={cases.length <= 1}
                className="rounded-xl border border-border-glass px-3 py-2 text-xs text-text-muted transition hover:text-danger disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </span>
              </button>
            </>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-text-muted">
          {problem.description}
        </p>
      </div>
    </div>
  );
}
