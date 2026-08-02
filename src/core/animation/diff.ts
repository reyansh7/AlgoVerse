import type { ExecutionState, Highlights, Structures } from "../types/execution";

export interface StateDiff {
  stepFrom: number;
  stepTo: number;
  operation: string;
  description: string;
  highlights: Highlights;
  previousHighlights: Highlights;
  variableChanges: string[];
  structureKeysChanged: (keyof Structures)[];
  arrayChanged: boolean;
  swappedIndices: [number, number] | null;
}

function arraySwapHint(
  prev?: (number | string)[],
  curr?: (number | string)[],
): [number, number] | null {
  if (!prev || !curr || prev.length !== curr.length) return null;
  const diffs: number[] = [];
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== curr[i]) diffs.push(i);
  }
  if (diffs.length === 2) {
    const [a, b] = diffs;
    if (prev[a] === curr[b] && prev[b] === curr[a]) return [a, b];
  }
  return null;
}

export function diffStates(
  prev: ExecutionState | null,
  curr: ExecutionState | null,
): StateDiff | null {
  if (!curr) return null;

  const previousHighlights = prev?.highlights ?? {
    nodes: [],
    edges: [],
    indices: [],
  };

  const variableChanges: string[] = [];
  const prevVars = prev?.variables ?? {};
  for (const key of new Set([
    ...Object.keys(prevVars),
    ...Object.keys(curr.variables),
  ])) {
    if (JSON.stringify(prevVars[key]) !== JSON.stringify(curr.variables[key])) {
      variableChanges.push(key);
    }
  }

  const structureKeysChanged = (
    Object.keys(curr.structures) as (keyof Structures)[]
  ).filter((key) => {
    return (
      JSON.stringify(prev?.structures[key]) !==
      JSON.stringify(curr.structures[key])
    );
  });

  return {
    stepFrom: prev?.step ?? -1,
    stepTo: curr.step,
    operation: curr.operation,
    description: curr.description,
    highlights: curr.highlights,
    previousHighlights,
    variableChanges,
    structureKeysChanged,
    arrayChanged: structureKeysChanged.includes("array"),
    swappedIndices: arraySwapHint(prev?.structures.array, curr.structures.array),
  };
}
