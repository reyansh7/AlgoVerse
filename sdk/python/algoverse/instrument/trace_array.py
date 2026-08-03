"""
TraceArray — list proxy that emits structure-aware Trace events.

Reference implementation for future TraceTree / TraceGraph / etc.
Composes with InstrumentationSession; emits only through existing Trace APIs.
"""

from __future__ import annotations

from collections.abc import Iterable, MutableSequence, Sequence
from typing import Any, Iterator, Optional, Union, overload

from algoverse.recorder import Trace, TraceError


class TraceStructure:
    """Base for structure wrappers that emit into an existing :class:`Trace`.

    Future TraceTree / TraceGraph / TraceQueue should subclass this so
    InstrumentationSession can skip them uniformly and emitters stay consistent.
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

    def _emit_assign(self, value: Any) -> None:
        if not self._sync_assign:
            return
        self._trace.assign(self._name, value, line=self._line)


class TraceArray(TraceStructure, MutableSequence[Any]):
    """List-like proxy that seeds ``metadata.initial.array`` and emits ``swap`` / ``assign``.

    Responsibilities
    ----------------
    - Wrap a Python list (own storage; caller's sequence is copied once).
    - Seed / replace ``trace.metadata["initial"]["array"]`` with a **frozen** copy.
    - Detect index reads (ring buffer for future compare — no emit in Milestone 2).
    - Detect index writes and pairwise swaps; emit via existing :class:`Trace` only.
    - Never invent event types or alter TraceDocument shape.

    Trace v0.1 constraint
    ---------------------
    Only ``swap`` mutates ``structures.array`` in the reducer. Single-index writes
    update the Variables panel via ``assign`` when ``sync_assign`` is True; the
    visual structure does **not** change until a ``swap`` (honest format limit).

    Performance
    -----------
    - One list copy at wrap; one independent copy for metadata seed.
    - Swap detection is O(1) pending state (no scans).
    - ``assign`` after mutation copies the array once (required for event immutability).
      Disable with ``sync_assign=False`` when variable-panel snapshots are not needed.
    - No deep copies of elements; no JSON work on the hot path.
    """

    __slots__ = (
        "_data",
        "_pending_write",
        "_reads",
        "_read_count",
    )

    def __init__(
        self,
        values: Sequence[Any],
        *,
        trace: Trace,
        name: str = "array",
        seed_metadata: bool = True,
        sync_assign: bool = True,
        line: Optional[int] = None,
    ) -> None:
        super().__init__(trace, name=name, sync_assign=sync_assign, line=line)
        # Working storage — independent of caller's sequence and of metadata seed.
        self._data: list[Any] = list(values)
        # Pending write: (index, old_value, new_value) awaiting possible swap partner.
        self._pending_write: Optional[tuple[int, Any, Any]] = None
        # Fixed-size read ring (last two getitem indices/values) for Milestone 3+.
        self._reads: list[tuple[int, Any]] = []
        self._read_count = 0

        if seed_metadata:
            self._seed_metadata()

    @classmethod
    def tracked(
        cls,
        values: Sequence[Any],
        *,
        algorithm: str,
        name: str = "array",
        sync_assign: bool = True,
        language: str = "python",
        source_path: Optional[str] = None,
        source_code: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> tuple[Trace, "TraceArray"]:
        """Create a :class:`Trace` seeded from ``values`` and a bound :class:`TraceArray`.

        Preferred construction path — avoids duplicating the bootstrap list by hand.
        """
        data = list(values)
        meta: dict[str, Any] = dict(metadata or {})
        initial = dict(meta.get("initial") or {})
        initial["array"] = data.copy()  # frozen seed; TraceArray keeps a separate working list
        meta["initial"] = initial
        tr = Trace(
            algorithm,
            language=language,
            source_path=source_path,
            source_code=source_code,
            metadata=meta,
        )
        arr = cls(
            data,
            trace=tr,
            name=name,
            seed_metadata=False,
            sync_assign=sync_assign,
        )
        return tr, arr

    # --- metadata -----------------------------------------------------------

    def _seed_metadata(self) -> None:
        """Write a frozen copy of current values into metadata.initial.array."""
        meta = self._trace.metadata
        initial = meta.get("initial")
        if not isinstance(initial, dict):
            initial = {}
            meta["initial"] = initial
        # Independent snapshot — later mutations must not alter bootstrap.
        initial["array"] = self._data.copy()

    # --- reads (detect only; no Trace event in M2) --------------------------

    def _record_read(self, index: int, value: Any) -> None:
        self._read_count += 1
        entry = (index, value)
        if len(self._reads) < 2:
            self._reads.append(entry)
        else:
            self._reads[0] = self._reads[1]
            self._reads[1] = entry

    @property
    def last_reads(self) -> tuple[tuple[int, Any], ...]:
        """Recent ``(index, value)`` getitem pairs (at most two). For tests / compare later."""
        return tuple(self._reads)

    @property
    def read_count(self) -> int:
        return self._read_count

    # --- writes / swaps -----------------------------------------------------

    def _flush_pending_write(self) -> None:
        """Commit a lone write as variables-panel assign (no structure event in v0.1)."""
        if self._pending_write is None:
            return
        self._pending_write = None
        self._emit_assign(self._data.copy())

    def _complete_or_pend_write(self, index: int, old: Any, new: Any) -> None:
        """Apply ``new`` at ``index`` after resolving any pending write / swap."""
        if self._pending_write is not None:
            pj, p_old, p_new = self._pending_write
            # Classic exchange: a[i], a[j] = a[j], a[i] (second write not yet applied).
            if index != pj and new == p_old and old == p_new:
                self._data[index] = new
                self._pending_write = None
                self._trace.swap(pj, index, line=self._line)
                self._emit_assign(self._data.copy())
                return
            # Not a swap — snapshot state after the first write only, then continue.
            self._flush_pending_write()

        self._data[index] = new
        if old != new:
            self._pending_write = (index, old, new)

    def flush(self) -> None:
        """Flush a pending single-index write (emit assign if sync_assign)."""
        self._flush_pending_write()

    # --- MutableSequence ----------------------------------------------------

    def __len__(self) -> int:
        self._flush_pending_write()
        return len(self._data)

    @overload
    def __getitem__(self, index: int) -> Any: ...

    @overload
    def __getitem__(self, index: slice) -> list[Any]: ...

    def __getitem__(self, index: Union[int, slice]) -> Any:
        self._flush_pending_write()
        if isinstance(index, slice):
            return self._data[index]
        i = index.__index__()
        # Normalize negative indices for stable read tracking / future compare.
        n = len(self._data)
        if i < 0:
            i += n
        value = self._data[i]
        self._record_read(i, value)
        return value

    @overload
    def __setitem__(self, index: int, value: Any) -> None: ...

    @overload
    def __setitem__(self, index: slice, value: Iterable[Any]) -> None: ...

    def __setitem__(self, index: Union[int, slice], value: Any) -> None:
        if isinstance(index, slice):
            self._flush_pending_write()
            self._data[index] = value
            self._emit_assign(self._data.copy())
            return

        i = index.__index__()
        n = len(self._data)
        if i < 0:
            i += n
        old = self._data[i]
        # Resolve pending swap/write before mutating so assign snapshots stay accurate.
        self._complete_or_pend_write(i, old, value)

    def __delitem__(self, index: Union[int, slice]) -> None:
        self._flush_pending_write()
        del self._data[index]
        self._emit_assign(self._data.copy())

    def insert(self, index: int, value: Any) -> None:
        self._flush_pending_write()
        self._data.insert(index, value)
        self._emit_assign(self._data.copy())

    def __iter__(self) -> Iterator[Any]:
        self._flush_pending_write()
        return iter(self._data)

    def __repr__(self) -> str:
        return f"TraceArray({self._data!r}, name={self._name!r})"

    def __eq__(self, other: object) -> bool:
        self._flush_pending_write()
        if isinstance(other, TraceArray):
            return self._data == other._data
        if isinstance(other, list):
            return self._data == other
        return NotImplemented

    def copy(self) -> list[Any]:
        """Return a plain list snapshot (does not emit events)."""
        self._flush_pending_write()
        return self._data.copy()

    def to_list(self) -> list[Any]:
        """Alias for :meth:`copy` — plain list for return values / assertions."""
        return self.copy()
