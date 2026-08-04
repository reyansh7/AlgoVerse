import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TraceEvent } from "@/core/trace";
import { explainStep } from "./explainStep";
import { collectLegend } from "./collectLegend";
import { buildTraceIntro, buildTraceSummary } from "./traceSummary";
import { buildMoments } from "../timeline/buildMoments";
import type { TraceDocument } from "@/core/trace";

const events: TraceEvent[] = [
  {
    type: "call",
    timestamp: 1,
    line: 1,
    description: "Enter bubble_sort",
    data: { frame: "bubble_sort", args: { n: 4 } },
  },
  {
    type: "assign",
    timestamp: 2,
    line: 3,
    data: { name: "i", value: 0 },
  },
  {
    type: "compare",
    timestamp: 3,
    line: 5,
    data: { i: 0, j: 1, values: [5, 1] },
  },
  {
    type: "swap",
    timestamp: 4,
    line: 6,
    data: { i: 0, j: 1 },
  },
  {
    type: "highlight",
    timestamp: 5,
    line: 3,
    data: { sorted: [3], kinds: { "3": "sorted" }, indices: [3] },
  },
  {
    type: "return",
    timestamp: 6,
    line: 7,
    data: { frame: "bubble_sort", value: [1, 2, 4, 5] },
  },
];

const doc: TraceDocument = {
  version: "0.1",
  language: "python",
  algorithm: "bubble_sort",
  metadata: { initial: { array: [5, 1, 4, 2] } },
  events,
};

describe("explainStep", () => {
  it("prefers authored description", () => {
    const lesson = explainStep(events[0], null, null);
    assert.equal(lesson.operationTitle, "Enter");
    assert.equal(lesson.whatHappened, "Enter bubble_sort");
    assert.equal(lesson.confidence, "authored");
  });

  it("derives compare facts without inventing motives", () => {
    const lesson = explainStep(events[2], null, null);
    assert.equal(lesson.operationTitle, "Compare");
    assert.match(lesson.whatHappened, /Compared indices/);
    assert.ok(lesson.whatChanged.some((c) => c.includes("[0]")));
    assert.ok(lesson.notice?.includes("[0]"));
  });

  it("refines highlight titles from kinds", () => {
    const lesson = explainStep(events[4], null, null);
    assert.equal(lesson.operationTitle, "Mark complete");
  });
});

describe("collectLegend", () => {
  it("only lists ops present in the trace", () => {
    const legend = collectLegend(doc);
    const labels = legend.map((e) => e.label);
    assert.ok(labels.includes("Compare"));
    assert.ok(labels.includes("Swap"));
    assert.ok(!labels.includes("Line"));
  });
});

describe("traceSummary", () => {
  it("counts from events only", () => {
    const intro = buildTraceIntro(doc);
    assert.ok(intro);
    assert.equal(intro!.totalEvents, 6);
    assert.ok(intro!.structureKinds.includes("array"));

    const summary = buildTraceSummary(doc);
    assert.equal(summary!.comparisons, 1);
    assert.equal(summary!.swaps, 1);
  });
});

describe("buildMoments", () => {
  it("groups into algorithm-agnostic moments", () => {
    const moments = buildMoments(events);
    assert.ok(moments.length >= 2);
    assert.equal(moments[0]!.kind, "init");
    assert.ok(moments.some((m) => m.kind === "decision"));
    assert.ok(moments.some((m) => m.kind === "mutation"));
  });
});
