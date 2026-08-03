# AlgoVerse Python SDK

Emit [Trace v0.1](../../docs/TRACE.md) JSON from Python.

This package is a language adapter. It does not visualize, parse your AST, or
rewrite your code. Manual `Trace` methods and the additive auto layer both
write the same portable `.trace.json`.

```text
Your Python  →  algoverse.Trace  →  *.trace.json  →  @algoverse/trace  →  Player
                 ↑
        InstrumentationSession + TraceArray (optional auto emitters)
```

- **Manual `Trace`:** fully supported, primary precise API  
- **`InstrumentationSession`:** Milestone 1 — control-flow (`call` / `return` / `line` / `assign`)  
- **`TraceArray`:** Milestone 2 — structure bootstrap + `swap` / `assign`  
- **Not yet:** `@visualize`, compare inference, AST/bytecode rewriting  

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

`Trace(...)` raises **`TraceError` at construction** if `metadata.initial.array` is missing.
`write()` also raises `TraceError` for non-JSON values or I/O failures.

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

Public exports: `Trace`, `TraceError`, `InstrumentationSession`, `TraceArray`,
`TraceStructure`, `__version__`.

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

## Automatic instrumentation (Milestone 1)

`InstrumentationSession` wraps one function call, emits into a `Trace`, and
always restores the previous `sys.settrace` hook.

```python
from algoverse import InstrumentationSession

def add(a: int, b: int) -> int:
    s = a + b
    return s

session = InstrumentationSession(
    algorithm="add",
    metadata={"initial": {"array": [0]}},
    source_code="def add(a, b):\n    s = a + b\n    return s\n",
)
result = session.run(add, 2, 3)   # → 5; session.trace has call/line/assign/return
session.trace.write("add.trace.json")
```

| Method | Role |
|--------|------|
| `run(fn, *args, **kwargs)` | Preferred — start, call, stop (even on error) |
| `start(fn)` / `stop()` | Lower-level; prefer `run` |
| `trace` | The underlying `Trace` (owned or adopted via `trace=`) |

**Scope:** only the target function’s `__code__` is traced (nested helpers are ignored).

---

## TraceArray (Milestone 2)

`TraceArray` wraps a list, seeds `metadata.initial.array`, and emits `swap` /
`assign` through the existing `Trace` API. Prefer `TraceArray.tracked()`:

```python
from algoverse import InstrumentationSession, TraceArray

tr, nums = TraceArray.tracked([5, 1, 4, 2], algorithm="bubble_sort")

def bubble(a):
    n = len(a)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

InstrumentationSession(trace=tr).run(bubble, nums)
nums.flush()
tr.write()
```

| Behavior | Detail |
|----------|--------|
| Bootstrap | Frozen copy into `metadata.initial.array` (mutations do not alter seed) |
| Swap | Detects exchange patterns → `trace.swap(i, j)` + optional `assign` |
| Single write | Variables `assign` only — Trace v0.1 has no structure-set event |
| Reads | Tracked in a 2-slot ring for future compare; **no** event emitted yet |
| `sync_assign=False` | Skip O(n) variable snapshots after mutations (structure `swap` still emits) |

`TraceStructure` is the base class for future Tree / Graph / Queue wrappers.
Session local-diffs skip any object whose type sets `_algoverse_structure`.

Example: [`examples/bubble_trace_array.py`](../../examples/bubble_trace_array.py).

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

## Tests

From the repo root (with the package on `PYTHONPATH` or installed editable):

```bash
pip install -e sdk/python
npm run test:python
# or: python -m unittest discover -s sdk/python/tests -v
```
