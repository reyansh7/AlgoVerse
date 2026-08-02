"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  problemSlugs: string[];
  toggleProblem: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      problemSlugs: [],
      toggleProblem: (slug) =>
        set((s) => ({
          problemSlugs: s.problemSlugs.includes(slug)
            ? s.problemSlugs.filter((x) => x !== slug)
            : [...s.problemSlugs, slug],
        })),
      isFavorite: (slug) => get().problemSlugs.includes(slug),
    }),
    { name: "algoverse-favorites" },
  ),
);
