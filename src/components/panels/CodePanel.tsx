"use client";

import { cn } from "@/lib/cn";

interface Props {
  code: string[];
  activeLine: number | null;
}

export function CodePanel({ code, activeLine }: Props) {
  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="border-b border-border-glass px-4 py-3 text-xs uppercase tracking-wider text-text-muted">
        Pseudocode
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-[12px] leading-6">
        {code.map((line, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 rounded-lg px-2 py-0.5 transition-colors",
              activeLine === i && "bg-accent/15 text-accent",
            )}
          >
            <span className="w-5 shrink-0 text-right text-text-muted/70">
              {i + 1}
            </span>
            <span className="whitespace-pre">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
