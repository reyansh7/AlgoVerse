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
    throw new TraceValidationError("event must be an object", path);
  }
  const type = raw.type;
  if (typeof type !== "string" || !TRACE_EVENT_TYPES.includes(type as TraceEventType)) {
    throw new TraceValidationError(
      `type must be one of ${TRACE_EVENT_TYPES.join(", ")}`,
      `${path}.type`,
    );
  }
  if (typeof raw.timestamp !== "number" || !Number.isFinite(raw.timestamp)) {
    throw new TraceValidationError("timestamp must be a finite number", `${path}.timestamp`);
  }
  if (raw.line !== undefined && typeof raw.line !== "number") {
    throw new TraceValidationError("line must be a number", `${path}.line`);
  }
  if (raw.description !== undefined && typeof raw.description !== "string") {
    throw new TraceValidationError("description must be a string", `${path}.description`);
  }
  if (!isObject(raw.data)) {
    throw new TraceValidationError("data must be an object", `${path}.data`);
  }

  const data = raw.data;
  switch (type as TraceEventType) {
    case "assign":
      if (typeof data.name !== "string") {
        throw new TraceValidationError("data.name required", `${path}.data.name`);
      }
      if (!("value" in data)) {
        throw new TraceValidationError("data.value required", `${path}.data.value`);
      }
      break;
    case "compare":
    case "swap":
      if (typeof data.i !== "number" || typeof data.j !== "number") {
        throw new TraceValidationError("data.i and data.j required", `${path}.data`);
      }
      break;
    case "call":
    case "return":
      if (typeof data.frame !== "string") {
        throw new TraceValidationError("data.frame required", `${path}.data.frame`);
      }
      break;
    case "line":
      if (typeof data.line !== "number") {
        throw new TraceValidationError("data.line required", `${path}.data.line`);
      }
      break;
    case "highlight":
      // all fields optional
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
    throw new TraceValidationError("trace must be an object");
  }
  if (raw.version !== TRACE_VERSION) {
    throw new TraceValidationError(
      `version must be "${TRACE_VERSION}"`,
      "version",
    );
  }
  if (typeof raw.language !== "string" || !raw.language) {
    throw new TraceValidationError("language must be a non-empty string", "language");
  }
  if (typeof raw.algorithm !== "string" || !raw.algorithm) {
    throw new TraceValidationError("algorithm must be a non-empty string", "algorithm");
  }
  if (!Array.isArray(raw.events)) {
    throw new TraceValidationError("events must be an array", "events");
  }

  const events = raw.events.map((e, i) => assertEvent(e, `events[${i}]`));

  // Array bootstrap: metadata.initial.array only (never inferred from variable names).
  const meta = isObject(raw.metadata) ? raw.metadata : undefined;
  const initial = meta && isObject(meta.initial) ? meta.initial : undefined;
  if (!Array.isArray(initial?.array)) {
    throw new TraceValidationError(
      "trace must seed an array via metadata.initial.array (assign does not seed structures)",
      "metadata.initial.array",
    );
  }

  const doc: TraceDocument = {
    version: TRACE_VERSION,
    language: raw.language,
    algorithm: raw.algorithm,
    // Validated above — metadata.initial.array is present.
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
      `invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return validateTrace(raw);
}

/** Serialize a TraceDocument to pretty JSON. */
export function serializeTrace(doc: TraceDocument, pretty = true): string {
  return pretty ? JSON.stringify(doc, null, 2) : JSON.stringify(doc);
}
