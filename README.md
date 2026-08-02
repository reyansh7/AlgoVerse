# AlgoVerse

Premium interactive algorithm visualization platform.

Deterministic pipeline:

**User input → Execution engine → State snapshots → Timeline → Animation diff → Structure renderers → UI**

## Stack

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS v4 · GSAP · Framer Motion
- React Three Fiber · Drei · Zustand

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

| Path | Responsibility |
|------|----------------|
| `src/core/execution` | Algorithm adapters emit snapshots only |
| `src/core/timeline` | Step indexing / scrubbing |
| `src/core/animation` | State diffs (no algorithm logic) |
| `src/renderers` | Structure-based visualization |
| `src/problems` | Catalog metadata + default cases |
| `src/store` | Playback, test cases, history, favorites |

Adding an algorithm: implement an adapter in `src/core/execution/adapters/`, register it, and add a problem entry in `src/problems/catalog.ts`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build
