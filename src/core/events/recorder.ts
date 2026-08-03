import type { HighlightKind, Structures } from "@/core/types/execution";
import type { ExecutionEvent, EventMeta } from "./types";
import { eventsToStates } from "./reduce";

/**
 * Collects standardized execution events from reference solutions.
 * Never imports UI / Three / GSAP.
 */
export class EventRecorder {
  private events: ExecutionEvent[] = [];

  constructor(public readonly algorithmId: string) {}

  private record(event: ExecutionEvent) {
    this.events.push(event);
  }

  setStructure(structures: Structures, meta: EventMeta = {}) {
    this.record({ type: "setStructure", structures, ...meta });
    return this;
  }

  compare(
    opts: {
      indices?: number[];
      nodes?: string[];
      values?: unknown[];
    } & EventMeta,
  ) {
    this.record({ type: "compare", ...opts });
    return this;
  }

  swap(i: number, j: number, meta: EventMeta = {}) {
    this.record({ type: "swap", i, j, ...meta });
    return this;
  }

  highlight(
    opts: {
      indices?: number[];
      nodes?: string[];
      edges?: string[];
      kinds?: Record<number, HighlightKind>;
      sorted?: number[];
      clear?: boolean;
    } & EventMeta,
  ) {
    this.record({ type: "highlight", ...opts });
    return this;
  }

  movePointer(name: string, index: number | null, meta: EventMeta = {}) {
    this.record({ type: "movePointer", name, index, ...meta });
    return this;
  }

  visitNode(nodeId: string, edgeId?: string, meta: EventMeta = {}) {
    this.record({ type: "visitNode", nodeId, edgeId, ...meta });
    return this;
  }

  enqueue(value: number | string, meta: EventMeta = {}) {
    this.record({ type: "enqueue", value, ...meta });
    return this;
  }

  dequeue(value?: number | string, meta: EventMeta = {}) {
    this.record({ type: "dequeue", value, ...meta });
    return this;
  }

  push(value: number | string, meta: EventMeta = {}) {
    this.record({ type: "push", value, ...meta });
    return this;
  }

  pop(value?: number | string, meta: EventMeta = {}) {
    this.record({ type: "pop", value, ...meta });
    return this;
  }

  insertNode(
    nodeId: string,
    opts: { parentId?: string | null; value?: number | string } & EventMeta = {},
  ) {
    this.record({ type: "insertNode", nodeId, ...opts });
    return this;
  }

  deleteNode(nodeId: string, meta: EventMeta = {}) {
    this.record({ type: "deleteNode", nodeId, ...meta });
    return this;
  }

  updateVariable(name: string, value: unknown, meta: EventMeta = {}) {
    this.record({ type: "updateVariable", name, value, ...meta });
    return this;
  }

  returnValue(value: unknown, meta: EventMeta = {}) {
    this.record({ type: "returnValue", value, ...meta });
    return this;
  }

  setLine(line: number, meta: EventMeta = {}) {
    this.record({ type: "setLine", line, ...meta });
    return this;
  }

  describe(description: string, meta: EventMeta = {}) {
    this.record({ type: "describe", description, ...meta });
    return this;
  }

  done(value?: unknown, meta: EventMeta = {}) {
    this.record({ type: "done", value, ...meta });
    return this;
  }

  /** Raw event stream (for timeline engine). */
  getEvents(): ExecutionEvent[] {
    return this.events;
  }

  /** Materialize renderer-ready snapshots. */
  toStates() {
    return eventsToStates(this.algorithmId, this.events);
  }
}
