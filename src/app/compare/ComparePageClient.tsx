"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ExecutionState } from "@/core/types/execution";
import { StructureStage } from "@/renderers/StructureStage";
import { useHistoryStore } from "@/store/history-store";
import { cn } from "@/lib/cn";

export default function ComparePage() {
  const executions = useHistoryStore((s) => s.executions);
  const compareLeftId = useHistoryStore((s) => s.compareLeftId);
  const compareRightId = useHistoryStore((s) => s.compareRightId);
  const setCompare = useHistoryStore((s) => s.setCompare);
  const removeExecution = useHistoryStore((s) => s.removeExecution);

  const left = executions.find((e) => e.id === compareLeftId) ?? null;
  const right = executions.find((e) => e.id === compareRightId) ?? null;

  const [leftStep, setLeftStep] = useState(0);
  const [rightStep, setRightStep] = useState(0);
  const [synced, setSynced] = useState(true);

  const leftState = left?.timeline.states[leftStep] ?? null;
  const rightState = right?.timeline.states[rightStep] ?? null;
  const leftPrev = left?.timeline.states[leftStep - 1] ?? null;
  const rightPrev = right?.timeline.states[rightStep - 1] ?? null;

  const maxLeft = Math.max(0, (left?.timeline.states.length ?? 1) - 1);
  const maxRight = Math.max(0, (right?.timeline.states.length ?? 1) - 1);

  const scrub = (side: "left" | "right", step: number) => {
    if (synced) {
      setLeftStep(Math.min(step, maxLeft));
      setRightStep(Math.min(step, maxRight));
    } else if (side === "left") {
      setLeftStep(step);
    } else {
      setRightStep(step);
    }
  };

  const options = useMemo(
    () =>
      executions.map((e) => ({
        id: e.id,
        label: `${e.label} · ${new Date(e.savedAt).toLocaleString()}`,
      })),
    [executions],
  );

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] px-4 pb-16 pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Compare
          </h1>
          <p className="mt-2 max-w-xl text-text-muted">
            Replay and compare saved executions side by side. Save runs from any
            playground session.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={synced}
            onChange={(e) => setSynced(e.target.checked)}
            className="accent-accent"
          />
          Sync scrubbing
        </label>
      </div>

      {executions.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-text-muted">No saved executions yet.</p>
          <Link
            href="/explore"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg-deep"
          >
            Explore algorithms
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <SelectRun
              label="Left"
              value={compareLeftId}
              options={options}
              onChange={(id) => {
                setCompare("left", id);
                setLeftStep(0);
              }}
            />
            <SelectRun
              label="Right"
              value={compareRightId}
              options={options}
              onChange={(id) => {
                setCompare("right", id);
                setRightStep(0);
              }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ComparePane
              title={left?.label ?? "Select a run"}
              state={leftState}
              previous={leftPrev}
              step={leftStep}
              max={maxLeft}
              onScrub={(v) => scrub("left", v)}
              onRemove={
                left ? () => removeExecution(left.id) : undefined
              }
            />
            <ComparePane
              title={right?.label ?? "Select a run"}
              state={rightState}
              previous={rightPrev}
              step={rightStep}
              max={maxRight}
              onScrub={(v) => scrub("right", v)}
              onRemove={
                right ? () => removeExecution(right.id) : undefined
              }
            />
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm uppercase tracking-wider text-text-muted">
              History
            </h2>
            <div className="space-y-2">
              {executions.map((e) => (
                <div
                  key={e.id}
                  className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{e.label}</div>
                    <div className="font-mono text-[11px] text-text-muted">
                      {e.algorithmId} · {e.timeline.states.length} steps
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCompare("left", e.id);
                        setLeftStep(0);
                      }}
                      className="rounded-lg bg-white/5 px-2 py-1 text-xs text-text-muted hover:text-text-primary"
                    >
                      Set left
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCompare("right", e.id);
                        setRightStep(0);
                      }}
                      className="rounded-lg bg-white/5 px-2 py-1 text-xs text-text-muted hover:text-text-primary"
                    >
                      Set right
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SelectRun({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="glass flex flex-col gap-1 rounded-xl px-3 py-2 text-xs text-text-muted">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border-glass bg-black/30 px-2 py-2 text-sm text-text-primary outline-none"
      >
        <option value="" disabled>
          Choose execution…
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparePane({
  title,
  state,
  previous,
  step,
  max,
  onScrub,
  onRemove,
}: {
  title: string;
  state: ExecutionState | null;
  previous: ExecutionState | null;
  step: number;
  max: number;
  onScrub: (step: number) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="glass flex min-h-[420px] flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border-glass px-4 py-3">
        <div className="truncate text-sm font-medium">{title}</div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn("text-xs text-text-muted hover:text-danger")}
          >
            Remove
          </button>
        )}
      </div>
      <div className="relative min-h-[360px] flex-1">
        <div className="absolute inset-0">
          <StructureStage state={state} previous={previous} />
        </div>
      </div>
      <div className="border-t border-border-glass px-4 py-3">
        <input
          type="range"
          min={0}
          max={max}
          value={step}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="w-full accent-accent"
          disabled={max === 0 && !state}
        />
        <div className="mt-1 font-mono text-[11px] text-text-muted">
          Step {state ? step + 1 : 0} · {state?.operation ?? "—"}
        </div>
      </div>
    </div>
  );
}
