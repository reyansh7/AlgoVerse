/**
 * Comprehensive TracePlayer unit tests — pure TypeScript, no React.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseTrace, TracePlayer, TraceRecorder } from "./index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const goldenPath = join(__dirname, "../fixtures/bubble.trace.json");

function minimalDoc() {
  const r = new TraceRecorder({
    algorithm: "demo",
    language: "typescript",
    metadata: { initial: { array: [2, 1] } },
  });
  r.assign("i", 0);
  r.compare(0, 1, { values: [2, 1] });
  r.swap(0, 1);
  r.return("demo", { value: [1, 2] });
  return r.toDocument();
}

describe("TracePlayer", () => {
  it("load materializes one frame per event and resets index", () => {
    const doc = parseTrace(readFileSync(goldenPath, "utf8"));
    const player = new TracePlayer();
    assert.equal(player.length, 0);
    assert.equal(player.currentFrame, null);

    player.load(doc);
    assert.equal(player.length, doc.events.length);
    assert.equal(player.index, 0);
    assert.ok(player.currentFrame);
    assert.equal(player.currentFrame, player.current);
    assert.equal(player.document, doc);
  });

  it("seek clamps to [0, length-1]", () => {
    const player = new TracePlayer();
    player.load(minimalDoc());
    const last = player.length - 1;

    assert.equal(player.seek(-10)?.step, 0);
    assert.equal(player.index, 0);

    assert.equal(player.seek(999)?.step, last);
    assert.equal(player.index, last);

    assert.equal(player.seek(2)?.step, 2);
    assert.equal(player.index, 2);
  });

  it("next and previous navigate without leaving bounds", () => {
    const player = new TracePlayer();
    player.load(minimalDoc());
    const last = player.length - 1;

    player.seek(0);
    player.previous();
    assert.equal(player.index, 0);

    player.next();
    assert.equal(player.index, 1);
    player.next();
    assert.equal(player.index, 2);

    player.seek(last);
    player.next();
    assert.equal(player.index, last);
  });

  it("currentFrame and previousFrame track index", () => {
    const player = new TracePlayer();
    player.load(minimalDoc());

    assert.equal(player.previousFrame, null);
    const first = player.currentFrame;
    assert.ok(first);

    player.next();
    assert.equal(player.previousFrame, first);
    assert.notEqual(player.currentFrame, first);
  });

  it("restart returns to first frame", () => {
    const player = new TracePlayer();
    player.load(minimalDoc());
    player.seek(player.length - 1);
    player.restart();
    assert.equal(player.index, 0);
  });

  it("clear empties state", () => {
    const player = new TracePlayer();
    player.load(minimalDoc());
    player.clear();
    assert.equal(player.length, 0);
    assert.equal(player.document, null);
    assert.equal(player.currentFrame, null);
    assert.equal(player.seek(0), null);
  });

  it("empty player is a safe no-op", () => {
    const player = new TracePlayer();
    assert.equal(player.next(), null);
    assert.equal(player.previous(), null);
    assert.equal(player.seek(5), null);
    assert.equal(player.length, 0);
  });

  it("golden bubble ends sorted after seek to end", () => {
    const doc = parseTrace(readFileSync(goldenPath, "utf8"));
    const player = new TracePlayer();
    player.load(doc);
    player.seek(player.length - 1);
    assert.deepEqual(player.currentFrame?.structures.array, [1, 2, 4, 5]);
  });
});
