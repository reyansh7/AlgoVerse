# Trace-first migration plan

**Status:** Architecture frozen. Implementation begins with this plan.  
**Rule:** Trace format is the public API. Everything else is replaceable.  
**Constraint:** Incremental. Never break existing Learn functionality. Never wholesale-rewrite Learn solutions.

---

## Locked decisions

| Decision | Rule |
|----------|------|
| Learn vs Trace | Learn = website experience. Trace = infrastructure. Learn migrates toward Trace over time. |
| New work | Every new renderer, SDK, adapter, CLI feature, and viz capability is Trace-first. |
| Learn edits | Prefer adapting touched Learn code to Trace; do not expand `ExecutionEvent`. |
| Structure seeding | Structures initialize **only** from explicit Trace metadata (or a future explicit bootstrap in the Trace spec). Never from variable names. |
| `assign` | Pure variable assignment. No structure side effects. |
| Scope | Do not redesign. Migrate. Harden contracts. |

---

## Current architecture (as-is)

Three parallel pipelines share renderers via `ExecutionState`:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEBSITE CLIENTS                                 │
│  LearnWorkspace          Playground              TraceWorkspace         │
│  playback-store          playback-store          playerStore+traceStore │
└──────────┬─────────────────────┬────────────────────────┬───────────────┘
           │                     │                        │
           ▼                     ▼                        ▼
   ExecutionEvent[]        ExecutionState[]        TraceDocument
   (EventRecorder)         (snapshot adapters)     (@algoverse/trace)
           │                     │                        │
           ▼                     │                        ▼
   eventsToStates                │                 reduceTrace → Frame[]
           │                     │                        │
           └──────────┬──────────┘                        │
                      ▼                                   ▼
              ExecutionState[]              frameToExecutionState
                      │                                   │
                      └───────────────┬───────────────────┘
                                      ▼
                         StructureStage / ArrayRenderer
                         VariablesPanel (+ other panels)
```

**Dialects today**

| Layer | Format | Consumers |
|-------|--------|-----------|
| Trace v0.1 | 7 events → `Frame` | Python SDK, CLI, `/trace` |
| Learn | 17 `ExecutionEvent` types → `ExecutionState` | ~196 Learn problems |
| Playground | Snapshot `ExecutionState[]` | 13 legacy adapters |

---

## Target architecture (to-be)

```text
Language / Learn adapter / SDK
        │
        ▼
  TraceDocument  ←── sole public interchange format
        │
        ▼
  @algoverse/trace  (parse → reduce → Frame[] → TracePlayer)
        │
        ▼
  Frame → ExecutionState adapter  (website-only bridge; replaceable)
        │
        ▼
  StructureStage → Renderers → Panels
```

Long-term: Learn solutions become Trace producers (directly or via a thin adapter). `ExecutionEvent` stops growing and is eventually retired per-problem, not deleted in one PR.

---

## Dependency graph

```text
                    ┌──────────────────────┐
                    │  TRACE SPEC (v0.1)   │
                    │  schema + events     │
                    │  packages/trace      │
                    └──────────┬───────────┘
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   sdk/python            TraceRecorder TS      JSON Schema
   (emitter)             (packages/trace)      (validate)
           │                   │                   │
           └─────────┬─────────┴───────────────────┘
                     ▼
              TraceDocument JSON
                     │
         ┌───────────┼────────────┐
         ▼           ▼            ▼
        CLI      /trace page   (future: VSCode, React pkg)
         │           │
         │           ▼
         │    playerStore + TracePlayer
         │           │
         │           ▼
         │    frameToExecutionState ────┐
         │                              │
         │    Learn (ExecutionEvent)    │
         │           │                  │
         │           ▼                  │
         │    eventsToStates            │
         │           │                  │
         │           ▼                  ▼
         │    playback-store     ExecutionState
         │           │                  │
         └───────────┴────────┬─────────┘
                              ▼
                    StructureStage / Renderers
                              │
                              ▼
                           Panels / UI
