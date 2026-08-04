"""Shared base for AlgoVerse structure plugins (Array, Tree, Graph, …)."""

from __future__ import annotations

from typing import Any, Optional

from algoverse.recorder import Trace, TraceError


class TraceStructure:
    """Base for structure wrappers that emit into an existing :class:`Trace`.

    Contract for every plugin
    -------------------------
    - Set ``_algoverse_structure = True`` so InstrumentationSession skips local diffs.
    - Emit only through :class:`Trace` (no new TraceDocument fields).
    - Bootstrap via ``metadata.initial.*`` as appropriate for the structure.
    - Provide ``flush()`` when multi-step detection is pending.
    """

    _algoverse_structure = True
    __slots__ = ("_trace", "_name", "_line", "_sync_assign")

    def __init__(
        self,
        trace: Trace,
        *,
        name: str,
        sync_assign: bool = True,
        line: Optional[int] = None,
    ) -> None:
        if not isinstance(trace, Trace):
            raise TraceError("TraceStructure requires an existing Trace instance")
        if not name or not isinstance(name, str):
            raise TraceError('structure name must be a non-empty str, e.g. name="array"')
        self._trace = trace
        self._name = name
        self._sync_assign = bool(sync_assign)
        self._line = line

    @property
    def trace(self) -> Trace:
        return self._trace

    @property
    def name(self) -> str:
        return self._name

    @property
    def line(self) -> Optional[int]:
        """Optional source line attached to emitted events."""
        return self._line

    @line.setter
    def line(self, value: Optional[int]) -> None:
        self._line = value

    @property
    def sync_assign(self) -> bool:
        """If True, emit assign(name, snapshot) after structural mutations."""
        return self._sync_assign

    def flush(self) -> None:
        """Commit any pending multi-step detection. Override in subclasses."""

    def _emit_assign(self, value: Any) -> None:
        if not self._sync_assign:
            return
        self._trace.assign(self._name, value, line=self._line)

    def _emit_highlight(
        self,
        *,
        indices: Optional[list[int]] = None,
        kinds: Optional[dict[int, str]] = None,
        clear: bool = False,
    ) -> None:
        self._trace.highlight(
            indices=indices,
            kinds=kinds,
            clear=clear,
            line=self._line,
        )
