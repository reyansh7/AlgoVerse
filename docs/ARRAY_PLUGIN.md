# AlgoVerse Array Plugin (v0.3)

**Status:** Core shipping (adjusted scope approved)  
**Trace spec:** Frozen at v0.1  
**Hard rules:** No new Trace event types. No frontend / renderer / CLI changes. Manual `Trace` unchanged.

## Approved scope adjustment

Array Core **stops** once the six canonical sorts are fully supported and stable.

AlgoVerse is a reusable execution visualization platform — **not** a complete observable `list` clone.

- **Recommended / Advanced** Array features stay on the roadmap.  
- They **must not delay** the Tree Plugin.  
- Next milestone after Array Core: **Tree Plugin** (`TraceTree`).

## Philosophy

```text
Observable data structures → TraceDocument → Player
```

Not per-algorithm plugins. `TraceArray` is the reference structure plugin.

## Trace v0.1 emission contract

| Channel | Events | Player effect |
|---------|--------|---------------|
| Structure | `swap` only | Bars move |
| Variables | `assign` | Variables panel |
| Attention | `compare`, `highlight` | Highlights |
| Control flow | `call`, `return`, `line` | Session |

Insertion/merge shifts: valid traces + current variables; bars follow swaps only.

## Layout

```text
sdk/python/algoverse/instrument/structures/
  base.py      # TraceStructure
  array.py     # TraceArray (Array Plugin Core)
  __init__.py
```

Public imports unchanged: `from algoverse import TraceArray, visualize`.

## Core surface (shipped)

Index ±, slice get/set/del, swap detection, append/extend/insert/pop/clear,
reverse (one assign), best-effort compare from paired reads, session
register → line stamp + flush-on-stop.

## Validation suite

| Sort | Path |
|------|------|
| Six sorts | `examples/array_plugin/sorts.py` |
| Tests | `sdk/python/tests/test_six_sorts.py`, `test_array_plugin_core.py` |

## Classification (backlog — do not expand Core)

| Tier | Examples | When |
|------|----------|------|
| Recommended | `remove`, `sort`, `copy` policy, `enumerate` | After Tree Plugin starts, if needed |
| Advanced | dense iter tracking, `*=` | Rare |
| Future | Trace v0.2 structure-write events | Separate RFC |

## Next

1. Array Core complete when six-sort suite is stable.  
2. Begin **Tree Plugin** design (same `TraceStructure` contract).  
3. Keep Recommended Array items backlog-only.
