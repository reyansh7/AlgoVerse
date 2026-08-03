# AlgoVerse repository audit

**Date:** 2026-08-03  
**Scope:** Full repo after Phase 1–2 (metadata bootstrap + StructureStage Trace routing)  
**Source of truth for migration:** [`docs/MIGRATION.md`](docs/MIGRATION.md)

## Summary

Trace infrastructure is healthy: `@algoverse/trace`, Python SDK, CLI, and `/trace` form a coherent pipeline. The main debt is a **dual-dialect / dual-playback** website layer (Learn `ExecutionEvent` vs Trace) plus accumulated shims, aliases, and unused dependencies. Learn catalog must not be mass-deleted; migrate opportunistically per [`docs/MIGRATION.md`](docs/MIGRATION.md).

```text
Healthy:   Python → Trace → validate → /trace → StructureStage
Debt:      Learn ExecutionEvent ‖ Playground snapshots ‖ dual scrubbers
```

---

## Classification legend

| Class | Meaning |
|-------|---------|
| **Delete** | Safe to remove; unused or superseded |
| **Keep** | Required now; do not remove |
| **Refactor** | Keep behavior; simplify / consolidate |
| **Future** | Correct direction; blocked on a later migration phase |

---

## Keep (critical)

| Item | Path(s) | Why |
|------|---------|-----|
| Trace package | `packages/trace/**` | Public Trace API |
| Python SDK | `sdk/python/**` | Language adapter |
| CLI | `cli/**` | Run → validate → open player |
| Examples / fixtures | `examples/bubble.py`, `packages/trace/fixtures/`, `public/samples/` | Golden path |
| Trace web client | `src/app/trace/**`, `src/components/trace/**`, `src/store/playerStore.ts`, `src/store/traceStore.ts` | Trace Player |
| Frame bridge | `src/engine/state/frame-to-execution.ts` | Frame → ExecutionState |
| Structure router | `src/renderers/StructureStage.tsx` + real renderers | Structure-presence routing |
| Learn catalog | `src/problems/**`, `src/components/learn/**`, `src/app/learn/**` | Website experience |
| Learn event pipeline | `src/core/events/**`, `src/store/playback-store.ts` | Until Trace migration |
| Playground (legacy) | `src/core/execution/adapters/**`, `src/problems/catalog.ts` | Do not extend; do not mass-delete |
| Contracts / migration | `docs/TRACE.md`, `FRAMES.md`, `MIGRATION.md`, `TRACE_PLAYER.md` | Architecture docs |

---

## Delete (low risk)

| Item | Path(s) | Why |
|------|---------|-----|
| Unused renderer aliases | `src/renderers/heap/`, `trie/`, `bst/` | StructureStage unused; were Tree/Array wrappers |
| Dead re-exports | `src/lib/frame-to-execution.ts`, `src/components/panels/*`, `src/components/playback/*` | Deprecated; no importers |
| Dead modules | `src/lib/storage.ts`, `src/core/camera/focus.ts`, `src/core/timeline/controller.ts`, `src/engine/playback/` | No callers |
| Unused animation half | `src/core/animation/orchestrator.ts`, unused `planStepAnimation` path | Renderers use `diffStates` directly |
| Stub panels | `src/panels/Stack/`, `src/panels/Memory/` (`return null`) | Not mounted; strip exports |
| Python dead export | `sdk/python/algoverse/export.py` | Unused re-export |
| Unused npm deps | `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` | No `src/` imports (verify before remove) |
| Generated traces | `*.trace.json` outside fixtures/samples | Already gitignored; local cleanup only |

**Do not delete** Learn events, engine event shims (until import rewrite), adapters, or playback-store.

---

## Refactor

| Item | Path(s) | Why |
|------|---------|-----|
| Engine event shims | `src/engine/events/**` | Pure re-exports of `@/core/events`; collapse imports |
| Dual playback UI | `PlaybackControls` ↔ `TracePlaybackControls`, dual clocks | Same chrome, two stores — unify in Phase 5 |
| HighlightKind duplication | `src/core/types/execution.ts` ↔ `packages/trace` | Single source; adapter already remaps |
| Learn type name `FrameState` | `src/core/events/reduce.ts` | Collides conceptually with Trace `Frame` — rename |
| Landing LiveDemo | `src/components/landing/LiveDemo.tsx` | Uses Learn dialect; optional Trace sample later |
| `callStack` drop | `frame-to-execution.ts` | Trace has `callStack`; ExecutionState does not — extend carefully |
| Dual panel homes | `src/panels` vs `src/components/panels` | Finish migration; delete components side |

---

## Future (migration-aligned)

| Item | Why | Phase |
|------|-----|-------|
| Freeze `ExecutionEvent` + Learn→Trace adapter | New work must not expand old dialect | 3 |
| Opportunistic Learn→Trace per touched problem | No wholesale rewrite | 4 |
| Unify playback stores / clocks / controls | Learn becomes Trace client | 5 |
| Retire ExecutionEvent + snapshot adapters | Single dialect | 6 |
| Contract docs `TRACE_SPEC` / `RENDERER_API` / `PLUGIN_API` | Elevate TRACE/FRAMES | 0 (docs) |
| Trace structure events (tree/graph/…) | Beyond array v0.1 | Trace v0.2 |
| Plugin / custom renderers | Reserved | v0.4 |

---

## Duplicated systems (map)

```text
Dialect A (Trace)          Dialect B (Learn)           Dialect C (Playground)
7 events → Frame           17 ExecutionEvent           Snapshot ExecutionState[]
playerStore                playback-store              playback-store
TracePlaybackControls      PlaybackControls            PlaybackControls
        \                      |                      /
         \                     |                     /
          └── StructureStage ← ExecutionState ──────┘
```

**Target:** A only. B adapts into A over time. C converts on touch or dies.

---

## Priority order

| Priority | Action |
|----------|--------|
| P0 | Delete safe dead aliases / shims / unused deps (hygiene PR) |
| P1 | Phase 0 contract elevation (`docs/contracts/*`) |
| P2 | Phase 3 Learn→Trace adapter (array subset) |
| P3 | Pass `callStack` / real stack panel when Trace needs it |
| P4 | Phase 5 unify playback |
| P5 | Phase 6 retire dual dialect |

---

## What not to do

- Do not rewrite ~196 Learn solutions in one PR.  
- Do not expand `ExecutionEvent` for new features.  
- Do not add Playground snapshot adapters.  
- Do not put algorithm/language/SDK checks in renderers or `StructureStage`.  
- Do not leak React into `packages/trace`.

---

## Verification snapshot (post Sprint 2)

| Check | Status |
|-------|--------|
| `npm run test:trace` | Pass (17 tests) |
| `npm run test:python` | Pass (11 tests) |
| `npm run algoverse -- run examples/bubble.py --no-open` | Validates Trace |
| TraceWorkspace loading / upload / empty controls | Done |
| Dead alias renderers / unused deps cleanup | Done |
| CLI `--help` / `--version` | Done |

---

## Related docs

- [`docs/MIGRATION.md`](docs/MIGRATION.md) — phased Trace-first plan  
- [`docs/TRACE.md`](docs/TRACE.md) — Trace format  
- [`docs/TRACE_PLAYER.md`](docs/TRACE_PLAYER.md) — web binding  
- [`docs/FRAMES.md`](docs/FRAMES.md) — renderer contract  
- [`sdk/python/README.md`](sdk/python/README.md) — Python SDK  
- [`cli/README.md`](cli/README.md) — CLI  
