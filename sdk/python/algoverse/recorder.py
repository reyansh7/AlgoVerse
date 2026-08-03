"""
Trace recorder — mirrors @algoverse/trace TraceRecorder.

Manual instrumentation only (v0.1). Emit the seven event types, then write JSON.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Mapping, MutableMapping, Optional, Sequence, Union


class Trace:
    """Accumulate AlgoVerse Trace v0.1 events and export `.trace.json`.

    Structures are seeded only via ``metadata["initial"]["array"]``.
    ``assign`` is a pure variable bind and never seeds structures.
    """

    def __init__(
        self,
        algorithm: str,
        *,
        language: str = "python",
        source_path: Optional[str] = None,
        source_code: Optional[str] = None,
        metadata: Optional[MutableMapping[str, Any]] = None,
    ) -> None:
        self.algorithm = algorithm
        self.language = language
        self.source_path = source_path
        self.source_code = source_code
        self.metadata: MutableMapping[str, Any] = dict(metadata or {})
        self._events: list[dict[str, Any]] = []
        self._t = 0

    def _next_ts(self) -> int:
        self._t += 1
        return self._t

    def _push(
        self,
        type_: str,
        data: Mapping[str, Any],
        *,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        event: dict[str, Any] = {
            "type": type_,
            "timestamp": self._next_ts(),
            "data": dict(data),
        }
        if line is not None:
            event["line"] = line
        if description is not None:
            event["description"] = description
        self._events.append(event)
        return self

    def assign(
        self,
        name: str,
        value: Any,
        *,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        return self._push(
            "assign",
            {"name": name, "value": value},
            line=line,
            description=description,
        )

    def compare(
        self,
        i: int,
        j: int,
        *,
        values: Optional[Sequence[Any]] = None,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        data: dict[str, Any] = {"i": i, "j": j}
        if values is not None:
            data["values"] = list(values)
        return self._push("compare", data, line=line, description=description)

    def swap(
        self,
        i: int,
        j: int,
        *,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        return self._push(
            "swap",
            {"i": i, "j": j},
            line=line,
            description=description,
        )

    def call(
        self,
        frame: str,
        *,
        args: Optional[Mapping[str, Any]] = None,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        data: dict[str, Any] = {"frame": frame}
        if args is not None:
            data["args"] = dict(args)
        return self._push("call", data, line=line, description=description)

    def return_(
        self,
        frame: str,
        *,
        value: Any = None,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        """Emit a return event. Named return_ because `return` is a keyword."""
        data: dict[str, Any] = {"frame": frame}
        if value is not None:
            data["value"] = value
        return self._push("return", data, line=line, description=description)

    def line(
        self,
        line_no: int,
        *,
        description: Optional[str] = None,
    ) -> "Trace":
        return self._push(
            "line",
            {"line": line_no},
            line=line_no,
            description=description,
        )

    def highlight(
        self,
        *,
        indices: Optional[Sequence[int]] = None,
        kinds: Optional[Mapping[Union[int, str], str]] = None,
        sorted: Optional[Sequence[int]] = None,
        clear: bool = False,
        line: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Trace":
        data: dict[str, Any] = {}
        if indices is not None:
            data["indices"] = list(indices)
        if kinds is not None:
            data["kinds"] = {str(k): v for k, v in kinds.items()}
        if sorted is not None:
            data["sorted"] = list(sorted)
        if clear:
            data["clear"] = True
        return self._push("highlight", data, line=line, description=description)

    def to_dict(self) -> dict[str, Any]:
        """Build a TraceDocument-compatible dict (v0.1).

        Requires ``metadata["initial"]["array"]`` — structures are never
        inferred from variable names.
        """
        initial = self.metadata.get("initial") if self.metadata else None
        if not isinstance(initial, Mapping) or not isinstance(
            initial.get("array"), list
        ):
            raise ValueError(
                'Trace v0.1 requires metadata={"initial": {"array": [...]}} '
                "(assign does not seed structures)"
            )

        doc: dict[str, Any] = {
            "version": "0.1",
            "language": self.language,
            "algorithm": self.algorithm,
            "metadata": dict(self.metadata),
            "events": list(self._events),
        }
        if self.source_path or self.source_code:
            source: dict[str, str] = {}
            if self.source_path:
                source["path"] = self.source_path
            if self.source_code:
                source["code"] = self.source_code
            doc["source"] = source
        return doc

    def write(self, path: Optional[Union[str, Path]] = None) -> Path:
        """
        Write the trace document to disk as pretty JSON.

        Default path: ``$ALGOVERSE_TRACE_OUT`` or ``{algorithm}.trace.json`` in cwd.
        Prints ``[algoverse] wrote <abs-path>`` for CLI discovery.
        """
        out_env = os.environ.get("ALGOVERSE_TRACE_OUT")
        if path is None and out_env:
            path = out_env
        if path is None:
            path = f"{self.algorithm}.trace.json"
        out = Path(path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")
        print(f"[algoverse] wrote {out.resolve()}", flush=True)
        return out.resolve()
