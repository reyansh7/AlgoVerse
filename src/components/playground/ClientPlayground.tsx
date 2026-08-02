"use client";

import dynamic from "next/dynamic";
import type { ProblemDefinition } from "@/core/types/execution";

/**
 * Playground is client-only. Browser extensions (form fillers) inject attributes
 * like `fdprocessedid` into buttons before hydration, which would otherwise
 * spam React with false hydration mismatches.
 */
const Playground = dynamic(
  () =>
    import("@/components/playground/Playground").then((m) => m.Playground),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-accent/20" />
          <p className="font-mono text-xs text-text-muted">Loading playground…</p>
        </div>
      </div>
    ),
  },
);

export function ClientPlayground({ problem }: { problem: ProblemDefinition }) {
  return <Playground problem={problem} />;
}
