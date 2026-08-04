# AlgoVerse roadmap

## v0.1 — shipped

- `@algoverse/trace` schema + reduce + player
- Python SDK + `examples/bubble.py`
- CLI `algoverse run`
- Web Trace Player (`/trace`) + StructureStage / ArrayRenderer playback
- Sprint 2 polish: SDK fail-fast, CLI UX, Player loading/upload, docs, hygiene  
  (see [`docs/SPRINT2.md`](./SPRINT2.md))

## v0.2 — shipped (Sprint 3 auto-instrumentation)

- `InstrumentationSession`, `TraceArray`, `@visualize`
- Hybrid auto path; Trace v0.1 unchanged  
  (see [`docs/SPRINT3.md`](./SPRINT3.md))

## v0.3 — Array Plugin Core (current)

- Perfect **observable arrays** for the six-sort teaching suite (not full `list` API)
- Layout: `sdk/python/algoverse/instrument/structures/`
- Roadmap: [`docs/ARRAY_PLUGIN.md`](./ARRAY_PLUGIN.md)
- **Next:** Tree Plugin (`TraceTree`) — do not expand Array Recommended/Advanced first

## v0.4 — deferred

- Recursion tree panel / stack frames (Player chrome)
- Export GIF / MP4
- Array Recommended backlog (only if needed after Tree)

## v0.5 — deferred

- Trace v0.2 structure-write events (if approved)
- Custom events + custom renderers

## v1.0 — deferred

- JavaScript adapter
- React package
- VSCode extension
- Public SDK docs site

## v2.0 — deferred

- Java / C++ / Rust / Go emitters
- GitHub Action
- AI explanation engine

Do not expand Array edge-case coverage before shipping the Tree Plugin.