```

**Critical edges to change**

1. `reduce.ts` / `serializer.ts` — remove name-based array seeding (`array` / `nums`).
2. Emitters (`examples/bubble.py`, fixtures, Python/TS recorders) — seed only via `metadata.initial`.
3. `frameToExecutionState` — become the sole Trace→web bridge; widen when Trace structures grow.
4. `StructureStage` — route by structure presence only (no algorithm-name hacks).
5. Learn (later phases) — adapter `ExecutionEvent[] → TraceDocument` or emit Trace directly when a problem is touched.

**Edges that must not break during migration**

- Learn: `ReferenceSolution.execute` → `ExecutionEvent[]` → `buildTimelineFromEvents` → `playback-store`
- Playground: adapters → `ExecutionState[]` → `playback-store`
- Shared: `ExecutionState` shape consumed by all renderers

---

## Phased migration checklist

### Phase 0 — Contracts (docs only, no runtime break)

- [ ] Add `docs/contracts/TRACE_SPEC.md` (elevate `docs/TRACE.md`; add versioning + BC rules; **remove** name-based seeding from the public contract).
- [ ] Add `docs/contracts/RENDERER_API.md` (elevate `docs/FRAMES.md`; structure-presence routing; frame-in only).
- [ ] Add `docs/contracts/PLUGIN_API.md` (stub: language adapters, custom renderers, exporters — reserved for v0.4+).
- [ ] Update `CONTRIBUTING.md` and `docs/ROADMAP.md` to point at contracts and this migration doc.
- [ ] Document: Learn/`ExecutionEvent` is website-internal; Trace is public API.

**Exit:** Contributors can tell Trace vs Learn without reading source.

---

### Phase 1 — Harden Trace bootstrap (breaking for Trace emitters only)

**Goal:** Structures never inferred from variable names. Learn untouched.

- [x] Spec: array (v0.1) must be seeded via `metadata.initial.array` only.
- [x] `packages/trace/src/reduce.ts` — delete `assign("array"|"nums")` structure side effect.
- [x] `packages/trace/src/reduce.ts` — stop syncing `variables.array` / `variables.nums` from `swap` as a special case of name-based structure binding (keep updating variables only if those keys exist as normal assigns — or drop special sync; prefer: swap mutates `structures.array` only; variables update only via `assign`).
- [x] `packages/trace/src/serializer.ts` — require `metadata.initial.array`; reject name-based bootstrap.
- [x] `packages/trace/src/schema.ts` — update `TraceInitialState` comments; clarify `assign` is variables-only.
- [x] `packages/trace/schema/trace-v0.1.json` — validation aligns with metadata-only seed.
- [x] Update fixtures: `packages/trace/fixtures/bubble.trace.json`, `public/samples/bubble.trace.json`.
- [x] Update `examples/bubble.py` — keep `metadata.initial.array`; keep `assign("array", …)` as a **variable** update only (optional but useful for Variables panel); do not rely on it for structure.
- [x] Sync Python SDK docs + `sdk/python/README.md` + `docs/TRACE.md`.
- [x] Sync TS `TraceRecorder` + `packages/trace/src/trace.test.ts`.
- [x] Verify: `npm run test:trace`, CLI `algoverse run examples/bubble.py`, `/trace` still plays.

**Exit:** Trace v0.1 bootstrap is metadata-only. Learn and Playground binary-identical in behavior.

**Compatibility note:** This is a deliberate Trace-emitter break inside v0.1 before external adopters. Document in TRACE_SPEC changelog. Do not bump to `0.2` unless event vocabulary changes — envelope version may stay `0.1` with a documented clarification, or bump if you treat bootstrap rules as versioned contract (prefer stay `0.1` + changelog if no wire-format field changes).

**Completed:** Phase 1 implemented; changelog recorded in `docs/TRACE.md`. Fixtures already had `metadata.initial.array` — no fixture edits required.

---

### Phase 2 — Trace player uses shared renderer stack

**Goal:** Trace path stops hardcoding `ArrayRenderer`. Learn still uses StructureStage unchanged.

- [x] Route TraceWorkspace through `StructureStage` (or equivalent structure-presence router).
- [x] Ensure `frameToExecutionState` copies all Frame structure keys needed for v0.1 (array) and is ready to pass through future keys without algorithm checks.
- [x] Remove / avoid Trace-only renderer forks.
- [x] Fix `StructureStage` algorithm-name hacks (`trie`/`208`, `heap`/`215-heap`) by structure discriminant (e.g. dedicated structure key, or `metadata.renderer` / structure kind in Frame — **only if** needed for Learn+Trace; prefer structure shape over algorithm id).  
  - **Learn safety:** `TrieRenderer` / `HeapRenderer` were aliases of Tree/Array — routing by structure alone preserves identical Learn visuals.
- [x] Shared playback UX debt (optional in this phase): document that `playback-store` and `playerStore` remain dual until Phase 4; do not merge clocks yet unless low-risk.

**Exit:** `/trace` and Learn share StructureStage. No algorithm-substring routing remains (or remaining hacks are ticketed with Learn-safe replacements).

**Completed:** StructureStage routes by structure presence only. TraceWorkspace uses StructureStage. Dual playback stores remain until later phases.

---

### Phase 3 — Stop expanding ExecutionEvent; add Learn→Trace adapter seam

**Goal:** New capability lands on Trace. Learn can optionally produce Trace without rewriting solutions.

- [ ] Freeze `ExecutionEvent` vocabulary — no new event types.
- [ ] Add `src/engine/trace/learn-events-to-trace.ts` (name flexible): `ExecutionEvent[]` + problem meta → `TraceDocument` for the **subset** that maps cleanly to Trace v0.1 (array/sort-like first).
- [ ] Unmapped Learn events (`setStructure`, `visitNode`, queue/stack, …) either:  
  - stay on Learn path until Trace v0.2 structure events exist, or  
  - map into `metadata` / future Trace events only when those events are specified.
- [ ] Optional: Learn “export trace” or dual-run behind a flag for one curated problem (e.g. bubble-sort) to prove the adapter.
- [ ] Do **not** change `ReferenceSolution.execute` return type yet.

**Exit:** A Learn array problem can produce a valid TraceDocument via adapter. Catalog still runs on ExecutionEvent.

---

### Phase 4 — Opportunistic Learn migration (per touch)

**Goal:** When a Learn feature/problem is edited, prefer Trace; never rewrite the catalog wholesale.

- [ ] Policy: PRs that touch a Learn solution should migrate **that** solution (or its family helper) toward Trace emission **if** Trace can express it.
- [ ] Start with curated sorting / array problems that already mirror Trace events (`compare` / `swap` / `highlight`).
- [ ] Introduce `executeTrace`-style optional path or change return type only behind a compatibility wrapper: `execute` continues to return something LearnWorkspace understands (either keep events, or accept Trace and adapt to timeline internally).
- [ ] Family generators: migrate generator helpers before mass-generated problems.
- [ ] Playground: do not add snapshot adapters; when touching one, convert to Trace emitter or shared EventRecorder→Trace adapter.
- [ ] Track migrated problem IDs in this doc or a small checklist file.

**Exit:** Growing set of Learn problems are Trace producers; unmigrated problems keep working.

---

### Phase 5 — Unify playback (later, careful)

**Goal:** One scrubber model driven by Trace frames (or Frame-compatible snapshots).

- [ ] Evaluate merging `playerStore` + `playback-store` behind a Frame/`ExecutionState` facade.
- [ ] Unify `PlaybackControls` / `TracePlaybackControls` and clocks.
- [ ] Keep Learn UX (Monaco, statement, tests) intact.
- [ ] Only after several Learn problems are Trace-native.

**Exit:** One playback stack; Learn is “another Trace client.”

---

### Phase 6 — Retire dual dialect (long-term)

- [ ] Remaining Learn problems migrated or wrapped.
- [ ] Delete or quarantine `ExecutionEvent` / `EventRecorder` / `eventsToStates` when unused.
- [ ] Playground snapshot adapters removed or Trace-only.
- [ ] `ExecutionState` either becomes a thin alias of `Frame` or stays a website DTO — Trace `Frame` remains source of truth in `packages/trace`.

**Exit:** Single dialect. Website fully Trace-consuming.

---

## Files that must change

### Phase 1 (immediate Trace bootstrap fix)

| File | Change |
|------|--------|
| `packages/trace/src/reduce.ts` | Remove name-based structure seeding; clarify swap vs variables |
| `packages/trace/src/serializer.ts` | Require `metadata.initial.array` only |
| `packages/trace/src/schema.ts` | Comments / types for metadata-only bootstrap |
| `packages/trace/schema/trace-v0.1.json` | Align validation |
| `packages/trace/src/recorder.ts` | Docs / ensure recorder sets metadata.initial |
| `packages/trace/src/trace.test.ts` | Tests for metadata-only; reject assign-only seed |
| `packages/trace/fixtures/bubble.trace.json` | Ensure metadata.initial present; assign is variable-only |
| `public/samples/bubble.trace.json` | Same |
| `examples/bubble.py` | Rely on metadata for structure |
| `sdk/python/algoverse/recorder.py` | Ensure metadata.initial is the seed path; docs in docstrings |
| `sdk/python/README.md` | Update examples |
| `docs/TRACE.md` | Remove assign-seed contract |
| `docs/FRAMES.md` / new contracts | Align |
| `packages/trace/README.md` | Align |
| `CONTRIBUTING.md` | Point to migration + contracts |

### Phase 2 (Trace ↔ shared renderers)

| File | Change |
|------|--------|
| `src/components/trace/TraceWorkspace.tsx` | Use StructureStage |
| `src/engine/state/frame-to-execution.ts` | Pass-through structures; no array-only hard limit beyond Trace Frame |
| `src/renderers/StructureStage.tsx` | Remove algorithm-name routing (Learn-safe replacement) |
| Possibly Learn trie/heap emitters | Only if StructureStage needs an explicit structure discriminant |

### Phase 3+ (adapter seam / opportunistic)

| File | Change |
|------|--------|
| **New** `src/engine/trace/*` (or `packages/trace` helper) | Learn events → TraceDocument adapter |
| `src/problems/**/solutions/*.ts` | Only when touched — prefer Trace |
| `src/problems/families/*.ts` | Only when touched |
| `src/problems/lib/viz.ts` | Prefer Trace-friendly helpers over new ExecutionEvent helpers |
| `src/core/events/*` | Freeze; no new types; eventually shrink |
| `src/store/playback-store.ts` / `playerStore.ts` | Phase 5 unify |
| `src/panels/Timeline/*` | Phase 5 unify controls |

### Contract docs (Phase 0)

| File | Change |
|------|--------|
| **New** `docs/contracts/TRACE_SPEC.md` | Immutable Trace contract |
| **New** `docs/contracts/RENDERER_API.md` | Immutable renderer contract |
| **New** `docs/contracts/PLUGIN_API.md` | Stub |
| `docs/MIGRATION.md` | This file — update checklist as phases complete |
| `docs/ROADMAP.md` | Link phases |
| `docs/STRUCTURE.md` | Reflect Trace-first boundaries |

---

## Files that must stay untouched

Do **not** rewrite or delete in early phases. Touch only with a Trace-adaptation goal (Phase 4+), never for “cleanup.”

### Learn catalog (freeze wholesale rewrites)

- `src/problems/families/**` — all 24 family generators / ~177 problems  
- `src/problems/*/solutions/*.ts` — curated solutions (except opportunistic single-problem migrations)  
- `src/problems/registry.ts`, `src/problems/define.ts`, `src/problems/types.ts` — until adapter requires a **additive** optional field  
- `src/components/learn/**` — Learn UX shell  
- `src/app/learn/**` — routes  

### Learn event pipeline (keep working)

- `src/core/events/types.ts`  
- `src/core/events/recorder.ts`  
- `src/core/events/reduce.ts`  
- `src/engine/events/**` (shims)  
- `src/engine/timeline/build.ts`  
- `src/engine/execution/run-solution.ts`  
- `src/store/playback-store.ts` (until Phase 5)  
- `src/hooks/usePlaybackClock.ts`, `src/hooks/useExecutionView.ts`  

### Playground legacy (do not extend; do not mass-delete)

- `src/core/execution/adapters/**`  
- `src/core/execution/registry.ts`  
- `src/problems/catalog.ts`  
- `src/components/playground/**`  
- `src/app/playground/**`  

### Shared renderer library (evolve carefully; do not delete)

- `src/renderers/array|tree|graph|queue|stack|linked-list|dp-table|hashmap|heap|trie|bst/**`  
- Renderer internals stay; only `StructureStage` routing and Trace wiring change in Phase 2  

### Website product surfaces unrelated to Trace bootstrap

- `src/app/page.tsx`, landing, explore, compare (compare may later consume Trace; no Phase 1 changes)  
- `src/components/landing/**`  
- Monaco / code-language display helpers (`src/lib/code-languages.ts`)  

### Trace package surface that stays stable (behavior changes only where specified)

- Event vocabulary in `packages/trace/src/events.ts` — **do not add/remove types in Phase 1**  
- `packages/trace/src/player.ts` — API stays  
- CLI command shape `algoverse run` — keep; only validation messages may change  

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Learn break from StructureStage fix | Ship Learn-safe discriminant first; golden-test a trie + heap Learn problem before removing string checks |
| Trace fixtures break after metadata-only seed | Update fixtures + tests in same PR as reduce/serializer |
| Dual playback confuses contributors | Document in STRUCTURE + CONTRIBUTING; unify only in Phase 5 |
| Adapter maps poorly for trees/graphs | Limit Phase 3 adapter to Trace v0.1 array events; defer structure events to Trace v0.2 |
| Premature ExecutionEvent deletion | Explicitly forbidden until Phase 6 |
| Silent reliance on `assign("array")` in the wild | Phase 1 validation error message must be explicit; update all in-repo emitters |

---

## Suggested PR sequence (incremental)

1. **Docs:** contracts + this migration plan linked from README/CONTRIBUTING.  
2. **Trace bootstrap:** reduce + serializer + fixtures + Python example + tests (Phase 1).  
3. **TraceWorkspace → StructureStage** + `frameToExecutionState` pass-through (Phase 2a).  
4. **StructureStage** Learn-safe routing fix (Phase 2b).  
5. **Learn→Trace adapter** for array subset + one proof problem (Phase 3).  
6. Opportunistic Learn migrations (Phase 4+) as separate small PRs.

---

## Definition of done (migration overall)

- Trace format remains stable and is the only public interchange API.  
- Structures seed only from explicit metadata/bootstrap.  
- `assign` never affects structures.  
- Learn catalog still works throughout; no wholesale rewrite.  
- New features are Trace-first.  
- Learn is progressively a Trace producer.  

---

## Next implementation step

**Phase 3** — Freeze `ExecutionEvent`; add Learn→Trace adapter seam for array subset (optional proof on one curated problem).
