"use client";

import { ArrayRenderer } from "../array/ArrayRenderer";
import type { ExecutionState } from "@/core/types/execution";

/** Heap visualized via array layout (structure-first reuse). */
export function HeapRenderer({
  state,
  previous,
}: {
  state: ExecutionState | null;
  previous: ExecutionState | null;
}) {
  return <ArrayRenderer state={state} previous={previous} />;
}
