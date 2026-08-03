# Trace format v0.1

Portable, language-independent execution document.

## Document

```json
{
  "version": "0.1",
  "language": "python",
  "algorithm": "bubble_sort",
  "source": { "path": "examples/bubble.py", "code": "..." },
  "metadata": { "initial": { "array": [5, 1, 4, 2] } },
  "events": []
}
```

- `language` is metadata only — renderers **must ignore** it.
- **Structure bootstrap (v0.1):** the array must be seeded via `metadata.initial.array` only.
- `assign` is a pure variable assignment. It never seeds or mutates `structures`.
- Variable names are user-defined and must not affect rendering or structure initialization.

### Changelog (v0.1 clarifications)

- **Bootstrap:** Removed name-based seeding via `assign("array"|"nums", …)`. Emitters that relied on assign-only bootstrap must set `metadata.initial.array`. Envelope version remains `0.1` (event vocabulary unchanged).

## Events

| type | data |
|------|------|
| `assign` | `{ name, value }` — variables only |
| `compare` | `{ i, j, values? }` |
| `swap` | `{ i, j }` — mutates `structures.array` |
| `call` | `{ frame, args? }` |
| `return` | `{ frame, value? }` |
| `line` | `{ line }` |
| `highlight` | `{ indices?, kinds?, sorted?, clear? }` |

Every event has `timestamp: number` and optional `line`, `description`.

See also: [TRACE_PLAYER.md](./TRACE_PLAYER.md) (web binding), [MIGRATION.md](./MIGRATION.md), [FRAMES.md](./FRAMES.md).

## TypeScript

```ts
import { parseTrace, reduceTrace, TracePlayer } from "@algoverse/trace";

const doc = parseTrace(json);
const frames = reduceTrace(doc);
const player = new TracePlayer();
player.load(doc);
player.seek(0);
```

## Python

```python
from algoverse import Trace

tr = Trace(
    algorithm="bubble_sort",
    metadata={"initial": {"array": [5, 1, 4, 2]}},
)
tr.assign("array", [5, 1, 4, 2])  # variable panel only; does not seed structure
tr.compare(0, 1, values=[5, 1])
tr.swap(0, 1)
tr.assign("array", [1, 5, 4, 2])  # refresh variable after swap
tr.return_("bubble_sort", value=[1, 2, 4, 5])
tr.write("out.trace.json")
```
