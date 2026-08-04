"use client";

import { useMemo } from "react";
import type { ExecutionState } from "@/core/types/execution";
import { diffStates } from "@/core/animation/diff";
import { cn } from "@/lib/cn";

interface Props {
  state: ExecutionState | null;
  /** Prior step — used to highlight what changed. */
  previous?: ExecutionState | null;
  /** Compact mode for Trace Player hierarchy (Learning Layer owns narration). */
  compact?: boolean;
}

export function VariablesPanel({
  state,
  previous = null,
  compact = false,
}: Props) {
  const diff = useMemo(() => diffStates(previous, state), [previous, state]);
  const changed = useMemo(
    () => new Set(diff?.variableChanges ?? []),
    [diff],
  );

  const entries = Object.entries(state?.variables ?? {}).filter(
    ([k]) => !k.startsWith("__"),
  );
  const callStack = state?.callStack ?? [];
  const prevVars = previous?.variables ?? {};

  return (
    <div className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="shrink-0 border-b border-border-glass px-4 py-2.5 text-xs uppercase tracking-wider text-text-muted">
        Variables
        {changed.size > 0 && (
          <span className="ml-2 font-mono normal-case tracking-normal text-accent-warm">
            {changed.size} changed
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        {callStack.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-text-muted">
              Call stack
            </div>
            <div className="flex flex-col gap-1">
              {(compact ? callStack.slice(-4) : callStack).map((frame, i, arr) => {
                const depth = compact
                  ? callStack.length - arr.length + i
                  : i;
                return (
                  <div
                    key={`${frame}-${depth}`}
                    className={cn(
                      "rounded-md px-2 py-1 font-mono text-[11px]",
                      depth === callStack.length - 1
                        ? "bg-accent/15 text-accent"
                        : "bg-white/[0.04] text-text-muted",
                    )}
                    style={{ marginLeft: Math.min(depth, 4) * 8 }}
                  >
                    {frame}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted">No variables yet</p>
          ) : (
            <div className="space-y-1.5">
              {entries.map(([key, value]) => {
                const isChanged = changed.has(key);
                const before = prevVars[key];
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-lg px-2.5 py-1.5 font-mono text-xs transition-colors",
                      isChanged
                        ? "bg-accent-warm/15 ring-1 ring-accent-warm/40"
                        : "bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        isChanged ? "text-accent-warm" : "text-accent-2",
                      )}
                    >
                      {key}
                    </span>
                    <span className="break-all text-right text-text-primary">
                      {isChanged && before !== undefined && (
                        <span className="mr-2 text-text-muted line-through opacity-60">
                          {formatValue(before)}
                        </span>
                      )}
                      {formatValue(value)}
                    </span>
                  </div>
                );
              })}
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
