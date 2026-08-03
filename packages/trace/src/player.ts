/**
 * Pure TracePlayer — seek/step only. Hosts own play/pause clocks.
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

  get length(): number {
    return this._frames.length;
  }

  get index(): number {
    return this._index;
  }

  get current(): Frame | null {
    if (this._frames.length === 0) return null;
    return this._frames[this._index] ?? null;
  }

  get previous(): Frame | null {
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
