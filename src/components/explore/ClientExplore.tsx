"use client";

import dynamic from "next/dynamic";

/**
 * Explore is client-only. Browser extensions (form fillers) inject attributes
 * like `fdprocessedid` into inputs/buttons before hydration.
 */
const ExploreCatalog = dynamic(
  () =>
    import("@/components/explore/ExploreCatalog").then((m) => m.ExploreCatalog),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-accent/20" />
          <p className="font-mono text-xs text-text-muted">Loading explore…</p>
        </div>
      </div>
    ),
  },
);

export function ClientExplore() {
  return <ExploreCatalog />;
}
