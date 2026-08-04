# Sprint 3 — Automatic instrumentation (plan)

**Status:** Architecture approved — implementing incrementally  
**Architecture / Trace spec:** Frozen  
**Hard rule:** TraceDocument v0.1 is unchanged. Frontend / renderers / CLI player path unchanged. Only **how** TraceDocuments are produced evolves.

Manual `Trace` remains supported forever. Auto-instrumentation is an additional emitter that must produce the **same** valid Trace JSON.

### Milestone progress

| Milestone | Deliverable | Status |
|-----------|-------------|--------|
| 1 | `InstrumentationSession` (`sys.settrace` → `call` / `return` / `line` / `assign`) | **Done** |
| 2 | `TraceArray` (list proxy → structure bootstrap / swap / assign) | **Done** |
| 3 | `@visualize` public API (+ optional player launch) | **Done** |
| — | Sprint 3 complete → v0.3 Array Plugin | See [`ARRAY_PLUGIN.md`](./ARRAY_PLUGIN.md) |

Naming note: plan text historically said `TrackedArray`; implementation uses **`TraceArray`**.

---

## Problem

Today users must narrate execution by hand:

```python
tr.compare(j, j + 1, values=[a[j], a[j + 1]])
tr.swap(j, j + 1)
tr.assign("array", list(a))
```

Desired:

```python
from algoverse import visualize

@visualize
def bubble_sort(arr):
    ...
bubble_sort([5, 4, 3, 2])
```

→ valid TraceDocument → validate → Trace Player.

---

## Options compared

| Approach | What it gives | Pros | Cons | Fit for AlgoVerse |
|----------|---------------|------|------|-------------------|
| **Manual** (today) | Exact semantic events | Precise, simple, contributor-friendly | Verbose | Keep as baseline API |
| **Decorator only** | UX sugar | Clean public API | Does nothing alone — needs a backend | Required as the **user** |
| **AST rewrite** | Can inject `compare`/`swap` at known patterns | Powerful for static patterns | Fragile across Python versions; hard for contributors; language-specific forever | Poor as primary; optional later |
| **`sys.settrace` / `sys.monitoring`** | `line`, `call`, `return`, locals | Stdlib; known (Python Tutor); no source rewrite | Does **not** know “compare” vs “swap”; noisy; slow; CPython-oriented | Excellent for **control-flow** events |
| **Bytecode rewrite** | Deep hooks | Fine-grained | Expert-only; opaque; bad OSS DX; CPython-tied | Reject as primary |
| **Instrumented collections** (proxy list) | Structure mutations: reads/writes → `assign` / `swap` / hints for `compare` | Semantic events without parsing algorithms; portable idea (JS Proxy, etc.) | Must wrap inputs; edge cases (in-place methods, slices) | Excellent for **structure** events |
| **Hybrid** | Decorator + settrace + instrumented array → `Trace` | Matches Trace vocabulary; keep manual path; multi-language story | More moving parts; need clear module boundaries | **Recommended** |

### Why pure settrace is not enough

Trace v0.1 is **semantic**:

- `compare` / `swap` / `highlight` are not “line executed”
- `assign` is a variable bind; structure seed is `metadata.initial.array`
- Renderers animate `swap` and `compare`, not raw opcodes

`sys.settrace` sees lines and locals. It does not see “these two indices were compared” unless we infer that from reads/writes or AST.

### Why not AST-first

- Couples AlgoVerse to CPython AST forever
- High maintenance; hostile to new contributors
- Other languages cannot reuse it — fights the “language adapters → Trace” vision

### Why hybrid matches the long-term vision

```text
Python adapter          JS adapter (future)         …
(decorator + settrace   (Proxy / instrumentation)
 + TraceArray)
        \                      /
         \                    /
          ▼                  ▼
              TraceDocument  (frozen)
                      │
                      ▼
              Trace Player / renderers
```

Each language invents its own instrumentation. **None** change the Trace format.

---

## Recommended architecture

### Name

**AlgoVerse Python Auto-Emitter (v0.1)** — hybrid instrumentation adapter.

### Layers

```text
@visualize / visualize(fn)          ← public UX
        │
        ▼
Instrumentation session             ← owns Trace lifecycle
        │
        ├─ sys.settrace (or sys.monitoring on 3.12+)
        │     → call, return, line, assign (locals diff)
        │
        └─ TraceArray (list proxy; was “TrackedArray” in early drafts)
              → structure bootstrap metadata.initial.array
              → swap (detect exchange / paired setitem)
              → compare (best-effort: paired getitem before branch)
              → assign("array", …) after structural mutation (variables panel)
        │
        ▼
Existing Trace / Trace.write()      ← unchanged emitter
        │
        ▼
Same CLI / Player path              ← unchanged
```

