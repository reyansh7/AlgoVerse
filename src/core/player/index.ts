/**
 * Pure players — no React.
 * - TracePlayer: portable Trace documents (@algoverse/trace)
 * - TimelineController: Learn/Playground ExecutionState timelines
 */
export {
  TracePlayer,
  reduceTrace,
  parseTrace,
  validateTrace,
} from "../trace";
export type { TraceDocument, Frame } from "../trace";

export { TimelineController } from "./timeline-controller";
