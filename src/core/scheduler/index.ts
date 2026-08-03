/**
 * Playback scheduling helpers (framework-agnostic).
 * React hosts (usePlaybackClock / useTracePlaybackClock) own rAF;
 * this module only computes intervals.
 */

/** Base milliseconds per step at 1× speed. */
export const BASE_STEP_MS = 900;

/** Duration for one step at the given speed multiplier. */
export function stepIntervalMs(speed: number): number {
  const s = Number.isFinite(speed) && speed > 0 ? speed : 1;
  return BASE_STEP_MS / s;
}

/** Clamp a frame index into [0, length-1]. */
export function clampStep(step: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(step, length - 1));
}
