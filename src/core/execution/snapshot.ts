import type { ExecutionState, Highlights, Structures } from "../types/execution";

const emptyHighlights = (): Highlights => ({
  nodes: [],
  edges: [],
  indices: [],
  indexKinds: {},
  sorted: [],
});

export function createSnapshot(partial: {
  step: number;
  line: number;
  algorithm: string;
  variables?: Record<string, unknown>;
  structures?: Structures;
  highlights?: Partial<Highlights>;
  operation: string;
  description: string;
}): ExecutionState {
  return {
    step: partial.step,
    line: partial.line,
    algorithm: partial.algorithm,
    variables: partial.variables ?? {},
    structures: partial.structures ?? {},
    highlights: { ...emptyHighlights(), ...partial.highlights },
    operation: partial.operation,
    description: partial.description,
  };
}

export class SnapshotBuilder {
  private step = 0;
  private states: ExecutionState[] = [];

  constructor(private algorithm: string) {}

  emit(
    partial: Omit<Parameters<typeof createSnapshot>[0], "step" | "algorithm">,
  ) {
    this.states.push(
      createSnapshot({
        ...partial,
        step: this.step++,
        algorithm: this.algorithm,
      }),
    );
  }

  build(): ExecutionState[] {
    return this.states;
  }
}
