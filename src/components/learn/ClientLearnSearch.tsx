"use client";

import dynamic from "next/dynamic";

/**
 * Learn search is client-only to avoid hydration noise from browser extensions
 * that inject attributes like `fdprocessedid` into form controls.
 */
const LearnSearch = dynamic(
  () => import("@/components/learn/LearnSearch").then((m) => m.LearnSearch),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-accent/20" />
          <p className="font-mono text-xs text-text-muted">Loading learn…</p>
        </div>
      </div>
    ),
  },
);

export function ClientLearnSearch() {
  return <LearnSearch />;
}
