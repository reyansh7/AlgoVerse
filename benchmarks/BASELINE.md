# AlgoVerse performance baseline

**Date:** 2026-08-03 (UTC)  
**Machine:** Windows 11, AMD64, Node v22.13.1, Python 3.13.11  
**Suite:** `npm run bench` → `benchmarks/run.mjs`  
**Raw data:** [`results/latest.json`](./results/latest.json)  
**Status:** Measurement only — **no production optimizations applied.**

This baseline answers: how fast is AlgoVerse today, where time/memory go, what scales, and what will hurt first at large traces.

> **Variance:** Wall times at 100k can move ~2–3× between runs on this machine (OneDrive-backed `results/` reparse point + GC). Treat **orders of magnitude and ratios** as the signal; re-run locally before optimizing.

---

## Workload

Synthetic mixed events (deterministic), counts **100 / 1k / 10k / 100k**:

- Outer `call` / `return`
- Rotating `line`, scalar `assign`, `compare`, `swap`, full-array `assign`, `highlight`
- Fixed structure array length **16**
- Pretty JSON (`indent=2`) — matches production `Trace.write()`

Teaching-sized algorithm traces today are typically hundreds to low thousands of events. 100k is a stress ceiling for planning.

---

## Results summary

Numbers below match `results/latest.json` from the full suite run.

### Python — generate + write

| Events | Generate | `json.dumps` | `write()` | Payload | Peak (write path)* |
|--------|----------|--------------|-----------|---------|---------------------|
| 100 | 0.09 ms | 0.11 ms | 1.6 ms | 0.02 MB | ~72 KB |
| 1,000 | 1.1 ms | 1.2 ms | 2.7 ms | 0.19 MB | ~0.6 MB |
| 10,000 | 8.8 ms | 12.2 ms | 16.6 ms | 1.92 MB | ~6.0 MB |
| 100,000 | 123 ms | 119 ms | 268 ms | **19.3 MB** | **~61 MB** |

\*Python `tracemalloc` peak during that phase (not RSS).

Generate throughput stays roughly **0.8–1.1M events/s**. Emit is not the bottleneck.

### TypeScript — generate / serialize / parse / reduce / playback

| Events | Gen | Serialize | Parse | Reduce | Load+seek all | Seek only | File |
|--------|-----|-----------|-------|--------|---------------|-----------|------|
| 100 | 0.06 ms | 0.07 ms | 0.11 ms | 0.11 ms | 0.26 ms | 0.06 ms | 0.02 MB |
| 1,000 | 0.24 ms | 0.88 ms | 0.83 ms | 1.7 ms | 2.3 ms | 0.23 ms | 0.20 MB |
| 10,000 | 2.2 ms | 7.0 ms | 9.2 ms | 9.1 ms | 15.2 ms | 0.61 ms | 2.05 MB |
| 100,000 | 63 ms | 137 ms | **341 ms** | **439 ms** | **314 ms** | **4.9 ms** | **20.6 MB** |

Node heap deltas (noisy under GC; use as relative signal):

| Events | Δ heap reduce | Δ heap playback (load+seek) |
|--------|---------------|------------------------------|
| 100 | ~0.13 MB | ~0.13 MB |
| 1,000 | ~1.3 MB | (GC noise) |
| 10,000 | (GC noise) | ~6.5 MB |
| 100,000 | **~90 MB** | **~88 MB** |

---

## Observations

1. **Emit scales well.** Python and TS recorders build 100k events in tens–hundreds of ms. Manual and auto emitters are unlikely to be the first wall.
2. **Pretty JSON dominates I/O cost.** At 100k: ~20 MB on disk; dumps ≈ a large fraction of write time. Compact JSON would shrink this materially (TS already has `pretty=false`; Python always pretty-prints today).
3. **Parse is fine at teaching scale; costly at stress scale.** Sub‑ms–few ms through 10k; hundreds of ms at 100k on a contended disk/JSON path.
4. **Reduce is the primary CPU + memory hotspot.** One absolute `Frame` per event; each clones `variables`, `structures.array`, `highlights`, and `callStack` (`cloneFrame` in `packages/trace/src/reduce.ts`). Memory ≈ O(events × frame_width) — ~90 MB heap delta at 100k here.
5. **Playback navigation is cheap after reduce.** Seek-only over 100k frames is ~5 ms (index + getters). Hosts that call `load()` pay reduce again inside `TracePlayer.load`.
6. **`load` + scrub tracks reduce cost.** Seeking every frame after load does not add much beyond the reduce inside `load`.
7. **Full-array `assign` events inflate JSON and variable clones.** ~1/6 of synthetic events copy a 16-int array into payloads and later into frame `variables` — realistic when auto `sync_assign=True`.
8. **What will break first at larger sizes:** (a) **heap from materialized frames**, (b) **pretty JSON size / parse**, (c) **main-thread reduce on open** — not seek/step loops, not emit.

