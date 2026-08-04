"""
InstrumentationSession — owns a Trace and a scoped sys.settrace hook.

Registers structure plugins (e.g. TraceArray) for line stamping and flush-on-stop.
"""

from __future__ import annotations

import copy
import sys
import types
from typing import Any, Callable, MutableMapping, Optional, TypeVar

from algoverse.recorder import Trace, TraceError

R = TypeVar("R")

_SKIP_LOCAL_NAMES = frozenset(
    {
        "__builtins__",
        "__class__",
        "__name__",
        "__module__",
        "__qualname__",
        "__doc__",
        "__annotations__",
        "__wrapped__",
    }
)


def _is_jsonish(value: Any) -> bool:
    if value is None or isinstance(value, (bool, int, float, str)):
        return True
    if isinstance(value, list):
        return all(_is_jsonish(v) for v in value)
    if isinstance(value, dict):
        return all(isinstance(k, str) and _is_jsonish(v) for k, v in value.items())
    return False


def _is_structure_proxy(value: Any) -> bool:
    return bool(getattr(type(value), "_algoverse_structure", False))


def _snapshot_locals(frame: types.FrameType) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for name, value in frame.f_locals.items():
        if name in _SKIP_LOCAL_NAMES or name.startswith("__"):
            continue
        if _is_structure_proxy(value):
            continue
        if _is_jsonish(value):
            out[name] = copy.deepcopy(value)
    return out


class InstrumentationSession:
    """Scoped automatic emitter that writes into an existing :class:`Trace`.

    Parameters
    ----------
    compact:
        When True (preferred for teaching traces), suppress noisy bookkeeping:

        - no ``line`` events (source line is still stamped onto structures)
        - no local ``assign`` diffs for loop counters / temps

        Keep ``call`` / ``return``. Structure plugins (e.g. TraceArray) still
        emit ``compare`` / ``swap`` / meaningful ``assign`` / ``highlight``.
    """

    def __init__(
        self,
        *,
        algorithm: Optional[str] = None,
        metadata: Optional[MutableMapping[str, Any]] = None,
        language: str = "python",
        source_path: Optional[str] = None,
        source_code: Optional[str] = None,
        trace: Optional[Trace] = None,
        compact: bool = False,
    ) -> None:
        if trace is not None:
            self._trace = trace
        else:
            if not algorithm:
                raise TraceError(
                    'InstrumentationSession requires algorithm="…" when not adopting a Trace'
                )
            if metadata is None:
                raise TraceError(
                    "InstrumentationSession requires metadata={'initial': {'array': [...]}} "
                    "or an existing Trace instance"
                )
            self._trace = Trace(
                algorithm,
                language=language,
                source_path=source_path,
                source_code=source_code,
                metadata=metadata,
            )

        self._compact = bool(compact)
        self._active = False
        self._prev_trace: Optional[Callable[..., Any]] = None
        self._target_code: Optional[types.CodeType] = None
        self._locals_by_frame: dict[int, dict[str, Any]] = {}
        self._structures: list[Any] = []

    @property
    def trace(self) -> Trace:
        return self._trace

    @property
    def active(self) -> bool:
        return self._active

    def register_structure(self, structure: Any) -> None:
        """Register a TraceStructure for line stamps and flush-on-stop."""
        if structure is None:
            return
        if structure not in self._structures:
            self._structures.append(structure)

    def start(self, target: Callable[..., Any]) -> None:
        if self._active:
            raise TraceError("InstrumentationSession is already active")
        if not callable(target) or not hasattr(target, "__code__"):
            raise TraceError("start() requires a Python function with __code__")

        self._target_code = target.__code__
        self._locals_by_frame.clear()
        self._prev_trace = sys.gettrace()
        self._active = True
        sys.settrace(self._on_trace)

    def stop(self) -> None:
        if not self._active:
            return
        for s in self._structures:
            flush = getattr(s, "flush", None)
            if callable(flush):
                flush()
        sys.settrace(self._prev_trace)
        self._prev_trace = None
        self._target_code = None
        self._locals_by_frame.clear()
        self._active = False

    def run(self, fn: Callable[..., R], /, *args: Any, **kwargs: Any) -> R:
        self.start(fn)
        try:
            return fn(*args, **kwargs)
        finally:
            self.stop()

    def __enter__(self) -> "InstrumentationSession":
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.stop()
        return None

    def _stamp_structures(self, lineno: int) -> None:
        for s in self._structures:
            if hasattr(s, "line"):
                s.line = lineno

    def _is_target_frame(self, frame: types.FrameType) -> bool:
        return self._target_code is not None and frame.f_code is self._target_code

    def _on_trace(
        self,
        frame: types.FrameType,
        event: str,
        arg: Any,
    ) -> Optional[Callable[..., Any]]:
        if not self._active or self._target_code is None:
            return None

        if event == "call":
            if frame.f_code is self._target_code:
                self._emit_call(frame)
                self._stamp_structures(frame.f_lineno)
                self._locals_by_frame[id(frame)] = _snapshot_locals(frame)
                return self._on_trace
            return None

        if not self._is_target_frame(frame):
            return None

        if event == "line":
            self._stamp_structures(frame.f_lineno)
            if not self._compact:
                self._trace.line(frame.f_lineno)
                self._emit_assign_diffs(frame)
            else:
                # Still track locals so a future verbose mode / debug can use them,
                # but do not emit — loop counters are noise for the Player story.
                fid = id(frame)
                self._locals_by_frame[fid] = _snapshot_locals(frame)
            return self._on_trace

        if event == "return":
            self._stamp_structures(frame.f_lineno)
            if not self._compact:
                self._emit_assign_diffs(frame)
            value = arg if _is_jsonish(arg) else None
            kwargs: dict[str, Any] = {"line": frame.f_lineno}
            if value is not None:
                kwargs["value"] = value
            self._trace.return_(frame.f_code.co_name, **kwargs)
            self._locals_by_frame.pop(id(frame), None)
            return self._on_trace

        if event == "exception":
            return self._on_trace

        return self._on_trace

    def _emit_call(self, frame: types.FrameType) -> None:
        args: dict[str, Any] = {}
        code = frame.f_code
        n = code.co_argcount + code.co_kwonlyargcount
        names = code.co_varnames[:n]
        for name in names:
            if name in frame.f_locals and _is_jsonish(frame.f_locals[name]):
                args[name] = frame.f_locals[name]
        self._trace.call(
            code.co_name,
            args=args or None,
            line=frame.f_lineno,
        )

    def _emit_assign_diffs(self, frame: types.FrameType) -> None:
        fid = id(frame)
        prev = self._locals_by_frame.get(fid, {})
        current = _snapshot_locals(frame)
        for name, value in current.items():
            if prev.get(name) != value:
                self._trace.assign(name, value, line=frame.f_lineno)
        self._locals_by_frame[fid] = current
