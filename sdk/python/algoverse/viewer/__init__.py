"""
AlgoVerse Visualization Service — embedded local Trace Player.

Lifecycle owned by the Python SDK:

  ensure_viewer() → POST /api/load-trace → open browser

No npm / Next.js required for end users. Static assets live under ``viewer/dist``.
"""

from .service import (
    DEFAULT_PORT,
    ensure_viewer,
    push_trace,
    try_open_viewer,
    viewer_base_url,
)

__all__ = [
    "DEFAULT_PORT",
    "ensure_viewer",
    "push_trace",
    "try_open_viewer",
    "viewer_base_url",
]
