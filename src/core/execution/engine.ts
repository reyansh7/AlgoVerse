import { createId } from "@/lib/id";
import type { AlgorithmAdapter, Timeline } from "../types/execution";
import { getAdapter } from "./registry";

export function runAlgorithm(algorithmId: string, input: unknown): Timeline {
  const adapter = getAdapter(algorithmId);
  if (!adapter) {
    throw new Error(`Unknown algorithm: ${algorithmId}`);
  }
  return executeAdapter(adapter, input);
}

export function executeAdapter<TInput>(
  adapter: AlgorithmAdapter<TInput>,
  input: TInput,
): Timeline {
  const states = adapter.execute(input);
  return {
    id: createId("timeline"),
    algorithmId: adapter.id,
    input,
    states,
    createdAt: Date.now(),
  };
}
