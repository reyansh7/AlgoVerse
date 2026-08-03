/**
 * AlgoVerse baseline benchmarks — parse / reduce / playback / serialize.
 *
 * Reads synthetic traces produced by benchmarks/python/bench_emit_write.py.
 * Does not change production code. Run via: npx tsx benchmarks/ts/bench_pipeline.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

import {
  TracePlayer,
  parseTrace,
  reduceTrace,
  serializeTrace,
  TraceRecorder,
} from "../../packages/trace/src/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const RESULTS = join(ROOT, "benchmarks", "results");
const SIZES = [100, 1_000, 10_000, 100_000] as const;
const ARRAY = Array.from({ length: 16 }, (_, i) => i);

function median(samples: number[]): number {
  const s = [...samples].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function timeMs(fn: () => void, repeats: number): number {
  const samples: number[] = [];
  for (let i = 0; i < repeats; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

function heapUsed(): number {
  return process.memoryUsage().heapUsed;
}

function emitEvents(n: number) {
  const rec = new TraceRecorder({
    algorithm: "bench_synth",
    metadata: { initial: { array: [...ARRAY] } },
    source: { code: "# synthetic benchmark trace\n" },
  });
  const body = Math.max(0, n - 2);
  rec.call("bench", { args: { n }, line: 1 });
  for (let i = 0; i < body; i++) {
    const kind = i % 6;
    const line = (i % 40) + 1;
    if (kind === 0) rec.line(line);
    else if (kind === 1) rec.assign("i", i, { line });
    else if (kind === 2) rec.compare(0, 1, { values: [ARRAY[0], ARRAY[1]], line });
    else if (kind === 3) rec.swap(0, 1, { line });
    else if (kind === 4) rec.assign("array", [...ARRAY], { line });
    else
      rec.highlight({
        indices: [0, 1],
        kinds: { 0: "comparing", 1: "comparing" },
        line,
      });
  }
  rec.return("bench", { value: [...ARRAY], line: 2 });
  return rec;
}

function benchSize(n: number, repeats: number) {
  const path = join(RESULTS, `bench_${n}.trace.json`);
  if (!existsSync(path)) {
    throw new Error(
      `Missing ${path}. Run benchmarks/python/bench_emit_write.py first.`,
    );
  }

  const raw = readFileSync(path, "utf8");
  const fileBytes = Buffer.byteLength(raw, "utf8");

  const parseRepeats = n <= 10_000 ? repeats : 1;
  const reduceRepeats = n <= 10_000 ? repeats : 1;

  // --- TypeScript generation (in-memory, same pattern as Python) ---
  if (n >= 10_000) emitEvents(Math.min(n, 1000)); // warmup
  const generateMs = timeMs(() => {
    emitEvents(n);
  }, n <= 10_000 ? repeats : 1);

  let h0 = heapUsed();
  const recorder = emitEvents(n);
  const generateHeapDelta = heapUsed() - h0;

  // --- serialize (TS) ---
  const serializeMs = timeMs(() => {
    serializeTrace(recorder.toDocument());
  }, n <= 10_000 ? repeats : 1);

  h0 = heapUsed();
  const serialized = serializeTrace(recorder.toDocument());
  const serializeHeapDelta = heapUsed() - h0;
  const serializedBytes = Buffer.byteLength(serialized, "utf8");

  // --- parse (from Python-written file) ---
  const parseMs = timeMs(() => {
    parseTrace(raw);
  }, parseRepeats);

  h0 = heapUsed();
  const doc = parseTrace(raw);
  const parseHeapDelta = heapUsed() - h0;
  if (doc.events.length !== n) {
    throw new Error(`expected ${n} events, got ${doc.events.length}`);
  }

  // --- reduce ---
  const reduceMs = timeMs(() => {
    reduceTrace(doc);
  }, reduceRepeats);

  h0 = heapUsed();
  const frames = reduceTrace(doc);
  const reduceHeapDelta = heapUsed() - h0;

  // --- playback: load (includes reduce) + seek every frame ---
  const playbackLoadSeekMs = timeMs(() => {
    const player = new TracePlayer();
    player.load(doc);
    for (let i = 0; i < player.length; i++) {
      player.seek(i);
      void player.currentFrame;
      void player.previousFrame;
    }
  }, n <= 10_000 ? Math.min(repeats, 2) : 1);

  // Seek-only after one load (isolates navigation from reduce)
  const primed = new TracePlayer();
  primed.load(doc);
  const seekOnlyMs = timeMs(() => {
    for (let i = 0; i < primed.length; i++) {
      primed.seek(i);
      void primed.currentFrame;
    }
  }, n <= 10_000 ? Math.min(repeats, 2) : 1);

  h0 = heapUsed();
  const player = new TracePlayer();
  player.load(doc);
  for (let i = 0; i < player.length; i++) {
    player.seek(i);
  }
  const playbackHeapDelta = heapUsed() - h0;

  // --- next()-only playback (typical step-through; includes load/reduce) ---
  const stepMs = timeMs(() => {
    const p = new TracePlayer();
    p.load(doc);
    while (p.index < p.length - 1) p.next();
  }, n <= 10_000 ? Math.min(repeats, 2) : 1);

  return {
    events: n,
    file_bytes: fileBytes,
    file_mb: Number((fileBytes / (1024 * 1024)).toFixed(4)),
    ts_generate_ms: Number(generateMs.toFixed(3)),
    ts_serialize_ms: Number(serializeMs.toFixed(3)),
    ts_serialized_bytes: serializedBytes,
    parse_ms: Number(parseMs.toFixed(3)),
    reduce_ms: Number(reduceMs.toFixed(3)),
    playback_load_seek_all_ms: Number(playbackLoadSeekMs.toFixed(3)),
    playback_seek_only_ms: Number(seekOnlyMs.toFixed(3)),
    playback_step_all_ms: Number(stepMs.toFixed(3)),
    frames: frames.length,
    heap_delta_generate: generateHeapDelta,
    heap_delta_serialize: serializeHeapDelta,
    heap_delta_parse: parseHeapDelta,
    heap_delta_reduce: reduceHeapDelta,
    heap_delta_playback: playbackHeapDelta,
    events_per_s_parse: parseMs > 0 ? Math.round(n / (parseMs / 1000)) : null,
    events_per_s_reduce: reduceMs > 0 ? Math.round(n / (reduceMs / 1000)) : null,
    frames_per_s_seek_only:
      seekOnlyMs > 0 ? Math.round(n / (seekOnlyMs / 1000)) : null,
  };
}

function ensureDir(dir: string) {
  if (existsSync(dir)) return;
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e: unknown) {
    if (!(e && typeof e === "object" && "code" in e && e.code === "EEXIST")) {
      throw e;
    }
  }
}

function main() {
  ensureDir(RESULTS);
  const repeats = 3;
  const sizesArg = process.argv.find((a) => a.startsWith("--sizes="));
  const sizes = sizesArg
    ? sizesArg
        .slice("--sizes=".length)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Boolean)
    : [...SIZES];

  const rows = [];
  for (const n of sizes) {
    console.log(`[ts] events=${n} …`);
    const row = benchSize(n, repeats);
    rows.push(row);
    console.log(
      `  gen=${row.ts_generate_ms}ms  parse=${row.parse_ms}ms  reduce=${row.reduce_ms}ms  ` +
        `seekOnly=${row.playback_seek_only_ms}ms  file=${row.file_mb}MB`,
    );
  }

  const out = join(RESULTS, "ts_pipeline.json");
  writeFileSync(
    out,
    JSON.stringify({ suite: "ts_pipeline", rows }, null, 2),
    "utf8",
  );
  console.log(`[ts] wrote ${out}`);
}

main();
