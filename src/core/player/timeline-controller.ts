import type { ExecutionState, Timeline } from "../types/execution";

export class TimelineController {
  private index = 0;

  constructor(private timeline: Timeline | null = null) {}

  setTimeline(timeline: Timeline | null) {
    this.timeline = timeline;
    this.index = 0;
  }

  getTimeline() {
    return this.timeline;
  }

  get length() {
    return this.timeline?.states.length ?? 0;
  }

  get currentIndex() {
    return this.index;
  }

  get current(): ExecutionState | null {
    if (!this.timeline || this.timeline.states.length === 0) return null;
    return this.timeline.states[this.index] ?? null;
  }

  get previous(): ExecutionState | null {
    if (!this.timeline || this.index <= 0) return null;
    return this.timeline.states[this.index - 1] ?? null;
  }

  jump(step: number) {
    if (!this.timeline) return;
    this.index = Math.max(0, Math.min(step, this.timeline.states.length - 1));
  }

  next() {
    if (!this.timeline) return;
    if (this.index < this.timeline.states.length - 1) this.index += 1;
  }

  prev() {
    if (this.index > 0) this.index -= 1;
  }

  restart() {
    this.index = 0;
  }

  atEnd() {
    if (!this.timeline || this.timeline.states.length === 0) return true;
    return this.index >= this.timeline.states.length - 1;
  }
}
