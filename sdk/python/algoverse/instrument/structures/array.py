"""
TraceArray — Array Plugin Core (v0.3).

Scoped to operations needed for the six canonical teaching sorts
(bubble, selection, insertion, merge, quick, heap) — not a full list clone.

Trace v0.1: only ``swap`` mutates Player structures; other mutations use
``assign`` / ``compare`` / ``highlight``.
"""

from __future__ import annotations

from collections.abc import Iterable, MutableSequence, Sequence
from typing import Any, Iterator, Optional, Union, overload

from algoverse.instrument.structures.base import TraceStructure
from algoverse.recorder import Trace, TraceError


class TraceArray(TraceStructure, MutableSequence[Any]):
    """List-like Array Plugin for AlgoVerse Trace emission.

    Core surface (six-sort suite)
    -----------------------------
    Index get/set (incl. negatives), slice get/set/del, swap detection,
    ``append`` / ``extend`` / ``insert`` / ``pop``, ``clear``, ``reverse``
    (single assign), best-effort ``compare`` from paired reads.

    Not a complete ``list`` reimplementation — Recommended/Advanced ops stay
    on the roadmap and must not block the Tree Plugin.
    """

    __slots__ = (
        "_data",
        "_pending_write",
        "_reads",
        "_read_count",
        "_emit_compare",
        "_last_compare",
    )

    def __init__(
        self,
        values: Sequence[Any],
        *,
        trace: Trace,
        name: str = "array",
        seed_metadata: bool = True,
        sync_assign: bool = True,
        assign_after_swap: bool = True,
        line: Optional[int] = None,
        emit_compare: bool = True,
    ) -> None:
        super().__init__(
            trace,
            name=name,
            sync_assign=sync_assign,
            assign_after_swap=assign_after_swap,
            line=line,
        )
        self._data: list[Any] = list(values)
        self._pending_write: Optional[tuple[int, Any, Any]] = None
        self._reads: list[tuple[int, Any]] = []
        self._read_count = 0
        self._emit_compare = bool(emit_compare)
        self._last_compare: Optional[tuple[int, int]] = None

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
        assign_after_swap: bool = True,
        emit_compare: bool = True,
        language: str = "python",
        source_path: Optional[str] = None,
        source_code: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> tuple[Trace, "TraceArray"]:
        """Create a :class:`Trace` seeded from ``values`` and a bound :class:`TraceArray`."""
        data = list(values)
        meta: dict[str, Any] = dict(metadata or {})
        initial = dict(meta.get("initial") or {})
        initial["array"] = data.copy()
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
            assign_after_swap=assign_after_swap,
            emit_compare=emit_compare,
        )
        return tr, arr

    @property
    def line(self) -> Optional[int]:
        return self._line

    @line.setter
    def line(self, value: Optional[int]) -> None:
        """New source line → reset read window so compares stay per-expression.

        Keeps ``_last_compare`` so ``if a[i] > a[j]: a[i], a[j] = …`` does not
        emit a second compare for the unpack RHS on the next line.
        """
        if value != self._line:
            self._reads.clear()
        self._line = value

    def _seed_metadata(self) -> None:
        meta = self._trace.metadata
        initial = meta.get("initial")
        if not isinstance(initial, dict):
            initial = {}
            meta["initial"] = initial
        initial["array"] = self._data.copy()

    # --- reads / compare ----------------------------------------------------

    def _record_read(self, index: int, value: Any) -> None:
        self._read_count += 1
        entry = (index, value)
        if len(self._reads) < 2:
            self._reads.append(entry)
        else:
            self._reads[0] = self._reads[1]
            self._reads[1] = entry

        if not self._emit_compare or len(self._reads) < 2:
            return
        (i1, v1), (i2, v2) = self._reads[0], self._reads[1]
        if i1 == i2:
            return
        # Skip duplicate compare that does not change the visualization.
        pair = (i1, i2) if i1 < i2 else (i2, i1)
        if self._last_compare == pair:
            return
        # Paired distinct index reads → best-effort compare (bubble/selection/quick/heap).
        self._trace.compare(i1, i2, values=[v1, v2], line=self._line)
        self._last_compare = pair

    @property
    def last_reads(self) -> tuple[tuple[int, Any], ...]:
        return tuple(self._reads)

    @property
    def read_count(self) -> int:
        return self._read_count

    # --- writes / swaps -----------------------------------------------------

    def _flush_pending_write(self) -> None:
        if self._pending_write is None:
            return
        self._pending_write = None
        self._emit_assign(self._data.copy())

    def _complete_or_pend_write(self, index: int, old: Any, new: Any) -> None:
        if self._pending_write is not None:
            pj, p_old, p_new = self._pending_write
            if index != pj and new == p_old and old == p_new:
                self._data[index] = new
                self._pending_write = None
                self._trace.swap(pj, index, line=self._line)
                # swap already mutates Player structures — optional bookkeeping only.
                if self._assign_after_swap:
                    self._emit_assign(self._data.copy())
                self._reads.clear()
                self._last_compare = None
                return
            self._flush_pending_write()

        self._data[index] = new
        if old != new:
            self._pending_write = (index, old, new)
        self._reads.clear()
        self._last_compare = None

    def flush(self) -> None:
        self._flush_pending_write()

    def _norm_index(self, index: int) -> int:
        i = index.__index__()
        n = len(self._data)
        if i < 0:
            i += n
        if i < 0 or i >= n:
            raise IndexError("TraceArray index out of range")
        return i

    # --- MutableSequence / Core list ops ------------------------------------

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
        i = self._norm_index(index)
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
            self._reads.clear()
            return

        i = self._norm_index(index)
        old = self._data[i]
        self._complete_or_pend_write(i, old, value)

    def __delitem__(self, index: Union[int, slice]) -> None:
        self._flush_pending_write()
        if isinstance(index, slice):
            del self._data[index]
        else:
            del self._data[self._norm_index(index)]
        self._emit_assign(self._data.copy())
        self._reads.clear()

    def insert(self, index: int, value: Any) -> None:
        self._flush_pending_write()
        # list.insert allows index beyond ends; match list semantics.
        self._data.insert(index, value)
        n = len(self._data)
        hi = n - 1
        at = index if index >= 0 else index + n
        at = 0 if at < 0 else (hi if at > hi else at)
        self._emit_assign(self._data.copy())
        self._emit_highlight(indices=[at], kinds={at: "write"})
        self._reads.clear()

    def append(self, value: Any) -> None:
        self._flush_pending_write()
        self._data.append(value)
        idx = len(self._data) - 1
        self._emit_assign(self._data.copy())
        self._emit_highlight(indices=[idx], kinds={idx: "write"})
        self._reads.clear()

    def extend(self, values: Iterable[Any]) -> None:
        self._flush_pending_write()
        start = len(self._data)
        self._data.extend(values)
        end = len(self._data)
        self._emit_assign(self._data.copy())
        if end > start:
            idxs = list(range(start, end))
            self._emit_highlight(
                indices=idxs,
                kinds={i: "write" for i in idxs},
            )
        self._reads.clear()

    def pop(self, index: int = -1) -> Any:
        self._flush_pending_write()
        i = self._norm_index(index)
        value = self._data.pop(i)
        self._emit_assign(self._data.copy())
        if self._data:
            hi = min(i, len(self._data) - 1)
            self._emit_highlight(indices=[hi], kinds={hi: "write"})
        else:
            self._emit_highlight(clear=True)
        self._reads.clear()
        return value

    def clear(self) -> None:
        self._flush_pending_write()
        self._data.clear()
        self._emit_assign([])
        self._emit_highlight(clear=True)
        self._reads.clear()

    def reverse(self) -> None:
        """In-place reverse as one assign (not n/2 swaps — keeps event count sane)."""
        self._flush_pending_write()
        self._data.reverse()
        self._emit_assign(self._data.copy())
        if self._data:
            self._emit_highlight(
                indices=list(range(len(self._data))),
                kinds={i: "write" for i in range(len(self._data))},
            )
        self._reads.clear()

    def __iter__(self) -> Iterator[Any]:
        """Quiet iteration — no per-element events (avoids event storms)."""
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
        """Plain list snapshot (no events)."""
        self._flush_pending_write()
        return self._data.copy()

    def to_list(self) -> list[Any]:
        return self.copy()