### Design principles

1. **Emit only through `Trace`** — no second JSON schema.  
2. **Manual Trace never breaks** — auto path is additive.  
3. **Opt-in wrapping** — first list/tuple arg (or explicit `array=`) becomes `TraceArray`; document the contract.  
4. **Best-effort semantics** — Sprint 3 ships solid `call` / `return` / `line` / `assign` / `swap` / metadata bootstrap; `compare` / `highlight` improve iteratively without format changes.  
5. **No Player/renderer edits** unless a bug blocks playback of valid traces.  
6. **Contributor-sized modules** — no megaclass; clear files under `sdk/python/algoverse/`.

### Public API sketch (not implemented yet)

```python
from algoverse import visualize, Trace  # Trace stays

@visualize                    # or @visualize(open_player=True)
def bubble_sort(arr):
    ...

bubble_sort([5, 1, 4, 2])     # writes .trace.json; optional player open
```

Options (proposed):

| Option | Default | Meaning |
|--------|---------|---------|
| `algorithm` | `fn.__name__` | Trace `algorithm` field |
| `open_player` | `False` (or env) | After write, invoke same open path as CLI / print path |
| `out` | env / `{algorithm}.trace.json` | Output path |
| `track` | first list-like arg | Which argument is the primary array |

### What Sprint 3 will **not** do

- Change Trace event vocabulary or bootstrap rules  
- AST rewriting as the primary engine  
- Bytecode rewriting  
- Auto-instrument all of Python (stdlib, numpy, …)  
- Learn website migration  
- Multi-language emitters  

---

## Sprint 3 task breakdown

### Task 1 — Instrumentation design doc + module skeleton

| Field | Detail |
|-------|--------|
| **Goal** | Lock the hybrid design in-repo; empty modules with docstrings; no behavior yet. |
| **Files** | `docs/SPRINT3.md` (this file), `sdk/python/algoverse/instrument/` (`session.py` shipped; `trace_array.py`, `visualize.py` next), `sdk/python/README.md` |
| **Acceptance** | Imports resolve; manual Trace tests still pass; stubs raise `NotImplementedError` or are no-ops clearly marked. |
| **Risks** | Over-building stubs — keep tiny. |
| **Tests** | Import smoke test. |

### Task 2 — `TraceArray`: bootstrap + assign + swap ✅

| Field | Detail |
|-------|--------|
| **Goal** | List-like proxy that drives structure events via existing `Trace`. |
| **Files** | `sdk/python/algoverse/instrument/trace_array.py`, `tests/test_trace_array.py`, `examples/bubble_trace_array.py` |
| **Acceptance** | Wrapping `[5,1,4,2]` sets/keeps `metadata.initial.array`; in-place swap of two indices emits `swap` + optional `assign("array", …)`; `len` / iterate / index get work; produces JSON that `parseTrace` accepts when composed with a Trace. |
| **Risks** | Slice assignment, `sort()`, `append` — document unsupported or emit assign-only updates; do not invent new Trace events. |
| **Tests** | Unit tests for swap detection, bootstrap, session composition. |
| **Shipped** | Milestone 2 — `TraceStructure` base, O(1) swap pending, frozen metadata seed, `sync_assign` opt-out, read ring (no compare yet). |

### Task 3 — `sys.settrace` session: call / return / line / assign ✅

| Field | Detail |
|-------|--------|
| **Goal** | Scoped tracer around a user function; emit control-flow + local variable assigns. |
| **Files** | `sdk/python/algoverse/instrument/session.py` (`InstrumentationSession`), package exports, `tests/test_instrumentation_session.py` |
| **Acceptance** | Enter/exit emit `call`/`return`; line changes emit `line`; local changes emit `assign`; tracer restored after exceptions; no leak of global trace hook. |
| **Risks** | Performance; recursion; tracing AlgoVerse internals — filter by code object / filename. |
| **Tests** | Nested calls, exception path restores previous `sys.gettrace()`, event order sanity. |
| **Shipped** | Milestone 1 — filter by target `__code__`; deep-copied local diffs; `run` / `start` / `stop` / context manager. |

### Task 4 — Best-effort `compare` (and optional highlight)

