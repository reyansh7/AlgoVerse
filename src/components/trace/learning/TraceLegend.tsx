"use client";

import type { LegendEntry } from "@/engine/explain";

interface Props {
  entries: LegendEntry[];
  compact?: boolean;
}

export function TraceLegend({ entries, compact = false }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">
        Legend
      </div>
      <ul className="flex flex-col gap-1.5">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-2 text-[11px] leading-snug"
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: e.color }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="font-medium text-text-primary">{e.label}</span>
              {!compact && (
                <span className="text-text-muted"> — {e.blurb}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
