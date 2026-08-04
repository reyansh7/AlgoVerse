"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  code: string[];
  activeLine: number | null;
  title?: string;
}

/**
 * Debugger-style source view: active line glows, previous fades, others dim.
 */
export function CodePanel({ code, activeLine, title = "Pseudocode" }: Props) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeLine]);

  return (
    <div className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="shrink-0 border-b border-border-glass px-4 py-2.5 text-xs uppercase tracking-wider text-text-muted">
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[12px] leading-6">
        {code.map((line, i) => {
          const isActive = activeLine === i;
          const isPrev = activeLine !== null && i === activeLine - 1;
          const isNext = activeLine !== null && i === activeLine + 1;
          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              className={cn(
                "flex gap-3 rounded-lg px-2 py-0.5 transition-colors duration-200",
                isActive && "bg-accent/20 text-accent ring-1 ring-inset ring-accent/35",
                isPrev && !isActive && "bg-white/[0.03] text-text-primary/55",
                isNext && !isActive && "text-text-muted/70",
                !isActive &&
                  !isPrev &&
                  !isNext &&
                  activeLine !== null &&
                  "text-text-muted/45",
                activeLine === null && "text-text-primary/80",
              )}
            >
              <span
                className={cn(
                  "w-5 shrink-0 text-right",
                  isActive ? "text-accent" : "text-text-muted/50",
                )}
              >
                {i + 1}
              </span>
              <span className="relative whitespace-pre">
                {line || " "}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full bg-accent/70"
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
