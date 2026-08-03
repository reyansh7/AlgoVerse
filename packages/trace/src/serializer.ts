/**
 * Parse / stringify / validate TraceDocument JSON.
 * Zero dependencies — intentional for CLI and embeddable use.
 */

import { TRACE_EVENT_TYPES, type TraceEvent, type TraceEventType } from "./events";
import { TRACE_VERSION, type TraceDocument } from "./schema";

export class TraceValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string = "",
  ) {
    super(path ? `${path}: ${message}` : message);
    this.name = "TraceValidationError";
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function assertEvent(raw: unknown, path: string): TraceEvent {
  if (!isObject(raw)) {
    throw new TraceValidationError(
      "event must be an object — each events[] item needs type, timestamp, and data",
      path,
    );
  }
  const type = raw.type;
  if (typeof type !== "string" || !TRACE_EVENT_TYPES.includes(type as TraceEventType)) {
    throw new TraceValidationError(
      `type must be one of: ${TRACE_EVENT_TYPES.join(", ")}`,
      `${path}.type`,
    );
  }
  if (typeof raw.timestamp !== "number" || !Number.isFinite(raw.timestamp)) {
    throw new TraceValidationError(
      "timestamp must be a finite number (emitter clock)",
      `${path}.timestamp`,
    );
  }
  if (raw.line !== undefined && typeof raw.line !== "number") {
    throw new TraceValidationError("optional line must be a number (1-based)", `${path}.line`);
  }
  if (raw.description !== undefined && typeof raw.description !== "string") {
    throw new TraceValidationError("optional description must be a string", `${path}.description`);
  }
  if (!isObject(raw.data)) {
    throw new TraceValidationError("data must be an object", `${path}.data`);
  }

  const data = raw.data;
  switch (type as TraceEventType) {
    case "assign":
      if (typeof data.name !== "string") {
        throw new TraceValidationError(
          'assign requires data.name (string) — e.g. { "name": "i", "value": 0 }',
          `${path}.data.name`,
        );
      }
      if (!("value" in data)) {
        throw new TraceValidationError(
          "assign requires data.value",
          `${path}.data.value`,
        );
      }
      break;
    case "compare":
    case "swap":
      if (typeof data.i !== "number" || typeof data.j !== "number") {
        throw new TraceValidationError(
          `${type} requires numeric data.i and data.j (array indices)`,
          `${path}.data`,
        );
      }
      break;
    case "call":
    case "return":
      if (typeof data.frame !== "string") {
        throw new TraceValidationError(
          `${type} requires data.frame (string frame name)`,
          `${path}.data.frame`,
        );
      }
      break;
    case "line":
      if (typeof data.line !== "number") {
        throw new TraceValidationError(
          "line event requires data.line (1-based source line)",
          `${path}.data.line`,
        );
      }
      break;
    case "highlight":
      break;
  }

  return raw as unknown as TraceEvent;
}

/**
 * Validate an unknown JSON value as a TraceDocument.
 * Throws TraceValidationError on failure.
 */
export function validateTrace(raw: unknown): TraceDocument {
  if (!isObject(raw)) {
    throw new TraceValidationError(
      'trace must be a JSON object with version, language, algorithm, metadata, and events',
    );
  }
  if (raw.version !== TRACE_VERSION) {
    throw new TraceValidationError(
      `version must be "${TRACE_VERSION}" (got ${JSON.stringify(raw.version)}) — see docs/TRACE.md`,
      "version",
    );
  }
  if (typeof raw.language !== "string" || !raw.language) {
    throw new TraceValidationError(
      'language must be a non-empty string (metadata only; renderers ignore it)',
      "language",
    );
  }
  if (typeof raw.algorithm !== "string" || !raw.algorithm) {
    throw new TraceValidationError(
      'algorithm must be a non-empty string id, e.g. "bubble_sort"',
      "algorithm",
    );
  }
  if (!Array.isArray(raw.events)) {
    throw new TraceValidationError("events must be an array of Trace events", "events");
  }

  const events = raw.events.map((e, i) => assertEvent(e, `events[${i}]`));

  const meta = isObject(raw.metadata) ? raw.metadata : undefined;
  const initial = meta && isObject(meta.initial) ? meta.initial : undefined;
  if (!Array.isArray(initial?.array)) {
    throw new TraceValidationError(
      'v0.1 requires metadata.initial.array (list). Example: metadata: { "initial": { "array": [5, 1, 4, 2] } }. assign() never seeds structures — see docs/TRACE.md',
      "metadata.initial.array",
    );
  }

  const doc: TraceDocument = {
    version: TRACE_VERSION,
    language: raw.language,
    algorithm: raw.algorithm,
    metadata: meta as TraceDocument["metadata"],
    events,
  };

  if (isObject(raw.source)) {
    doc.source = {
      path: typeof raw.source.path === "string" ? raw.source.path : undefined,
      code: typeof raw.source.code === "string" ? raw.source.code : undefined,
    };
  }

  return doc;
}

/** Parse a JSON string into a validated TraceDocument. */
export function parseTrace(json: string): TraceDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    throw new TraceValidationError(
      `invalid JSON: ${e instanceof Error ? e.message : String(e)} — expected a TraceDocument object`,
    );
  }
  return validateTrace(raw);
}

/** Serialize a TraceDocument to pretty JSON. */
export function serializeTrace(doc: TraceDocument, pretty = true): string {
  return pretty ? JSON.stringify(doc, null, 2) : JSON.stringify(doc);
}
