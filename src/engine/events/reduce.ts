import type {
  ExecutionState,
  Highlights,
  Structures,
} from "@/core/types/execution";
import { mark } from "@/lib/highlight-colors";
import type { ExecutionEvent } from "./types";

export interface FrameState {
  line: number;
  variables: Record<string, unknown>;
  structures: Structures;
  highlights: Highlights;
  operation: string;
  description: string;
}

export function createEmptyFrame(): FrameState {
  return {
    line: 0,
    variables: {},
    structures: {},
    highlights: mark({}),
    operation: "init",
    description: "",
  };
}

function cloneStructures(s: Structures): Structures {
  return {
    array: s.array ? [...s.array] : undefined,
    tree: s.tree,
    graph: s.graph
      ? {
          nodes: s.graph.nodes.map((n) => ({ ...n })),
          edges: s.graph.edges.map((e) => ({ ...e })),
        }
      : undefined,
    queue: s.queue ? [...s.queue] : undefined,
    stack: s.stack ? [...s.stack] : undefined,
    linkedList: s.linkedList
      ? {
          nodes: s.linkedList.nodes.map((n) => ({ ...n })),
          head: s.linkedList.head,
        }
      : undefined,
    table: s.table ? s.table.map((row) => [...row]) : undefined,
    hashmap: s.hashmap ? { ...s.hashmap } : undefined,
  };
}

/** Apply one event onto a mutable frame (in place). */
export function applyEvent(frame: FrameState, event: ExecutionEvent): void {
  if (event.line !== undefined) frame.line = event.line;
  if (event.description !== undefined) frame.description = event.description;
  frame.operation = event.type;

  switch (event.type) {
    case "setStructure":
      frame.structures = cloneStructures(event.structures);
      break;
    case "compare": {
      const kinds: Record<number, "comparing"> = {};
      for (const i of event.indices ?? []) kinds[i] = "comparing";
      frame.highlights = {
        ...mark(kinds, frame.highlights.sorted),
        nodes: event.nodes ?? [],
        edges: frame.highlights.edges,
      };
      break;
    }
    case "swap": {
      const arr = frame.structures.array;
      if (arr) {
        const next = [...arr];
        const tmp = next[event.i];
        next[event.i] = next[event.j];
        next[event.j] = tmp;
        frame.structures = { ...frame.structures, array: next };
      }
      frame.highlights = mark(
        { [event.i]: "swapped", [event.j]: "swapped" },
        frame.highlights.sorted,
      );
      break;
    }
    case "highlight":
      if (event.clear) {
        frame.highlights = mark({}, event.sorted ?? []);
      } else {
        frame.highlights = {
          indices: event.indices ?? Object.keys(event.kinds ?? {}).map(Number),
          indexKinds: event.kinds ?? {},
          sorted: event.sorted ?? frame.highlights.sorted ?? [],
          nodes: event.nodes ?? frame.highlights.nodes,
          edges: event.edges ?? frame.highlights.edges,
        };
      }
      break;
    case "movePointer":
      frame.variables = { ...frame.variables, [event.name]: event.index };
      break;
    case "visitNode": {
      const nodes = new Set(frame.highlights.nodes);
      nodes.add(event.nodeId);
      const edges = new Set(frame.highlights.edges);
      if (event.edgeId) edges.add(event.edgeId);
      frame.highlights = {
        ...frame.highlights,
        nodes: [...nodes],
        edges: [...edges],
      };
      frame.variables = {
        ...frame.variables,
        current: event.nodeId,
      };
      break;
    }
    case "enqueue": {
      const q = [...(frame.structures.queue ?? []), event.value];
      frame.structures = { ...frame.structures, queue: q };
      frame.variables = { ...frame.variables, enqueued: event.value };
      break;
    }
    case "dequeue": {
      const q = [...(frame.structures.queue ?? [])];
      const value = q.shift();
      frame.structures = { ...frame.structures, queue: q };
      frame.variables = {
        ...frame.variables,
        dequeued: event.value ?? value,
      };
      break;
    }
    case "push": {
      const st = [...(frame.structures.stack ?? []), event.value];
      frame.structures = { ...frame.structures, stack: st };
      frame.variables = { ...frame.variables, pushed: event.value };
      break;
    }
    case "pop": {
      const st = [...(frame.structures.stack ?? [])];
      const value = st.pop();
      frame.structures = { ...frame.structures, stack: st };
      frame.variables = {
        ...frame.variables,
        popped: event.value ?? value,
      };
      break;
    }
    case "insertNode":
    case "deleteNode":
      // Structure payload should be updated via setStructure by the solution
      frame.variables = {
        ...frame.variables,
        lastNodeOp: event.type,
        nodeId: event.nodeId,
      };
      break;
    case "updateVariable":
      frame.variables = { ...frame.variables, [event.name]: event.value };
      break;
    case "returnValue":
      frame.variables = { ...frame.variables, result: event.value };
      break;
    case "setLine":
      frame.line = event.line;
      break;
    case "describe":
      frame.description = event.description;
      break;
    case "done":
      if (event.value !== undefined) {
        frame.variables = { ...frame.variables, result: event.value };
      }
      break;
  }
}

/** Reduce an event stream into ExecutionState snapshots for renderers. */
export function eventsToStates(
  algorithmId: string,
  events: ExecutionEvent[],
): ExecutionState[] {
  const frame = createEmptyFrame();
  const states: ExecutionState[] = [];

  for (let i = 0; i < events.length; i++) {
    applyEvent(frame, events[i]);
    states.push({
      step: i,
      line: frame.line,
      algorithm: algorithmId,
      variables: { ...frame.variables },
      structures: cloneStructures(frame.structures),
      highlights: {
        nodes: [...frame.highlights.nodes],
        edges: [...frame.highlights.edges],
        indices: [...frame.highlights.indices],
        indexKinds: { ...frame.highlights.indexKinds },
        sorted: [...(frame.highlights.sorted ?? [])],
      },
      operation: frame.operation,
      description: frame.description,
    });
  }

  return states;
}
