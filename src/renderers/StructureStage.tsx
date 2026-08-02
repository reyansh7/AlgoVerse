"use client";

import type { ExecutionState } from "@/core/types/execution";
import { ArrayRenderer } from "./array/ArrayRenderer";
import { LinkedListRenderer } from "./linked-list/LinkedListRenderer";
import { DPTableRenderer } from "./dp-table/DPTableRenderer";
import { GraphRenderer } from "./graph/GraphRenderer";
import { TreeRenderer } from "./tree/TreeRenderer";
import { QueueStackRenderer } from "./queue/QueueRenderer";
import { StackRenderer } from "./stack/StackRenderer";
import { HashMapRenderer } from "./hashmap/HashMapRenderer";
import { HeapRenderer } from "./heap/HeapRenderer";
import { TrieRenderer } from "./trie/TrieRenderer";

interface Props {
  state: ExecutionState | null;
  previous: ExecutionState | null;
}

export function StructureStage({ state, previous }: Props) {
  if (!state) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        Run a test case to begin visualization
      </div>
    );
  }

  const { structures } = state;

  if (structures.graph) {
    return <GraphRenderer state={state} />;
  }
  if ("tree" in structures && structures.tree !== undefined) {
    // Prefer dedicated trie renderer when hashmap of children isn't present
    if (state.algorithm.includes("trie") || state.algorithm.includes("208")) {
      return <TrieRenderer state={state} />;
    }
    return <TreeRenderer state={state} />;
  }
  if (structures.linkedList) {
    return <LinkedListRenderer state={state} />;
  }
  if (structures.table) {
    return <DPTableRenderer state={state} />;
  }
  if (structures.queue && !structures.array) {
    return <QueueStackRenderer state={state} mode="queue" />;
  }
  if (structures.stack && !structures.array) {
    return <StackRenderer state={state} mode="stack" />;
  }
  if (structures.hashmap && !structures.array) {
    return <HashMapRenderer state={state} />;
  }
  if (
    structures.array &&
    (state.algorithm.includes("heap") || state.algorithm.includes("215-heap"))
  ) {
    return <HeapRenderer state={state} previous={previous} />;
  }
  if (structures.array) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="min-h-0 flex-1">
          <ArrayRenderer state={state} previous={previous} />
        </div>
        {structures.hashmap ? (
          <div className="h-28 shrink-0">
            <HashMapRenderer state={state} />
          </div>
        ) : null}
        {structures.stack ? (
          <div className="h-24 shrink-0">
            <StackRenderer state={state} mode="stack" />
          </div>
        ) : null}
        {structures.queue ? (
          <div className="h-24 shrink-0">
            <QueueStackRenderer state={state} mode="queue" />
          </div>
        ) : null}
      </div>
    );
  }
  if (structures.queue) {
    return <QueueStackRenderer state={state} mode="queue" />;
  }
  if (structures.stack) {
    return <StackRenderer state={state} mode="stack" />;
  }
  if (structures.hashmap) {
    return <HashMapRenderer state={state} />;
  }

  return (
    <div className="flex h-full items-center justify-center text-text-muted">
      No renderable structure in this state
    </div>
  );
}
