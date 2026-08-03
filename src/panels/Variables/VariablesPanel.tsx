"use client";

import type { ExecutionState } from "@/core/types/execution";
import { HIGHLIGHT_COLORS } from "@/lib/highlight-colors";

interface Props {
  state: ExecutionState | null;
}

export function VariablesPanel({ state }: Props) {
  const entries = Object.entries(state?.variables ?? {});
  const kinds = state?.highlights.indexKinds ?? {};
  const sorted = state?.highlights.sorted ?? [];

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="border-b border-border-glass px-4 py-3 text-xs uppercase tracking-wider text-text-muted">
        State
      </div>
      <div className="space-y-3 overflow-auto p-4">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">
            Operation
          </div>
          <div className="font-mono text-sm text-accent">
            {state?.operation ?? "—"}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">
            Description
          </div>
          <p className="text-sm leading-relaxed text-text-primary/90">
            {state?.description ?? "Run an execution to see step details."}
          </p>
        </div>
        {(Object.keys(kinds).length > 0 || sorted.length > 0) && (
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">
              Highlights
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(kinds).map(([idx, kind]) => (
                <span
                  key={`${idx}-${kind}`}
                  className="rounded-md px-2 py-0.5 font-mono text-[10px]"
                  style={{
                    color: HIGHLIGHT_COLORS[kind],
                    backgroundColor: `${HIGHLIGHT_COLORS[kind]}22`,
                    border: `1px solid ${HIGHLIGHT_COLORS[kind]}55`,
                  }}
                >
                  [{idx}] {kind}
                </span>
              ))}
              {sorted.length > 0 && (
                <span
                  className="rounded-md px-2 py-0.5 font-mono text-[10px]"
                  style={{
                    color: HIGHLIGHT_COLORS.sorted,
                    backgroundColor: `${HIGHLIGHT_COLORS.sorted}22`,
                    border: `1px solid ${HIGHLIGHT_COLORS.sorted}55`,
                  }}
                >
                  sorted ×{sorted.length}
                </span>
              )}
            </div>
          </div>
        )}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">
            Variables
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted">No variables yet</p>
          ) : (
            <div className="space-y-1.5">
              {entries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 rounded-lg bg-white/5 px-2.5 py-1.5 font-mono text-xs"
                >
                  <span className="text-accent-2">{key}</span>
                  <span className="break-all text-right text-text-primary">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
