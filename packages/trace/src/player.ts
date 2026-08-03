/**
 * Pure TracePlayer — seek/step only. Hosts own play/pause clocks.
 * Zero React. Zero browser APIs.
 */

import { reduceTrace } from "./reduce";
import type { Frame, TraceDocument } from "./schema";

export class TracePlayer {
  private doc: TraceDocument | null = null;
  private _frames: Frame[] = [];
  private _index = 0;

  /** Load a validated document and materialize frames. Resets index to 0. */
  load(doc: TraceDocument): void {
    this.doc = doc;
    this._frames = reduceTrace(doc);
    this._index = 0;
  }

  get document(): TraceDocument | null {
    return this.doc;
  }

  get frames(): readonly Frame[] {
    return this._frames;
  }

  /** Number of frames after reduce (one per event). */
  get length(): number {
    return this._frames.length;
  }

  /** Current frame index (0-based). */
  get index(): number {
    return this._index;
  }

  /** Frame at the current index, or null if empty. */
  get current(): Frame | null {
    if (this._frames.length === 0) return null;
    return this._frames[this._index] ?? null;
  }

  /** Alias for {@link current} — public TracePlayer contract. */
  get currentFrame(): Frame | null {
    return this.current;
  }

  /**
   * Frame immediately before the current index (for diff animation).
   * Navigation uses {@link previous}().
   */
  get previousFrame(): Frame | null {
    if (this._index <= 0) return null;
    return this._frames[this._index - 1] ?? null;
  }

  /** Jump to an absolute frame index (clamped). */
  seek(i: number): Frame | null {
    if (this._frames.length === 0) {
      this._index = 0;
      return null;
    }
    this._index = Math.max(0, Math.min(i, this._frames.length - 1));
    return this._frames[this._index];
  }

  /** Advance one frame. No-ops at the end. */
  next(): Frame | null {
    return this.step(1);
  }

  /** Step back one frame. No-ops at the start. */
  previous(): Frame | null {
    return this.step(-1);
  }

  /** Step forward (+1) or backward (-1). */
  step(delta: 1 | -1 = 1): Frame | null {
    return this.seek(this._index + delta);
  }

  restart(): Frame | null {
    return this.seek(0);
  }

  clear(): void {
    this.doc = null;
    this._frames = [];
    this._index = 0;
  }
}
