/**
 * Golden bubble_sort.trace.json round-trip + reduce tests.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseTrace,
  serializeTrace,
  reduceTrace,
  TracePlayer,
  TraceRecorder,
  validateTrace,
  TraceValidationError,
} from "./index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const goldenPath = join(__dirname, "../fixtures/bubble.trace.json");

describe("@algoverse/trace", () => {
  it("parses and validates the golden bubble trace", () => {
    const json = readFileSync(goldenPath, "utf8");
    const doc = parseTrace(json);
    assert.equal(doc.version, "0.1");
    assert.equal(doc.algorithm, "bubble_sort");
    assert.equal(doc.language, "python");
    assert.ok(doc.events.length > 0);
    assert.deepEqual(doc.metadata.initial.array, [5, 1, 4, 2]);
  });

  it("round-trips serialize → parse", () => {
    const json = readFileSync(goldenPath, "utf8");
    const doc = parseTrace(json);
    const again = parseTrace(serializeTrace(doc));
    assert.equal(again.events.length, doc.events.length);
    assert.equal(again.algorithm, doc.algorithm);
  });

  it("reduces to one frame per event with a sorted final array", () => {
    const doc = parseTrace(readFileSync(goldenPath, "utf8"));
    const frames = reduceTrace(doc);
    assert.equal(frames.length, doc.events.length);

    const last = frames[frames.length - 1];
    assert.deepEqual(last.structures.array, [1, 2, 4, 5]);
    assert.equal(last.operation, "return");
    assert.deepEqual(last.variables.result, [1, 2, 4, 5]);
  });

  it("TracePlayer seeks and steps", () => {
    const doc = parseTrace(readFileSync(goldenPath, "utf8"));
    const player = new TracePlayer();
    player.load(doc);
    assert.equal(player.length, doc.events.length);
    assert.equal(player.index, 0);

    player.next();
    assert.equal(player.index, 1);
    player.seek(player.length - 1);
    assert.deepEqual(player.currentFrame?.structures.array, [1, 2, 4, 5]);
    player.previous();
    assert.equal(player.index, player.length - 2);
  });

  it("TraceRecorder builds a valid minimal sort trace via metadata.initial", () => {
    const r = new TraceRecorder({
      algorithm: "demo_sort",
      language: "typescript",
      metadata: { initial: { array: [3, 1] } },
    });
    r.assign("array", [3, 1]);
    r.compare(0, 1, { values: [3, 1] });
    r.swap(0, 1);
    r.assign("array", [1, 3]);
    r.return("demo_sort", { value: [1, 3] });
    const doc = validateTrace(r.toDocument());
    const frames = reduceTrace(doc);
    assert.deepEqual(frames[0].structures.array, [3, 1]);
    assert.deepEqual(frames[frames.length - 1].structures.array, [1, 3]);
    assert.deepEqual(frames[frames.length - 1].variables.array, [1, 3]);
  });

  it("rejects traces without metadata.initial.array", () => {
    assert.throws(
      () =>
        validateTrace({
          version: "0.1",
          language: "python",
          algorithm: "x",
          events: [{ type: "line", timestamp: 1, data: { line: 1 } }],
        }),
      (err: unknown) =>
        err instanceof TraceValidationError &&
        err.path === "metadata.initial.array",
    );
  });

  it("rejects assign-only array seeding (assign does not bootstrap structures)", () => {
    assert.throws(
      () =>
        validateTrace({
          version: "0.1",
          language: "python",
          algorithm: "x",
          events: [
            {
              type: "assign",
              timestamp: 1,
              data: { name: "array", value: [1, 2] },
            },
          ],
        }),
      TraceValidationError,
    );
  });

  it("assign never mutates structures.array", () => {
    const doc = validateTrace({
      version: "0.1",
      language: "typescript",
      algorithm: "demo",
      metadata: { initial: { array: [1, 2] } },
      events: [
        {
          type: "assign",
          timestamp: 1,
          data: { name: "array", value: [9, 9] },
        },
      ],
    });
    const frames = reduceTrace(doc);
    assert.deepEqual(frames[0].structures.array, [1, 2]);
    assert.deepEqual(frames[0].variables.array, [9, 9]);
  });

  it("swap mutates structures but not variables", () => {
    const doc = validateTrace({
      version: "0.1",
      language: "typescript",
      algorithm: "demo",
      metadata: { initial: { array: [2, 1] } },
      events: [
        { type: "assign", timestamp: 1, data: { name: "array", value: [2, 1] } },
        { type: "swap", timestamp: 2, data: { i: 0, j: 1 } },
      ],
    });
    const frames = reduceTrace(doc);
    const afterSwap = frames[1];
    assert.deepEqual(afterSwap.structures.array, [1, 2]);
    assert.deepEqual(afterSwap.variables.array, [2, 1]);
  });
});
