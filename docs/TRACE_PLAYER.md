# Trace Player ↔ frontend

How `/trace` consumes Trace documents without renderer rewrites.

```text
TraceDocument JSON
        │
        ▼
 parseTrace (@algoverse/trace)
        │
        ▼
 TracePlayer.load → reduceTrace → Frame[]
        │
        ▼
 playerStore (React binding / scrubber)
        │
        ▼
 frameToExecutionState(Frame) → ExecutionState
        │
        ▼
 StructureStage → ArrayRenderer / …  (structure presence only)
```

## Rules

- **Source of truth:** `TraceDocument` / `Frame` from `@algoverse/trace`.  
- **Website DTO:** `ExecutionState` is an adapter output for existing panels/renderers.  
- **Routing:** `StructureStage` never reads language, algorithm id, or SDK.  
- **Learn / Playground:** still use `playback-store` + their own timelines; unchanged by this path.  
- **Do not** put algorithm logic in renderers; evolve Trace events + reduce instead.

## Key files

| Role | Path |
|------|------|
| Page | `src/app/trace/page.tsx` |
| Workspace | `src/components/trace/TraceWorkspace.tsx` |
| Document store | `src/store/traceStore.ts` |
| Player binding | `src/store/playerStore.ts` |
| Frame → UI | `src/engine/state/frame-to-execution.ts` |
| Router | `src/renderers/StructureStage.tsx` |
| Pure engine | `packages/trace/src/player.ts` (`load`, `seek`, `next`, `previous`, `length`, `currentFrame`) |
| Playback chrome | `src/panels/Timeline/TracePlaybackControls.tsx` (Trace-bound; Learn keeps `PlaybackControls`) |
| Variables | `src/panels/Variables/VariablesPanel.tsx` |
| Code | `src/panels/Variables/CodePanel.tsx` |

CLI opens this page via `?src=/traces/<file>` after validation (`cli/src/serve.ts`).
