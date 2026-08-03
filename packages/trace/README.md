# @algoverse/trace

Language-independent execution trace schema, reducer, and player.

**Zero React.** Emitters produce Trace JSON; clients reduce to frames and paint.

## Install

Workspace package — available as `@algoverse/trace` from the monorepo root.

## API

```ts
import {
  parseTrace,
  reduceTrace,
  TracePlayer,
  TraceRecorder,
} from "@algoverse/trace";

const doc = parseTrace(json);
const player = new TracePlayer();
player.load(doc);
player.seek(0);
player.next();
player.previous();
const frame = player.currentFrame;
const n = player.length;
```

**Bootstrap (v0.1):** seed the array with `metadata.initial.array` only.
`assign` never seeds or mutates structures. See [docs/TRACE.md](../../docs/TRACE.md).

See `schema/trace-v0.1.json` and `src/events.ts` for the seven event types:
`assign`, `compare`, `swap`, `call`, `return`, `line`, `highlight`.

## Test

```bash
npm run test -w @algoverse/trace
```

Covers schema validation, reduce, TraceRecorder, and TracePlayer (`load` / `seek` / `next` / `previous` / `currentFrame`).
