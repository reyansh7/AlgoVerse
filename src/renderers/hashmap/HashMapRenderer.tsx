"use client";

import type { ExecutionState } from "@/core/types/execution";

interface Props {
  state: ExecutionState | null;
}

export function HashMapRenderer({ state }: Props) {
  const map = state?.structures.hashmap ?? {};
  const entries = Object.entries(map);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="grid w-full max-w-md gap-2">
        {entries.length === 0 && (
          <p className="text-center text-text-muted">Empty hash map</p>
        )}
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-border-glass bg-white/5 px-4 py-2 font-mono text-sm"
          >
            <span className="text-accent-2">{key}</span>
            <span>{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
