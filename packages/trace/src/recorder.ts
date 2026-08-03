/**
 * TypeScript Trace recorder — mirrors the Python SDK surface for tests/adapters.
 *
 * Pass `metadata: { initial: { array: [...] } }` for v0.1 structure bootstrap.
 * `assign` is variables-only and never seeds structures.
 */

import type { TraceEvent } from "./events";
import { TRACE_VERSION, type TraceDocument, type TraceSource } from "./schema";
import { serializeTrace } from "./serializer";

export class TraceRecorder {
  private events: TraceEvent[] = [];
  private t = 0;
  private readonly algorithm: string;
  private readonly language: string;
  private source?: TraceSource;
  private metadata: TraceDocument["metadata"];

  constructor(opts: {
    algorithm: string;
    language?: string;
    source?: TraceSource;
    /** Required — v0.1 structures seed only from metadata.initial.array. */
    metadata: TraceDocument["metadata"];
  }) {
    this.algorithm = opts.algorithm;
    this.language = opts.language ?? "typescript";
    this.source = opts.source;
    this.metadata = opts.metadata;
  }

  private nextTs(): number {
    this.t += 1;
    return this.t;
  }

  assign(
    name: string,
    value: unknown,
    opts?: { line?: number; description?: string },
  ): this {
    this.events.push({
      type: "assign",
      timestamp: this.nextTs(),
      line: opts?.line,
      description: opts?.description,
      data: { name, value },
    });
    return this;
  }

  compare(
    i: number,
    j: number,
    opts?: { values?: unknown[]; line?: number; description?: string },
  ): this {
    this.events.push({
      type: "compare",
      timestamp: this.nextTs(),
      line: opts?.line,
      description: opts?.description,
      data: { i, j, values: opts?.values },
    });
    return this;
  }

  swap(
    i: number,
    j: number,
    opts?: { line?: number; description?: string },
  ): this {
    this.events.push({
      type: "swap",
      timestamp: this.nextTs(),
      line: opts?.line,
      description: opts?.description,
      data: { i, j },
    });
    return this;
  }

  call(
    frame: string,
    opts?: {
      args?: Record<string, unknown>;
      line?: number;
      description?: string;
    },
  ): this {
    this.events.push({
      type: "call",
      timestamp: this.nextTs(),
      line: opts?.line,
      description: opts?.description,
      data: { frame, args: opts?.args },
    });
    return this;
  }

  return(
    frame: string,
    opts?: { value?: unknown; line?: number; description?: string },
  ): this {
    this.events.push({
      type: "return",
      timestamp: this.nextTs(),
      line: opts?.line,
      description: opts?.description,
      data: { frame, value: opts?.value },
    });
    return this;
  }

  line(line: number, opts?: { description?: string }): this {
    this.events.push({
      type: "line",
      timestamp: this.nextTs(),
      line,
      description: opts?.description,
      data: { line },
    });
    return this;
  }

  highlight(opts: {
    indices?: number[];
    kinds?: Record<string, string>;
    sorted?: number[];
    clear?: boolean;
    line?: number;
    description?: string;
  }): this {
    this.events.push({
      type: "highlight",
      timestamp: this.nextTs(),
      line: opts.line,
      description: opts.description,
      data: {
        indices: opts.indices,
        kinds: opts.kinds,
        sorted: opts.sorted,
        clear: opts.clear,
      },
    });
    return this;
  }

  toDocument(): TraceDocument {
    return {
      version: TRACE_VERSION,
      language: this.language,
      algorithm: this.algorithm,
      source: this.source,
      metadata: this.metadata,
      events: [...this.events],
    };
  }

  toJSON(pretty = true): string {
    return serializeTrace(this.toDocument(), pretty);
  }

  getEvents(): TraceEvent[] {
    return [...this.events];
  }
}
