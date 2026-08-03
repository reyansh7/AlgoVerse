# AlgoVerse

**Open-source execution tracing and visualization engine.**

**Status:** v0.1 · Sprint 2 polish

AlgoVerse is not another DSA website. Users write normal code, emit a language-independent **TraceDocument**, and get interactive playback — animation, variables, timeline, and code highlighting — from execution, not from hand-built algorithm templates.

```text
User Code
    ↓
Language SDK
    ↓
TraceDocument
    ↓
Trace Player
    ↓
Frames
    ↓
Renderers
    ↓
Interactive Visualization
```

The website is **one client**. The Trace format is the public API.

---

## Quick start (Python → Trace → Player)

```bash
npm install
pip install -e sdk/python

npm run dev                                          # terminal 1 — Trace Player
npm run algoverse -- run examples/bubble.py          # terminal 2
```

This runs an instrumented bubble sort, writes `.trace.json`, validates it with `@algoverse/trace`, and opens [/trace](http://localhost:3000/trace).

Or open [/trace](http://localhost:3000/trace) and use **Load sample** / **Upload**.

---

## Quick start (website only)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Learn, Explore, or **Trace Player** at [/trace](http://localhost:3000/trace).

---

## Packages (v0.1)

| Path | Responsibility |
|------|----------------|
| [`packages/trace`](packages/trace) | Schema, validate, reduce, player — **zero React** |
| [`sdk/python`](sdk/python) | Python Trace recorder (manual instrumentation) |
| [`cli`](cli) | `algoverse run <script.py>` |
| [`examples`](examples) | Instrumented demos |
| [`src/app/trace`](src/app/trace) | Web Trace Player |
| [`src/renderers`](src/renderers) | Structure views from frames only |
| [`src/problems`](src/problems) | Learn catalog (website content; separate from Trace infra) |

Layout details: [`docs/STRUCTURE.md`](docs/STRUCTURE.md).

---

## Trace v0.1

Exactly seven event types: `assign`, `compare`, `swap`, `call`, `return`, `line`, `highlight`.

- Structures seed only via `metadata.initial.array` — never from variable names.
- `assign` is variables only.
- Renderers consume **frames**, never algorithms or languages.

Contracts: [`docs/TRACE.md`](docs/TRACE.md) · [`docs/FRAMES.md`](docs/FRAMES.md) · schema [`packages/trace/schema/trace-v0.1.json`](packages/trace/schema/trace-v0.1.json)

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run test:trace` | `@algoverse/trace` unit tests |
| `npm run test:python` | Python SDK unit tests |
| `npm run algoverse -- run <file.py>` | Execute script → validate Trace → open Player |

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/TRACE.md`](docs/TRACE.md) | Trace format |
| [`docs/TRACE_PLAYER.md`](docs/TRACE_PLAYER.md) | Web binding |
| [`docs/MIGRATION.md`](docs/MIGRATION.md) | Trace-first migration |
| [`docs/SPRINT2.md`](docs/SPRINT2.md) | Sprint 2 polish roadmap |
| [`REPORT.md`](REPORT.md) | Debt audit |
| [`sdk/python/README.md`](sdk/python/README.md) | Python SDK |
| [`cli/README.md`](cli/README.md) | CLI |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contributor guide |

---

## Roadmap (high level)

- **v0.1** (current): Python SDK, Trace schema, Array path, playback, CLI  
- **v0.2**: Recursion / trees / graphs in Trace  
- **v0.3**: Shareable traces, export  
- **v0.4**: Plugin API  
- **v1.0**: JS adapter, React package, VS Code  

Full roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Architecture and Trace contracts are frozen — prefer polish and adapters over redesigns.
