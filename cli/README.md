# AlgoVerse CLI

Run an instrumented Python script, validate the Trace document, and open the
Trace Player.

```text
Python SDK  →  .trace.json  →  parseTrace  →  browser /trace
```

Does **not** modify the frontend. It only writes a file under `public/traces/`
and opens a URL.

---

## Requirements

- Node.js (repo `npm install` completed)
- Python 3 on `PATH` (`python` on Windows, `python3` elsewhere)
- Editable SDK: `pip install -e sdk/python`
- For browser playback: `npm run dev` (Next.js on port 3000 by default)

---

## Usage

From the **repository root**:

```bash
npm run algoverse -- run examples/bubble.py
npm run algoverse -- run examples/bubble.py --no-open
npm run algoverse -- run examples/bubble.py --out tmp/out.trace.json
npm run algoverse -- run examples/bubble.py --port 3000
node cli/bin/algoverse.js --help
node cli/bin/algoverse.js --version
```

`algoverse` is not installed globally by default. Prefer the npm script above,
or:

```bash
npx algoverse run examples/bubble.py
# optional: npm link -w @algoverse/cli
```

---

## Pipeline

1. Resolve the script path (uses `INIT_CWD` when run via npm workspaces).  
2. Set `PYTHONPATH` to `sdk/python` and `ALGOVERSE_TRACE_OUT` to the output path.  
3. Spawn Python on the script.  
4. Discover the written `.trace.json`.  
5. Validate with `@algoverse/trace` `parseTrace` (requires `metadata.initial.array`).  
6. Unless `--no-open`, copy JSON to `public/traces/` and open the player URL.  
7. If the player port does not respond, print a tip to run `npm run dev`.

---

## Flags

| Flag | Meaning |
|------|---------|
| `--out <path>` | Trace output path (required argument) |
| `--port <n>` | Player port (default `3000`) |
| `--no-open` | Validate only; do not open a browser |
| `-h`, `--help` | Help (exit 0) |
| `-V`, `--version` | Version (exit 0) |

---

## Environment

| Variable | Purpose |
|----------|---------|
| `ALGOVERSE_TRACE_OUT` | Default output `.trace.json` path |
| `ALGOVERSE_PLAYER_URL` | Override player base URL (default `http://localhost:3000/trace`) |
| `INIT_CWD` | Set by npm; used so relative script paths resolve from the caller’s cwd |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `algoverse` not recognized | Use `npm run algoverse -- run …` from repo root |
| `No module named 'algoverse'` | `pip install -e sdk/python` |
| Validation error on `metadata.initial.array` | Pass `metadata={"initial": {"array": […]}}` to `Trace(...)` |
| Browser blank / tip about `npm run dev` | Start the Next app; confirm file under `public/traces/` |
| Stale trace in browser | CLI cache-busts with `&t=`; hard-refresh if needed |
