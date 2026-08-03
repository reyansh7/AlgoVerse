# Sprint 2 roadmap — Production polish

**Status:** Active  
**Architecture / Trace spec:** Frozen (do not redesign; no breaking changes)  
**Goal:** Make the existing v0.1 system feel polished, intuitive, stable, and production-ready.

Sprint 2 does **not** add algorithms, data structures, languages, decorators, or Learn→Trace migration (those are later sprints).

Source of truth: [`docs/MIGRATION.md`](./MIGRATION.md), [`docs/TRACE.md`](./TRACE.md), [`REPORT.md`](../REPORT.md).

---

## Principles

- Small, modular improvements  
- No React in `@algoverse/trace`  
- No algorithm logic in renderers  
- Backward-compatible TraceDocument  
- Prefer maintainability over cleverness  

---

## Task order (implementation sequence)

### Task 1 — Trace-first root README

| Field | Detail |
|-------|--------|
| **Goal** | Make the root README lead with the SDK → Trace → Player path, not a DSA website pitch. |
| **Why** | First impression defines the project. Current README under-sells the engine and confuses newcomers. |
| **Files** | `README.md` |
| **Outcome** | Clear install, run, and architecture links; Learn listed as one client. |
| **Acceptance** | Golden path (`pip install -e`, `npm run algoverse -- run examples/bubble.py`) is copy-pasteable; Trace contracts linked; no architecture redesign. |
| **Difficulty** | Easy |

### Task 2 — Python SDK: fail-fast bootstrap + clearer errors

| Field | Detail |
|-------|--------|
| **Goal** | Require / validate `metadata.initial.array` at construction (or first event), with actionable errors on `write`. |
| **Why** | Late `ValueError` after full instrumentation wastes user time. |
| **Files** | `sdk/python/algoverse/recorder.py`, `sdk/python/README.md`, `sdk/python/tests/test_trace.py`, `examples/bubble.py` (if needed) |
| **Outcome** | Invalid Trace setup fails immediately with a fix hint. |
| **Acceptance** | Missing bootstrap fails before events; tests cover constructor + write errors; no breaking change for valid callers. |
| **Difficulty** | Easy–Medium |

### Task 3 — CLI production UX

| Field | Detail |
|-------|--------|
| **Goal** | `--help` exit 0; better validation errors; reliable “start Next” tip; safer flag parsing; `--version`. |
| **Why** | CLI is the primary SDK demo path; raw errors feel prototype-grade. |
| **Files** | `cli/src/run.ts`, `cli/src/serve.ts`, `cli/README.md` |
| **Outcome** | Helpful failures; discoverable usage via npm. |
| **Acceptance** | Help exits 0; validation errors mention `metadata.initial.array` when relevant; missing `--out` value errors clearly; tip when player likely down. |
| **Difficulty** | Medium |

### Task 4 — Trace validation message polish

| Field | Detail |
|-------|--------|
| **Goal** | Every `TraceValidationError` suggests how to fix (esp. bootstrap, version, event shape). |
| **Why** | CLI and Player surface these strings verbatim. |
| **Files** | `packages/trace/src/serializer.ts`, `packages/trace/src/trace.test.ts`, `packages/trace/README.md` |
| **Outcome** | Errors are contributor-friendly without changing the wire format. |
| **Acceptance** | Existing valid fixtures still parse; new tests assert message content for bootstrap failure; no schema field changes. |
| **Difficulty** | Easy |

### Task 5 — Trace Player: loading & empty states

| Field | Detail |
|-------|--------|
| **Goal** | Show loading while fetching `?src=` / sample; empty copy invites upload of `.trace.json`. |
| **Why** | Blank stage looks broken on first load. |
| **Files** | `src/components/trace/TraceWorkspace.tsx`, optionally `StructureStage` empty string only if Trace-safe |
| **Outcome** | Loading spinner/text; empty state explains Upload / Load sample. |
| **Acceptance** | No Learn changes; playback still works; sample + `?src=` still load. |
| **Difficulty** | Easy–Medium |

### Task 6 — Trace Player: upload UX + error a11y

| Field | Detail |
|-------|--------|
| **Goal** | Drag-and-drop upload; reset file input; `role="alert"` on errors; paste placeholder includes metadata. |
| **Why** | Upload is the shareable-trace entry point; must feel intentional. |
| **Files** | `src/components/trace/TraceWorkspace.tsx` |
| **Outcome** | Drop zone + accessible error banner. |
| **Acceptance** | Drag-drop loads valid JSON; invalid JSON shows alert; same file re-selectable. |
| **Difficulty** | Medium |

### Task 7 — Disable Trace playback when empty

| Field | Detail |
|-------|--------|
| **Goal** | Disable play/step/seek when `frames.length === 0`. |
| **Why** | Active controls on empty player feel broken. |
| **Files** | `src/panels/Timeline/TracePlaybackControls.tsx` |
| **Outcome** | Controls inert until a trace is loaded. |
| **Acceptance** | With sample loaded, controls work; empty → disabled. |
| **Difficulty** | Easy |

