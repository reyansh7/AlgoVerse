import type { ProblemPackage } from "./types";
import { LEARN_PROBLEMS, getProblemBySlug, getProblemById } from "./registry";

/** Extract LeetCode problem id or slug from free text / URL. */
export function parseLeetCodeQuery(raw: string): {
  id?: number;
  slug?: string;
  text: string;
} {
  const text = raw.trim();
  if (!text) return { text: "" };

  const urlMatch = text.match(
    /leetcode\.com\/problems\/([a-z0-9-]+)/i,
  );
  if (urlMatch) return { slug: urlMatch[1].toLowerCase(), text };

  const idOnly = text.match(/^#?(\d{1,5})$/);
  if (idOnly) return { id: Number(idOnly[1]), text };

  const idPrefix = text.match(/^(\d{1,5})\s*[-:.]?\s*(.+)$/);
  if (idPrefix) {
    return { id: Number(idPrefix[1]), slug: slugify(idPrefix[2]), text };
  }

  return { slug: slugify(text), text };
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function scoreProblem(p: ProblemPackage, q: string, id?: number, slug?: string) {
  const m = p.metadata;
  let score = 0;
  if (id !== undefined && m.id === id) score += 100;
  if (slug && m.slug === slug) score += 80;
  if (slug && m.slug.includes(slug)) score += 40;
  const hay = `${m.id} ${m.title} ${m.slug} ${m.tags.join(" ")}`.toLowerCase();
  const needle = q.toLowerCase();
  if (hay.includes(needle)) score += 20;
  for (const part of needle.split(/\s+/).filter(Boolean)) {
    if (hay.includes(part)) score += 5;
  }
  return score;
}

export function searchLearnProblems(query: string): ProblemPackage[] {
  const trimmed = query.trim();
  if (!trimmed) return [...LEARN_PROBLEMS];

  const { id, slug, text } = parseLeetCodeQuery(trimmed);
  if (id !== undefined) {
    const exact = getProblemById(id);
    if (exact) return [exact];
  }
  if (slug) {
    const exact = getProblemBySlug(slug);
    if (exact) return [exact];
  }

  return LEARN_PROBLEMS.map((p) => ({
    p,
    score: scoreProblem(p, text, id, slug),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function nearestLearnProblems(query: string, limit = 5): ProblemPackage[] {
  const { id, slug, text } = parseLeetCodeQuery(query);
  return LEARN_PROBLEMS.map((p) => ({
    p,
    score: scoreProblem(p, text || query, id, slug),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}
