import type { HighlightKind, Structures } from "@/core/types/execution";

/** Standardized execution events — algorithm-agnostic animation vocabulary. */
export type ExecutionEventType =
  | "setStructure"
  | "compare"
  | "swap"
  | "highlight"
  | "movePointer"
  | "visitNode"
  | "enqueue"
  | "dequeue"
  | "push"
  | "pop"
  | "insertNode"
  | "deleteNode"
  | "updateVariable"
  | "returnValue"
  | "setLine"
  | "describe"
  | "done";

export interface EventMeta {
  line?: number;
  description?: string;
}

export type ExecutionEvent =
  | (EventMeta & {
      type: "setStructure";
      structures: Structures;
    })
  | (EventMeta & {
      type: "compare";
      indices?: number[];
      nodes?: string[];
      values?: unknown[];
    })
  | (EventMeta & {
      type: "swap";
      i: number;
      j: number;
    })
  | (EventMeta & {
      type: "highlight";
      indices?: number[];
      nodes?: string[];
      edges?: string[];
      kinds?: Record<number, HighlightKind>;
      sorted?: number[];
      clear?: boolean;
    })
  | (EventMeta & {
      type: "movePointer";
      name: string;
      index: number | null;
    })
  | (EventMeta & {
      type: "visitNode";
      nodeId: string;
      edgeId?: string;
    })
  | (EventMeta & {
      type: "enqueue";
      value: number | string;
    })
  | (EventMeta & {
      type: "dequeue";
      value?: number | string;
    })
  | (EventMeta & {
      type: "push";
      value: number | string;
    })
  | (EventMeta & {
      type: "pop";
      value?: number | string;
    })
  | (EventMeta & {
      type: "insertNode";
      nodeId: string;
      parentId?: string | null;
      value?: number | string;
    })
  | (EventMeta & {
      type: "deleteNode";
      nodeId: string;
    })
  | (EventMeta & {
      type: "updateVariable";
      name: string;
      value: unknown;
    })
  | (EventMeta & {
      type: "returnValue";
      value: unknown;
    })
  | (EventMeta & {
      type: "setLine";
      line: number;
    })
  | (EventMeta & {
      type: "describe";
      description: string;
    })
  | (EventMeta & {
      type: "done";
      value?: unknown;
    });
