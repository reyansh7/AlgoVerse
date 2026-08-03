# Frame contract (renderers)

Renderers **never** read Trace events. They paint absolute frames produced by `reduceTrace`.

## Shape

Compatible with web `ExecutionState`:

| Field | Meaning |
|-------|---------|
| `step` | Frame index |
| `line` | 1-based source line for code highlight |
| `algorithm` | Algorithm id from the document |
| `variables` | Name → value map |
| `structures.array` | Primary array for v0.1 |
| `highlights` | `indices`, `indexKinds`, `sorted`, `nodes`, `edges` |
| `operation` | Last event type (`compare`, `swap`, …) |
| `description` | Narration string |
| `callStack` | Frame names (Trace `Frame` only) |

## Rules

1. No algorithm logic inside renderers.
2. No language checks (`if language === "python"`).
3. Prefer `highlights` over hard-coded variable names when possible.
4. Diff animation may use previous + current frames only.
5. Never infer structures from variable names — frames expose `structures` explicitly (seeded from Trace `metadata.initial` at reduce time).

## Adding a renderer

1. Accept `state: ExecutionState | null` (and optional `previous`).
2. Register routing in `StructureStage` by **structure presence** only — never `state.algorithm`, language, or SDK.
3. Document any expected variable conventions in this file.

`StructureStage` is shared by Learn, Playground, Compare, and Trace Player. Playback clocks remain dual (`playback-store` vs `playerStore`) until a later migration phase.
