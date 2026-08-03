"use client";

/**
 * Selected event index in the EventLog (may differ from playback scrubber).
 */

import { create } from "zustand";

interface SelectionStoreState {
  selectedEventIndex: number | null;
  selectEvent: (index: number | null) => void;
}

export const useSelectionStore = create<SelectionStoreState>((set) => ({
  selectedEventIndex: null,
  selectEvent: (index) => set({ selectedEventIndex: index }),
}));
