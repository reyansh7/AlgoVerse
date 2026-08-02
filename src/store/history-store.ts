"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createId } from "@/lib/id";
import type { SavedExecution, Timeline } from "@/core/types/execution";

interface HistoryState {
  executions: SavedExecution[];
  compareLeftId: string | null;
  compareRightId: string | null;
  saveExecution: (
    algorithmId: string,
    label: string,
    timeline: Timeline,
  ) => SavedExecution;
  removeExecution: (id: string) => void;
  setCompare: (side: "left" | "right", id: string | null) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      executions: [],
      compareLeftId: null,
      compareRightId: null,

      saveExecution: (algorithmId, label, timeline) => {
        const entry: SavedExecution = {
          id: createId("exec"),
          algorithmId,
          label,
          timeline,
          savedAt: Date.now(),
        };
        set((s) => ({
          executions: [entry, ...s.executions].slice(0, 40),
        }));
        return entry;
      },

      removeExecution: (id) =>
        set((s) => ({
          executions: s.executions.filter((e) => e.id !== id),
          compareLeftId: s.compareLeftId === id ? null : s.compareLeftId,
          compareRightId: s.compareRightId === id ? null : s.compareRightId,
        })),

      setCompare: (side, id) =>
        set(
          side === "left"
            ? { compareLeftId: id }
            : { compareRightId: id },
        ),
    }),
    { name: "algoverse-history" },
  ),
);