---

## 1. CPU hotspots

| Rank | Location | Why |
|------|----------|-----|
| 1 | `reduceTrace` → `cloneFrame` | Per-event object + array copies |
| 2 | `JSON.stringify` / `json.dumps` (pretty) | Walk entire document + whitespace |
| 3 | `parseTrace` → `JSON.parse` + `validateTrace` | Full tree walk / per-event checks |
| 4 | `Trace.write` / disk | Bound by serialize + FS |
| 5 | Event generation | Low — dict/object push only |

Playback `seek` / `next` are **not** CPU hotspots once frames exist.

---

## 2. Memory hotspots

| Rank | Location | Why |
|------|----------|-----|
| 1 | Reduced `Frame[]` | N snapshots; each holds array + variables + highlights |
| 2 | Pretty JSON string | ~20 MB contiguous string at 100k |
| 3 | Parsed `TraceDocument.events` | Live event tree alongside frames after `load` |
| 4 | Python emit event list + dump buffer | Peak ~50–60 MB traced at 100k write |
| 5 | Full-array `assign` values | Duplicated in events and in `variables.array` |

---

## 3. Expensive allocations

| Allocation | Frequency | Notes |
|------------|-----------|-------|
| `cloneFrame` array/object spreads | 1 × events | Core reduce cost |
| New array on every `swap` apply | Per swap | `[...arr]` then replace |
| `assign` value retention | Per assign | Scalars cheap; array snapshots expensive |
| `serializeTrace` / `dumps` output string | 1 × doc | Largest single string |
| `events: [...this.events]` in `toDocument` | Per serialize | Extra shallow copy of event list |
| Python `_push` → `dict(data)` | Per event | Small; acceptable |

---

## 4. Serialization costs

| Path | 100k cost | Notes |
|------|-----------|-------|
| Python `json.dumps(..., indent=2)` | ~119 ms / ~19.3 MB | Production write path |
| Python `write()` | ~268 ms | dumps + filesystem |
| TS `serializeTrace` (pretty) | ~137 ms / ~20.3 MB | Same shape |
| Compact JSON (not default) | Not measured this run | Expected ~2–4× smaller; faster parse |

Rough payload growth: **~200 bytes/event** average for this mixed pretty workload (linear).

---

## 5. What to optimize later vs leave alone

### Optimize later (when product needs larger traces or snappier open)

1. **Frame materialization strategy** — structural sharing / copy-on-write / windowed reduce so memory is not O(N) full snapshots. Highest leverage for 100k+.
2. **Default or opt-in compact JSON** in Python `write()` (mirror TS `pretty=false`) for CLI/temp files.
3. **Avoid double reduce** — allow `TracePlayer` to accept precomputed frames, or have hosts call `reduceTrace` once and reuse.
4. **Auto-emitter `sync_assign`** — keep default on for UX; document off for huge runs; assign-on-swap-only is already the TraceArray default path for structure.
5. **Validate lighter on trusted paths** — optional skip after emitter-produced files (careful for security/UX).

### Do **not** optimize yet (premature / low leverage)

1. **Seek / step / previousFrame getters** — already negligible.
2. **Recorder emit loops** — already ~1M events/s class.
3. **Frontend/renderers** — not on this critical path; do not touch for perf until frame feed is the issue.
4. **Trace schema changes** — frozen; no new event types for perf.
5. **Micro-optimizing `_push` / small dict copies** — noise vs reduce/JSON.
6. **AST / bytecode / sys.monitoring for speed** — wrong layer; next product work is `@visualize`, not a perf rewrite.

---

## Answers to the planning questions

| Question | Answer (today) |
|----------|----------------|
| How fast is AlgoVerse? | Teaching traces (≤1k): few ms end-to-end in core. 10k: tens of ms. 100k: ~0.1–0.5 s reduce/parse/serialize; tens of MB JSON; ~90 MB frame heap. |
| Where is the bottleneck? | **`reduceTrace` memory + CPU**, then **pretty JSON parse/serialize**. |
| What scales well? | Emit, seek/step after load, small-array swaps. |
| What breaks first? | **Heap from full frame lists**, then **file size / parse**, then main-thread open latency. |

---

## Re-run

```bash
npm run bench
# or
node benchmarks/run.mjs --sizes=100,1000,10000,100000
```

See [`README.md`](./README.md). Refresh this document when numbers change meaningfully across machines or after intentional optimizations.

**Next product milestone:** Milestone 3 — public `@visualize` API (not started in this change).
