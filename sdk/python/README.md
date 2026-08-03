# AlgoVerse Python SDK

Emit [Trace v0.1](../../docs/TRACE.md) JSON from **manually instrumented** Python.

This package is a language adapter. It does not visualize, parse your AST, or
rewrite your code. You call Trace methods; it writes a portable `.trace.json`.

```text
Your Python  →  algoverse.Trace  →  *.trace.json  →  @algoverse/trace  →  Player
```

- **v0.1:** manual instrumentation only  
- **Not in v0.1:** `@visualize` decorators, AST rewriting, auto-instrumentation  

---

## Install

From the AlgoVerse repo root:

```bash
pip install -e sdk/python
```

Requires Python ≥ 3.9. Zero runtime dependencies.

---

## Quick start

```python
from algoverse import Trace

tr = Trace(
    algorithm="bubble_sort",
    source_path="bubble.py",
    source_code="def bubble_sort(nums): ...",
    metadata={"initial": {"array": [5, 1, 4, 2]}},
)

tr.call("bubble_sort", args={"n": 4}, line=1)
tr.assign("array", [5, 1, 4, 2], line=1)      # variables only
tr.compare(0, 1, values=[5, 1], line=5)
tr.swap(0, 1, line=6)
tr.assign("array", [1, 5, 4, 2], line=6)      # refresh Variables panel after swap
tr.return_("bubble_sort", value=[1, 2, 4, 5], line=7)
tr.write("bubble_sort.trace.json")
```

Then play it:

```bash
# with Next.js running (npm run dev)
npm run algoverse -- run examples/bubble.py
```

Or open [/trace](http://localhost:3000/trace) and upload the JSON.

Full example: [`examples/bubble.py`](../../examples/bubble.py).

---

## Structure bootstrap (required)

v0.1 array traces **must** seed the visual array via metadata:

```python
Trace(
    algorithm="…",
    metadata={"initial": {"array": […]}},
)
```

| Rule | Detail |
|------|--------|
| Seed | `metadata["initial"]["array"]` only |
| `assign` | Pure variable bind — **never** seeds or mutates `structures` |
| `swap` | Mutates the array structure in the Trace reducer |
| Variable names | User-defined; must not affect rendering |

`Trace.to_dict()` / `write()` raise `ValueError` if `metadata.initial.array` is missing.

---

## Event API

All event methods return `self` for chaining. Optional kwargs on every event:
`line: int`, `description: str`.

| Method | Trace event | Data |
|--------|-------------|------|
| `assign(name, value)` | `assign` | `{ name, value }` |
| `compare(i, j, values=…)` | `compare` | `{ i, j, values? }` |
| `swap(i, j)` | `swap` | `{ i, j }` |
| `call(frame, args=…)` | `call` | `{ frame, args? }` |
| `return_(frame, value=…)` | `return` | `{ frame, value? }` |
| `line(n)` | `line` | `{ line }` |
| `highlight(indices=…, kinds=…, sorted=…, clear=…)` | `highlight` | optional fields |

`return_` is named that way because `return` is a Python keyword.

### Highlights

```python
tr.highlight(
    indices=[0, 1],
    kinds={0: "comparing", 1: "comparing"},
    sorted=[2, 3],
    clear=False,
    line=5,
    description="Pass complete",
)
```

`kinds` keys are stringified in JSON for portability.

---

## Export

| Method | Behavior |
|--------|----------|
| `to_dict()` | TraceDocument as a `dict` (validated bootstrap) |
| `write(path=None)` | Pretty-printed JSON; returns absolute `Path` |

**Output path resolution (first match):**

1. `write(path)` argument  
2. Environment `ALGOVERSE_TRACE_OUT`  
3. `{algorithm}.trace.json` in the current working directory  

On success, prints:

```text
[algoverse] wrote C:\…\bubble_sort.trace.json
```

The CLI watches for that line / file to discover the trace.

---

## Constructor

```python
Trace(
    algorithm: str,                 # required document id
    *,
    language: str = "python",       # metadata only — renderers ignore it
    source_path: str | None = None,
    source_code: str | None = None, # shown in Trace Player code panel
    metadata: Mapping | None = None,
)
```

---

## Design notes

- Emitters talk to the **Trace format**, never to React or renderers.  
- Timestamps are monotonic integers assigned by the recorder.  
- No network I/O; `write` is local filesystem only.  
- Schema: [`packages/trace/schema/trace-v0.1.json`](../../packages/trace/schema/trace-v0.1.json).  

---

## Environment

| Variable | Purpose |
|----------|---------|
| `ALGOVERSE_TRACE_OUT` | Default write path (also set by the CLI) |
