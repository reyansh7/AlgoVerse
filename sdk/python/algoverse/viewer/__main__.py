"""python -m algoverse.viewer — run the Visualization Service in the foreground."""

from __future__ import annotations

import argparse
import sys

from algoverse.viewer.service import DEFAULT_PORT, serve_forever


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="AlgoVerse Visualization Service")
    parser.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help=f"Listen port (default {DEFAULT_PORT})",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Bind address (default 127.0.0.1)",
    )
    args = parser.parse_args(argv)
    print(f"[algoverse] Visualization Service on http://{args.host}:{args.port}", flush=True)
    serve_forever(host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
