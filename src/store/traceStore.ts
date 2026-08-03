"use client";

/**
 * Holds the loaded TraceDocument (events + metadata).
 * Frames / scrubbing live in playerStore.
 */

import { create } from "zustand";
import type { TraceDocument, TraceEvent } from "@/core/trace";

interface TraceStoreState {
  document: TraceDocument | null;
  error: string | null;
  sourceLabel: string | null;
  setDocument: (doc: TraceDocument, label?: string) => void;
  setError: (message: string | null) => void;
  clear: () => void;
  events: () => TraceEvent[];
}

export const useTraceStore = create<TraceStoreState>((set, get) => ({
  document: null,
  error: null,
  sourceLabel: null,

  setDocument: (doc, label) =>
    set({ document: doc, error: null, sourceLabel: label ?? null }),

  setError: (message) => set({ error: message }),

  clear: () => set({ document: null, error: null, sourceLabel: null }),

  events: () => get().document?.events ?? [],
}));
