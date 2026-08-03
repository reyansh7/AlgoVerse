"""
AlgoVerse baseline benchmarks — Python emit + write.

Measures Trace event generation and JSON write cost at fixed event counts.
Does not optimize production code. Repeatable synthetic workload.
"""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
import time
import tracemalloc
from pathlib import Path

# Allow running without install: PYTHONPATH=sdk/python
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "sdk" / "python"))

from algoverse import Trace  # noqa: E402

SIZES = (100, 1_000, 10_000, 100_000)
ARRAY = list(range(16))


def emit_events(n: int) -> Trace:
    """Emit exactly ``n`` events with a mixed, deterministic pattern."""
    tr = Trace(
        algorithm="bench_synth",
        metadata={"initial": {"array": list(ARRAY)}},
        source_code="# synthetic benchmark trace\n",
    )
    # Reserve first/last for call/return so total == n
    body = max(0, n - 2)
    tr.call("bench", args={"n": n}, line=1)
    for i in range(body):
        kind = i % 6
        line = (i % 40) + 1
        if kind == 0:
            tr.line(line)
        elif kind == 1:
            tr.assign("i", i, line=line)
        elif kind == 2:
            tr.compare(0, 1, values=[ARRAY[0], ARRAY[1]], line=line)
        elif kind == 3:
            tr.swap(0, 1, line=line)
        elif kind == 4:
            # Full-array variable snapshot — expensive assign payload path
            tr.assign("array", list(ARRAY), line=line)
        else:
            tr.highlight(indices=[0, 1], kinds={0: "comparing", 1: "comparing"}, line=line)
    tr.return_("bench", value=list(ARRAY), line=2)
    return tr


def time_call(fn, repeats: int) -> float:
    """Return median wall seconds over repeats (single-shot if repeats=1)."""
    samples: list[float] = []
    for _ in range(repeats):
        t0 = time.perf_counter()
        fn()
        samples.append(time.perf_counter() - t0)
    samples.sort()
    return samples[len(samples) // 2]


def peak_memory_bytes(fn) -> tuple[object, int]:
    tracemalloc.start()
    result = fn()
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return result, peak


def bench_size(n: int, *, repeats: int, out_dir: Path) -> dict:
    # Generation
    def gen():
        return emit_events(n)

    # Warmup once for large sizes
    if n >= 10_000:
        emit_events(min(n, 1_000))

    gen_s = time_call(gen, repeats=max(1, repeats if n <= 10_000 else 1))
    tr, peak_gen = peak_memory_bytes(gen)
    actual = len(tr.to_dict()["events"])
    assert actual == n, f"expected {n} events, got {actual}"

    # to_dict (pre-serialize structure build)
    def to_dict():
        return tr.to_dict()

    to_dict_s = time_call(to_dict, repeats=max(1, repeats if n <= 10_000 else 1))
    doc, peak_dict = peak_memory_bytes(to_dict)

    # json.dumps only (serialization cost)
    def dumps():
        return json.dumps(doc, indent=2)

    dumps_s = time_call(dumps, repeats=max(1, repeats if n <= 10_000 else 1))
    payload, peak_dumps = peak_memory_bytes(dumps)
    payload_bytes = len(payload.encode("utf-8"))

    # write() to disk
    out_path = out_dir / f"bench_{n}.trace.json"

    def write():
        tr.write(out_path)

    write_s = time_call(write, repeats=1)  # I/O — single sample
    _, peak_write = peak_memory_bytes(write)

    return {
        "events": n,
        "actual_events": actual,
        "generate_s": round(gen_s, 6),
        "to_dict_s": round(to_dict_s, 6),
        "json_dumps_s": round(dumps_s, 6),
        "write_s": round(write_s, 6),
        "payload_bytes": payload_bytes,
        "payload_mb": round(payload_bytes / (1024 * 1024), 4),
        "peak_generate_bytes": peak_gen,
        "peak_to_dict_bytes": peak_dict,
        "peak_dumps_bytes": peak_dumps,
        "peak_write_bytes": peak_write,
        "events_per_s_generate": int(n / gen_s) if gen_s > 0 else None,
        "trace_path": str(out_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="AlgoVerse Python emit/write benchmarks")
    parser.add_argument(
        "--sizes",
        default=",".join(str(s) for s in SIZES),
        help="Comma-separated event counts",
    )
    parser.add_argument("--repeats", type=int, default=3, help="Median over N runs (small sizes)")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=ROOT / "benchmarks" / "results",
        help="Directory for JSON traces + results",
    )
    args = parser.parse_args()
    sizes = [int(x) for x in args.sizes.split(",") if x.strip()]
    args.out_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for n in sizes:
        print(f"[python] events={n} …", flush=True)
        row = bench_size(n, repeats=args.repeats, out_dir=args.out_dir)
        rows.append(row)
        print(
            f"  gen={row['generate_s']:.4f}s  dumps={row['json_dumps_s']:.4f}s  "
            f"write={row['write_s']:.4f}s  payload={row['payload_mb']}MB",
            flush=True,
        )

    out_json = args.out_dir / "python_emit_write.json"
    out_json.write_text(json.dumps({"suite": "python_emit_write", "rows": rows}, indent=2), encoding="utf-8")
    print(f"[python] wrote {out_json}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
