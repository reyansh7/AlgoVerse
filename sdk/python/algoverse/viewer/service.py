"""
Lightweight Visualization Service (stdlib only).

Endpoints:
  GET  /health          → {"ok": true}
  GET  /api/trace       → latest TraceDocument JSON (or 404)
  POST /api/load-trace  → body {"trace": {...}} stores + returns {"ok": true, "url": "/"}
  GET  /                → embedded player (viewer/dist)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional

DEFAULT_PORT = 3210
_HEALTH_PATH = "/health"
_LOAD_PATH = "/api/load-trace"
_TRACE_PATH = "/api/trace"

# Process-local latest trace (server process only).
_latest_trace: Optional[dict[str, Any]] = None
_latest_lock = threading.Lock()


def viewer_dist_dir() -> Path:
    return Path(__file__).resolve().parent / "dist"


def viewer_base_url(port: int = DEFAULT_PORT) -> str:
    return f"http://127.0.0.1:{port}"


def _health_url(port: int) -> str:
    return f"{viewer_base_url(port)}{_HEALTH_PATH}"


def is_viewer_alive(port: int = DEFAULT_PORT, *, timeout: float = 0.4) -> bool:
    try:
        with urllib.request.urlopen(_health_url(port), timeout=timeout) as resp:
            if resp.status != 200:
                return False
            data = json.loads(resp.read().decode("utf-8"))
            return bool(data.get("ok"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return False


def wait_for_viewer(port: int = DEFAULT_PORT, *, timeout: float = 12.0) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if is_viewer_alive(port):
            return True
        time.sleep(0.15)
    return False


def ensure_viewer(port: int = DEFAULT_PORT) -> str:
    """Return base URL of a running viewer, starting one if needed."""
    if is_viewer_alive(port):
        return viewer_base_url(port)

    env = os.environ.copy()
    env["ALGOVERSE_VIEWER_PORT"] = str(port)
    # Detached-ish background process; stdout/stderr discarded so user script stays clean.
    creationflags = 0
    if sys.platform == "win32":
        creationflags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0) | getattr(
            subprocess, "DETACHED_PROCESS", 0
        )

    subprocess.Popen(
        [
            sys.executable,
            "-m",
            "algoverse.viewer",
            "--port",
            str(port),
            "--host",
            "127.0.0.1",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
        env=env,
        creationflags=creationflags,
        start_new_session=(sys.platform != "win32"),
    )

    if not wait_for_viewer(port):
        raise RuntimeError(
            f"Visualization Service failed to start on port {port}. "
            f"Try: python -m algoverse.viewer --port {port}"
        )
    return viewer_base_url(port)


def push_trace(trace: dict[str, Any], port: int = DEFAULT_PORT) -> str:
    """POST TraceDocument to the viewer. Returns the player URL."""
    ensure_viewer(port)
    body = json.dumps({"trace": trace}).encode("utf-8")
    req = urllib.request.Request(
        f"{viewer_base_url(port)}{_LOAD_PATH}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    path = payload.get("url") or "/"
    return f"{viewer_base_url(port)}{path}"


def try_open_viewer(
    trace: dict[str, Any],
    *,
    port: int = DEFAULT_PORT,
    open_browser: bool = True,
) -> bool:
    """Ensure viewer, push trace, optionally open the default browser.

    Returns True on success. Never raises for UX paths — prints a tip instead.
    """
    try:
        url = push_trace(trace, port=port)
        print("Launching AlgoVerse...", flush=True)
        print(f"[algoverse] Player available at:\n{url}", flush=True)
        if open_browser:
            print("Opening browser...", flush=True)
            webbrowser.open(url)
        return True
    except Exception as e:  # noqa: BLE001 — never fail the algorithm for viewer UX
        print(
            f"[algoverse] tip: could not launch Visualization Service ({e}). "
            f"Trace is still available on the decorated function as .last_trace",
            flush=True,
        )
        return False


class _ViewerHandler(SimpleHTTPRequestHandler):
    """Serve dist/ plus health / load-trace / trace API."""

    def __init__(self, *args: Any, directory: Optional[str] = None, **kwargs: Any) -> None:
        dist = viewer_dist_dir()
        super().__init__(*args, directory=str(dist), **kwargs)

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        # Quiet by default — algorithm runs should not spam access logs.
        if os.environ.get("ALGOVERSE_VIEWER_VERBOSE", "").strip():
            super().log_message(format, *args)

    def _send_json(self, code: int, payload: dict[str, Any]) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        global _latest_trace
        path = self.path.split("?", 1)[0]
        if path == _HEALTH_PATH:
            self._send_json(200, {"ok": True, "service": "algoverse-viewer"})
            return
        if path == _TRACE_PATH:
            with _latest_lock:
                doc = _latest_trace
            if doc is None:
                self._send_json(404, {"ok": False, "error": "no trace loaded"})
                return
            self._send_json(200, doc)
            return
        if path in ("/", "/index.html", "/player", "/trace"):
            # Always serve the embedded player shell.
            self.path = "/index.html"
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self) -> None:  # noqa: N802
        global _latest_trace
        path = self.path.split("?", 1)[0]
        if path != _LOAD_PATH:
            self._send_json(404, {"ok": False, "error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "invalid JSON"})
            return
        trace = body.get("trace") if isinstance(body, dict) else None
        if not isinstance(trace, dict):
            self._send_json(400, {"ok": False, "error": 'body must be {"trace": {...}}'})
            return
        if trace.get("version") != "0.1" or "events" not in trace:
            self._send_json(400, {"ok": False, "error": "not a Trace v0.1 document"})
            return
        with _latest_lock:
            _latest_trace = trace
        self._send_json(200, {"ok": True, "url": "/", "algorithm": trace.get("algorithm")})


def serve_forever(*, host: str = "127.0.0.1", port: int = DEFAULT_PORT) -> None:
    dist = viewer_dist_dir()
    if not dist.is_dir():
        raise RuntimeError(f"Viewer dist missing: {dist}")

    class _Server(ThreadingHTTPServer):
        allow_reuse_address = True
        daemon_threads = True

    httpd = _Server((host, port), _ViewerHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
