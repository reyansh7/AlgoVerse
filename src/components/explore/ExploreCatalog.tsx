"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { PROBLEMS, searchProblems } from "@/problems/catalog";
import type { ProblemCategory } from "@/core/types/execution";
import { useFavoritesStore } from "@/store/favorites-store";
import { useHasMounted } from "@/hooks/useHasMounted";
import { cn } from "@/lib/cn";

const CATEGORIES: Array<ProblemCategory | "all"> = [
  "all",
  "search",
  "sort",
  "graph",
  "tree",
  "list",
  "dp",
];

export function ExploreCatalog() {
  const mounted = useHasMounted();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const favorites = useFavoritesStore((s) => s.problemSlugs);
  const toggleFavorite = useFavoritesStore((s) => s.toggleProblem);

  const results = useMemo(() => {
    let list = searchProblems(query);
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    return list;
  }, [query, category]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-28">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Explore
        </h1>
        <p className="mt-3 text-text-muted">
          Search by problem ID or name. Every algorithm emits deterministic state
          snapshots for the same visualization engine.
        </p>
      </div>

      <div className="glass mb-6 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AV-001, Binary Search, BFS…"
            className="w-full rounded-xl border border-transparent bg-black/25 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent/30"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs capitalize transition",
                category === c
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((problem) => {
          const fav = mounted && favorites.includes(problem.slug);
          return (
            <div
              key={problem.slug}
              className="glass group relative rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-accent/30"
            >
              <button
                type="button"
                onClick={() => toggleFavorite(problem.slug)}
                className="absolute right-4 top-4 text-text-muted transition hover:text-accent-warm"
                aria-label="Toggle favorite"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    fav && "fill-accent-warm text-accent-warm",
                  )}
                />
              </button>
              <div className="font-mono text-xs text-accent-2">{problem.id}</div>
              <Link
                href={`/playground/${problem.slug}`}
                className="mt-1 block font-display text-xl font-semibold tracking-tight transition group-hover:text-accent"
              >
                {problem.name}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                {problem.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted">
                <span className="rounded-md bg-white/5 px-2 py-1">
                  {problem.category}
                </span>
                <span className="rounded-md bg-white/5 px-2 py-1">
                  {problem.difficulty}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {results.length === 0 && (
        <p className="mt-10 text-center text-text-muted">
          No problems match “{query}”. Try an ID like AV-005.
        </p>
      )}

      <p className="mt-10 text-center text-xs text-text-muted">
        {PROBLEMS.length} supported algorithms in the catalog
      </p>
    </div>
  );
}
