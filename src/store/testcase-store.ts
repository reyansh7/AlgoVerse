"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createId } from "@/lib/id";
import type { TestCase } from "@/core/types/execution";
import { PROBLEMS } from "@/problems/catalog";

type CasesByProblem = Record<string, TestCase[]>;

interface TestCaseState {
  cases: CasesByProblem;
  activeCaseId: Record<string, string | null>;
  ensureDefaults: (problemSlug: string) => void;
  addCase: (problemSlug: string, label: string, input: unknown) => TestCase;
  updateCase: (
    problemSlug: string,
    caseId: string,
    patch: Partial<Pick<TestCase, "label" | "input">>,
  ) => void;
  deleteCase: (problemSlug: string, caseId: string) => void;
  toggleFavorite: (problemSlug: string, caseId: string) => void;
  setActive: (problemSlug: string, caseId: string) => void;
  getCases: (problemSlug: string) => TestCase[];
  getActive: (problemSlug: string) => TestCase | null;
}

function seedDefaults(): CasesByProblem {
  const map: CasesByProblem = {};
  for (const p of PROBLEMS) {
    map[p.slug] = p.defaultCases.map((c) => ({
      ...c,
      id: c.id || createId("case"),
    }));
  }
  return map;
}

export const useTestCaseStore = create<TestCaseState>()(
  persist(
    (set, get) => ({
      cases: seedDefaults(),
      activeCaseId: Object.fromEntries(PROBLEMS.map((p) => [p.slug, p.defaultCases[0]?.id ?? null])),

      ensureDefaults: (problemSlug) => {
        const existing = get().cases[problemSlug];
        if (existing?.length) return;
        const problem = PROBLEMS.find((p) => p.slug === problemSlug);
        if (!problem) return;
        set((s) => ({
          cases: { ...s.cases, [problemSlug]: [...problem.defaultCases] },
          activeCaseId: {
            ...s.activeCaseId,
            [problemSlug]: problem.defaultCases[0]?.id ?? null,
          },
        }));
      },

      addCase: (problemSlug, label, input) => {
        const tc: TestCase = {
          id: createId("case"),
          label,
          input,
          createdAt: Date.now(),
        };
        set((s) => ({
          cases: {
            ...s.cases,
            [problemSlug]: [...(s.cases[problemSlug] ?? []), tc],
          },
          activeCaseId: { ...s.activeCaseId, [problemSlug]: tc.id },
        }));
        return tc;
      },

      updateCase: (problemSlug, caseId, patch) =>
        set((s) => ({
          cases: {
            ...s.cases,
            [problemSlug]: (s.cases[problemSlug] ?? []).map((c) =>
              c.id === caseId ? { ...c, ...patch } : c,
            ),
          },
        })),

      deleteCase: (problemSlug, caseId) =>
        set((s) => {
          const next = (s.cases[problemSlug] ?? []).filter((c) => c.id !== caseId);
          const active = s.activeCaseId[problemSlug];
          return {
            cases: { ...s.cases, [problemSlug]: next },
            activeCaseId: {
              ...s.activeCaseId,
              [problemSlug]:
                active === caseId ? (next[0]?.id ?? null) : active,
            },
          };
        }),

      toggleFavorite: (problemSlug, caseId) =>
        set((s) => ({
          cases: {
            ...s.cases,
            [problemSlug]: (s.cases[problemSlug] ?? []).map((c) =>
              c.id === caseId ? { ...c, favorite: !c.favorite } : c,
            ),
          },
        })),

      setActive: (problemSlug, caseId) =>
        set((s) => ({
          activeCaseId: { ...s.activeCaseId, [problemSlug]: caseId },
        })),

      getCases: (problemSlug) => get().cases[problemSlug] ?? [],

      getActive: (problemSlug) => {
        const cases = get().cases[problemSlug] ?? [];
        const id = get().activeCaseId[problemSlug];
        return cases.find((c) => c.id === id) ?? cases[0] ?? null;
      },
    }),
    { name: "algoverse-testcases" },
  ),
);
