# AlgoVerse benchmarks

Baseline performance suite. **Measures only — does not optimize production code.**

## What it measures

| Stage | Where |
|-------|--------|
| Trace generation | Python `Trace` + TypeScript `TraceRecorder` |
| Trace writing / serialization | Python `write()` / `json.dumps`; TS `serializeTrace` |
| Trace parsing | TS `parseTrace` (validate + JSON.parse) |
| Frame reduction | TS `reduceTrace` |
| Playback | TS `TracePlayer` load + seek / step |
| Memory | Python `tracemalloc` peaks; Node `heapUsed` deltas |

Event counts: **100 / 1,000 / 10,000 / 100,000**.

Synthetic workload (deterministic): mixed `line` / `assign` / `compare` / `swap` /
full-array `assign` / `highlight`, plus outer `call`/`return`. Array size fixed at 16.

## Run

From the repo root:

```bash
npm run bench
```

Subset (faster iteration):

```bash
node benchmarks/run.mjs --sizes=100,1000
```

Or separately:

```bash
python benchmarks/python/bench_emit_write.py
npx tsx benchmarks/ts/bench_pipeline.ts
```

## Outputs

| Path | Contents |
|------|----------|
| `benchmarks/results/bench_<n>.trace.json` | Synthetic traces (gitignored; large) |
| `benchmarks/results/python_emit_write.json` | Python timings |
| `benchmarks/results/ts_pipeline.json` | TS pipeline timings |
| `benchmarks/results/latest.json` | Merged snapshot |
| `benchmarks/BASELINE.md` | Human baseline report |

## Notes

- Pretty-printed JSON (`indent=2`) matches production `Trace.write()` — serialization cost includes whitespace.
- `TracePlayer.load` always calls `reduceTrace`; seek-only timings isolate navigation after load.
- Do not treat a single laptop run as absolute truth; compare ratios across sizes on the same machine.
