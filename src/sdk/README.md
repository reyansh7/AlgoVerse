# Language SDKs

Python (and future language) SDKs live at the **repository root**, not inside Next.js `src/`:

```text
../../sdk/python/     # pip-installable `algoverse` package
```

Install:

```bash
pip install -e ../../sdk/python
```

This folder exists so the architecture layout is discoverable from `src/`.
