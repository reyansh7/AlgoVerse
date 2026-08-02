"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchLearnProblems, nearestLearnProblems } from "@/problems/search";
import { LEARN_PROBLEMS } from "@/problems/registry";

export function LearnSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchLearnProblems(query), [query]);
  const nearest = useMemo(() => nearestLearnProblems(query, 4), [query]);
  const empty = query.trim() && results.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-28">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Learn
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Search {LEARN_PROBLEMS.length} supported LeetCode problems by ID, title,
        or URL. Animations run curated reference solutions — not arbitrary user
        code. Each step includes a short explanation under the visualization.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. 704, Binary Search, or leetcode.com/problems/two-sum"
        className="glass mt-8 w-full rounded-2xl px-4 py-3.5 text-sm outline-none ring-accent/40 focus:ring-2"
        autoFocus
      />

      {empty ? (
        <div className="mt-8 rounded-2xl border border-white/10 p-6">
          <p className="text-sm text-text-muted">
            That problem isn&apos;t supported yet. Try one of these:
          </p>
          <ul className="mt-3 space-y-2">
            {nearest.map((p) => (
              <li key={p.metadata.slug}>
                <Link
                  href={`/learn/${p.metadata.slug}`}
                  className="text-accent hover:underline"
                >
                  {p.metadata.id}. {p.metadata.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {(results.length ? results : LEARN_PROBLEMS).map((p) => (
            <li key={p.metadata.slug}>
              <Link
                href={`/learn/${p.metadata.slug}`}
                className="glass flex items-center justify-between rounded-2xl px-4 py-3 transition hover:border-accent/40"
              >
                <div>
                  <div className="font-medium">
                    {p.metadata.id}. {p.metadata.title}
                  </div>
                  <div className="text-xs text-text-muted">
                    {p.metadata.difficulty} · {p.solutions.length} solution
                    {p.solutions.length === 1 ? "" : "s"} ·{" "}
                    {p.metadata.tags.slice(0, 3).join(", ")}
                  </div>
                </div>
                <span className="text-xs text-accent">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
