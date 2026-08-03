# Contributing to AlgoVerse

## Principles

1. Renderers consume **frames**, never algorithms or languages.
2. `@algoverse/trace` has **zero React**.
3. v0.1 public events stay exactly seven types.
4. Prefer adapters over deleting Learn / Playground code.
5. Do not add new Playground snapshot-only adapters — emit Trace instead.

## Setup

```bash
npm install
pip install -e sdk/python
npm run test:trace
npm run test:python
npm run dev
# other terminal — smoke the CLI golden path:
npm run algoverse -- run examples/bubble.py --no-open
```

## Packages

| Package | Change when… |
|---------|----------------|
| `packages/trace` | Schema, reduce, player, validation |
| `sdk/python` | Python emitter API |
| `cli` | `algoverse run` UX |
| `src/renderers` | Visualization of frames |
| `src/app/trace` | Web Trace Player UI |
| `src/problems` | Learn website catalog |

## Checklist for Trace changes

- [ ] Update `packages/trace/schema/trace-v0.1.json` if the envelope changes (bump carefully)
- [ ] Add/adjust unit tests in `packages/trace/src/trace.test.ts`
- [ ] Keep Python SDK event methods in sync
- [ ] Update `docs/TRACE.md`

## Checklist for renderer changes

- [ ] No algorithm-specific branches
- [ ] Works with frames from `reduceTrace` / golden fixture
- [ ] Update `docs/FRAMES.md` if the contract changes
