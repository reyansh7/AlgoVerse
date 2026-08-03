# @algoverse/trace

Language-independent execution trace schema, reducer, and player.

**Zero React.** Emitters produce Trace JSON; clients reduce to frames and paint.

## Install

Workspace package — available as `@algoverse/trace` from the monorepo root.

## Public API

```ts
import {
  // Constants
  TRACE_VERSION,       // "0.1"
  TRACE_EVENT_TYPES,   // seven event type strings

  // Parse / validate / serialize
  parseTrace,          // JSON string → TraceDocument (throws TraceValidationError)
  validateTrace,       // unknown → TraceDocument
  serializeTrace,      // TraceDocument → JSON string
  TraceValidationError,// Error with optional `.path` field

  // Reduce / play
  reduceTrace,         // TraceDocument → Frame[]
  applyTraceEvent,     // mutate one frame (advanced hosts)
  TracePlayer,         // load / seek / next / previous / length / currentFrame

  // Emit (TypeScript)
  TraceRecorder,
} from "@algoverse/trace";
```

### TracePlayer

| Member | Role |
|--------|------|
| `load(doc)` | Reduce document; reset index to 0 |
| `seek(i)` | Jump to frame (clamped) |
| `next()` / `previous()` | Step ±1 |
| `length` | Frame count |
| `currentFrame` / `current` | Frame at index |
| `previousFrame` | Prior frame (diff animation) |
| `restart()` / `clear()` | Reset / unload |

### Bootstrap (v0.1)

Seed the array with `metadata.initial.array` only.
`assign` never seeds or mutates structures. See [docs/TRACE.md](../../docs/TRACE.md).

Events: `assign`, `compare`, `swap`, `call`, `return`, `line`, `highlight`.

JSON Schema: [`schema/trace-v0.1.json`](./schema/trace-v0.1.json).

## Test

```bash
npm run test -w @algoverse/trace
# or from root:
npm run test:trace
```
