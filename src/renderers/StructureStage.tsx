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

interface Props {
  state: ExecutionState | null;
  previous: ExecutionState | null;
  /** Playback speed multiplier — scales GSAP so motion finishes inside the step. */
  speed?: number;
}

/**
 * Route by structure presence only.
 * Never inspect language, algorithm id, or SDK — only ExecutionState.structures.
 */
export function StructureStage({ state, previous, speed = 1 }: Props) {
  if (!state) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        No execution state yet — upload a .trace.json or load the sample
      </div>
    );
  }

  const { structures } = state;

  if (structures.graph) {
    return <GraphRenderer state={state} />;
  }
  if ("tree" in structures && structures.tree !== undefined) {
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
  if (structures.array) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="min-h-0 flex-1">
          <ArrayRenderer state={state} previous={previous} speed={speed} />
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
