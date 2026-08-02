"use client";

import { TreeRenderer } from "../tree/TreeRenderer";
import type { ExecutionState } from "@/core/types/execution";

/** Trie shares tree renderer until a dedicated trie structure is emitted. */
export function TrieRenderer({ state }: { state: ExecutionState | null }) {
  return <TreeRenderer state={state} />;
}
