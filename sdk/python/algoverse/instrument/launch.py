"""
Legacy Trace Player helpers.

Preferred path: :mod:`algoverse.viewer` (embedded Visualization Service).
This module remains for callers that still stage a file into a Next.js
``public/traces/`` tree when developing the full web app.
"""

from __future__ import annotations

import os
import shutil
import webbrowser
from pathlib import Path
from typing import Any, Optional

from algoverse.viewer import try_open_viewer


def _find_repo_root(start: Path) -> Optional[Path]:
    cur = start.resolve()
    for _ in range(8):
        if (cur / "package.json").is_file() and (cur / "public").is_dir():
            return cur
        if cur.parent == cur:
            break
        cur = cur.parent
    return None


def try_open_trace_player(trace_path: Path, *, port: int = 3000) -> bool:
    """Open a written ``.trace.json`` in the embedded viewer (preferred).

    Falls back to copying into ``public/traces/`` + Next.js URL when
    ``ALGOVERSE_PLAYER_URL`` points at an external app.
    """
    path = Path(trace_path).resolve()
    if not path.is_file():
        print(
            f"[algoverse] tip: cannot open player — file missing: {path}",
            flush=True,
        )
        return False

    # Prefer embedded Visualization Service unless an external player URL is set.
    external = os.environ.get("ALGOVERSE_PLAYER_URL")
    if not external:
        try:
            import json

            doc = json.loads(path.read_text(encoding="utf-8"))
            viewer_port = int(os.environ.get("ALGOVERSE_VIEWER_PORT") or 3210)
            return try_open_viewer(doc, port=viewer_port, open_browser=True)
        except Exception as e:  # noqa: BLE001
            print(f"[algoverse] tip: embedded viewer failed ({e})", flush=True)

    base = external or f"http://localhost:{port}/trace"
    repo = _find_repo_root(Path.cwd()) or _find_repo_root(path.parent)
    dest_name = path.name if path.name.endswith(".json") else f"{path.name}.json"

    if repo is not None:
        public_traces = repo / "public" / "traces"
        try:
            public_traces.mkdir(parents=True, exist_ok=True)
            dest = public_traces / dest_name
            shutil.copy2(path, dest)
            url = f"{base}?src=/traces/{dest_name}"
            print(f"[algoverse] opening {url}", flush=True)
            webbrowser.open(url)
            return True
        except OSError as e:
            print(f"[algoverse] tip: could not stage trace for player: {e}", flush=True)

    print(
        f"[algoverse] tip: wrote {path}. "
        f"Re-run with the embedded viewer, or open {base}.",
        flush=True,
    )
    return False


def try_open_trace_document(trace: dict[str, Any], *, port: int = 3210) -> bool:
    """Push an in-memory TraceDocument to the Visualization Service."""
    return try_open_viewer(trace, port=port, open_browser=True)