### Task 8 — Wire Python tests into developer scripts

| Field | Detail |
|-------|--------|
| **Goal** | `npm run test:python` (or equivalent) + document in CONTRIBUTING. |
| **Why** | Invisible tests don’t get run. |
| **Files** | `package.json`, `CONTRIBUTING.md`, `sdk/python/README.md` |
| **Outcome** | One command runs Python unit tests. |
| **Acceptance** | Script exits 0 on current suite; CONTRIBUTING lists it. |
| **Difficulty** | Easy |

### Task 9 — Expand Python SDK test coverage

| Field | Detail |
|-------|--------|
| **Goal** | Cover `ALGOVERSE_TRACE_OUT`, default write path, `return_` without value, bad metadata shapes. |
| **Why** | Production SDK needs regression armor on the public surface. |
| **Files** | `sdk/python/tests/test_trace.py` |
| **Outcome** | Broader suite without changing API. |
| **Acceptance** | New cases pass; no product behavior change except via Task 2. |
| **Difficulty** | Easy |

### Task 10 — `@algoverse/trace` public API documentation

| Field | Detail |
|-------|--------|
| **Goal** | Document full export surface: `validateTrace`, `serializeTrace`, `TraceValidationError`, `TRACE_VERSION`, player methods. |
| **Why** | Package README is the SDK contract for TS consumers. |
| **Files** | `packages/trace/README.md` |
| **Outcome** | Complete, accurate API reference for v0.1. |
| **Acceptance** | Every `index.ts` export mentioned; bootstrap rules restated. |
| **Difficulty** | Easy |

### Task 11 — Trace Player docs sync

| Field | Detail |
|-------|--------|
| **Goal** | Document upload, paste, `?src=`, keyboard shortcuts, TracePlaybackControls vs Learn controls. |
| **Why** | Contributors and users need one place for Player behavior. |
| **Files** | `docs/TRACE_PLAYER.md`, `CONTRIBUTING.md` |
| **Outcome** | TRACE_PLAYER matches the shipped UI. |
| **Acceptance** | All entry paths documented; links from README. |
| **Difficulty** | Easy |

### Task 12 — Safe dead-code hygiene (REPORT P0)

| Field | Detail |
|-------|--------|
| **Goal** | Remove confirmed-unused aliases/shims/deps without touching Learn pipelines. |
| **Why** | Dead code confuses contributors and implies unfinished migrations. |
| **Files** | Per [`REPORT.md`](../REPORT.md) Delete list: unused renderer aliases, deprecated re-exports, unused npm deps (verify first) |
| **Outcome** | Smaller, clearer tree. |
| **Acceptance** | `npm run build` and `npm run test:trace` pass; Learn routes still load. |
| **Difficulty** | Medium (careful verification) |

### Task 13 — Source panel empty state when no `source.code`

| Field | Detail |
|-------|--------|
| **Goal** | Show a short explanation when Trace has no embedded source. |
| **Why** | Panel vanishing confuses users who expect code highlight. |
| **Files** | `src/components/trace/TraceWorkspace.tsx` |
| **Outcome** | Placeholder: “No source in this trace — pass `source_code=` in the SDK.” |
| **Acceptance** | Traces with source unchanged; without source show placeholder. |
| **Difficulty** | Easy |

### Task 14 — Sprint 2 closure checklist

| Field | Detail |
|-------|--------|
| **Goal** | Update ROADMAP / REPORT notes; confirm golden path demo in CONTRIBUTING. |
| **Why** | Leaves the repo honest about polish status. |
| **Files** | `docs/ROADMAP.md`, `REPORT.md`, `docs/MIGRATION.md` (Sprint 2 note only) |
| **Outcome** | Docs reflect polished v0.1. |
| **Acceptance** | No architecture edits; checklist items marked. |
| **Difficulty** | Easy |

---

## Explicitly out of scope (Sprint 2)

- Learn → Trace adapter / ExecutionEvent freeze work (Migration Phase 3+)  
- New Trace event types or structure kinds  
- `@visualize` / AST instrumentation  
- New languages  
- GIF/MP4 export, shareable binary formats  
- Plugin API  
- Unifying `playback-store` and `playerStore`  

---

## Progress

| Task | Status |
|------|--------|
| 1. Trace-first root README | Done |
| 2. Python SDK fail-fast bootstrap | Done |
| 3. CLI production UX | Done |
| 4. Trace validation message polish | Done |
| 5. Trace Player loading & empty states | Done |
| 6. Trace Player upload UX + error a11y | Done |
| 7. Disable Trace playback when empty | Done |
| 8. Wire Python tests into scripts | Done |
| 9. Expand Python SDK test coverage | Done |
| 10. `@algoverse/trace` public API docs | Done |
| 11. Trace Player docs sync | Done |
| 12. Safe dead-code hygiene | Done |
| 13. Source panel empty state | Done |
| 14. Sprint 2 closure checklist | Done |

---

## Next

Sprint 2 complete. Resume Trace-first migration Phase 3 (Learn→Trace adapter) when ready — see [`MIGRATION.md`](./MIGRATION.md).
