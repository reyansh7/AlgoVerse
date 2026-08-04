"""
Best-effort Trace Player open — no CLI/frontend changes.

Copies the written .trace.json under ``public/traces/`` when the AlgoVerse
repo layout is detected, then opens the existing ``/trace?src=…`` URL.
On any failure, prints a tip and returns False (never raises for UX paths).
"""

from __future__ import annotations

import os
import shutil
import webbrowser
from pathlib import Path
from typing import Optional


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
    """Open the Trace Player for ``trace_path`` if possible.

    Honors ``ALGOVERSE_PLAYER_URL`` as the base (default ``http://localhost:<port>/trace``).
    """
    path = Path(trace_path).resolve()
    if not path.is_file():
        print(
            f"[algoverse] tip: cannot open player — file missing: {path}",
            flush=True,
        )
        return False

    base = os.environ.get("ALGOVERSE_PLAYER_URL") or f"http://localhost:{port}/trace"
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
            print(f"[algoverse] served file {dest}", flush=True)
            webbrowser.open(url)
            return True
        except OSError as e:
            print(f"[algoverse] tip: could not stage trace for player: {e}", flush=True)

    print(
        f"[algoverse] tip: wrote {path}. "
        f"Start the app (`npm run dev`) and open {base}, or run: "
        f"npm run algoverse -- run <script.py>",
        flush=True,
    )
    return False