| Field | Detail |
|-------|--------|
| **Goal** | Emit `compare(i,j)` when TraceArray can infer a pairwise read used for ordering (documented heuristics). |
| **Files** | `trace_array.py`, `session.py`, docs |
| **Acceptance** | Bubble-sort-like loops produce compare events for adjacent indices in the common pattern; wrong inferences documented as best-effort; never emit invalid Trace fields. |
| **Risks** | False positives/negatives — keep heuristics conservative; prefer missing compare over wrong swap. |
| **Tests** | Golden-ish bubble under auto mode vs manual fixture shape (not byte-identical; same event types present). |

### Task 5 — `@visualize` / `visualize()` public API ✅

| Field | Detail |
|-------|--------|
| **Goal** | Wire TraceArray + InstrumentationSession + Trace write into one decorator. |
| **Files** | `sdk/python/algoverse/instrument/visualize.py`, `launch.py`, exports, `tests/test_visualize.py`, `examples/bubble_visualize.py` |
| **Acceptance** | Example `@visualize def bubble_sort(arr): ...` writes valid `.trace.json` with `metadata.initial.array`; return value preserved; works with `ALGOVERSE_TRACE_OUT`. |
| **Risks** | Arg binding (defaults, kwargs) — use `inspect.signature`. |
| **Tests** | End-to-end decorator test; ensure manual `Trace` still exported and tested. |
| **Shipped** | Milestone 3 — `@visualize` / `@visualize(...)`, track by name/index, write/open_player opts, env flags, `last_trace` / `last_path`. |

### Task 6 — Player launch hook (optional path) ✅ (best-effort)

| Field | Detail |
|-------|--------|
| **Goal** | After write, optionally open Trace Player without changing frontend. |
| **Files** | `sdk/python/algoverse/instrument/launch.py` |
| **Acceptance** | `open_player=True` or env `ALGOVERSE_OPEN_PLAYER=1` stages under `public/traces/` when repo detected and opens browser; else prints tip. No React/CLI changes. |
| **Tests** | Mock launch; assert write still happens if launch fails. |
| **Shipped** | Python-side copy + `webbrowser.open`. |

### Task 7 — Examples + docs

| Field | Detail |
|-------|--------|
| **Goal** | `examples/bubble_auto.py` (or similar) + SDK docs for auto vs manual. |
| **Files** | `examples/`, `sdk/python/README.md`, `docs/TRACE.md` (pointer only — format unchanged), `docs/ROADMAP.md` |
| **Acceptance** | README shows both workflows; auto example runs under unittest or documented CLI. |
| **Risks** | Docs drift — keep one canonical auto example. |
| **Tests** | Run auto example in CI-style unittest if feasible. |

### Task 8 — Hardening + Sprint 3 closure

| Field | Detail |
|-------|--------|
| **Goal** | Filter noise, document limitations, mark Sprint 3 done. |
| **Files** | tracer filters, CONTRIBUTING, SPRINT3 progress, ROADMAP |
| **Acceptance** | Known limitations listed (slices, custom classes, threads); all new tests pass; `npm run test:trace` + `test:python` green; manual bubble example unchanged. |
| **Risks** | Scope creep into AST — explicitly defer. |
| **Tests** | Full Python suite + Trace suite. |

---

## Implementation order

**Shipped:** Milestone 1 (`InstrumentationSession`), Milestone 2 (`TraceArray`), Milestone 3 (`@visualize` + optional player launch).

Remaining: 4 (compare quality) → 7 (docs polish) → 8 (hardening / Sprint 3 closure)

---

## Success criteria (Sprint 3 overall)

- User can decorate a simple in-place list sort and get a **valid** TraceDocument.  
- Trace schema / Player / renderers **untouched** (except docs pointers).  
- Manual `Trace` API unchanged and tested.  
- Architecture remains: **adapter emits Trace → engine → frames → renderers**.  
- Limitations are honest and documented.

---

## Explicit deferrals

| Item | When |
|------|------|
| AST rewriting | Later research / opt-in plugin |
| Bytecode rewriting | Not planned |
| Threads / async | Later |
| numpy / non-list structures | Trace v0.2+ structures |
| Perfect compare for all algorithms | Iterative |
| Learn site auto-emit | Migration Phase 3+ |

---

## Approval gate

**Approved.** Hybrid architecture (decorator + `sys.settrace` + `TraceArray` → existing `Trace`).  
Milestones 1–2 shipped. **Performance baseline:** [`benchmarks/BASELINE.md`](../benchmarks/BASELINE.md) (run via `npm run bench`) — gate before Milestone 3 (`@visualize`). Do not optimize from the baseline until product needs demand it.
