"""
@visualize — public automatic visualization API (Sprint 3 Milestone 3).

Composes existing InstrumentationSession + TraceArray + Trace.
No AST / bytecode rewriting. Additive to manual Trace APIs.
"""

from __future__ import annotations

import functools
import inspect
import os
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar, Union, overload

from algoverse.instrument.launch import try_open_trace_player
from algoverse.instrument.session import InstrumentationSession
from algoverse.instrument.structures import TraceArray
from algoverse.recorder import Trace, TraceError

F = TypeVar("F", bound=Callable[..., Any])
TrackSpec = Union[str, int, None]


def _env_flag(name: str) -> bool:
    v = os.environ.get(name, "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _is_list_like(value: Any) -> bool:
    if isinstance(value, TraceArray):
        return True
    if isinstance(value, (list, tuple)):
        return True
    return False


def _try_source(fn: Callable[..., Any]) -> tuple[Optional[str], Optional[str]]:
    """Best-effort source capture; never raises."""
    try:
        src = inspect.getsource(fn)
    except (OSError, TypeError):
        src = None
    try:
        path = inspect.getsourcefile(fn) or inspect.getfile(fn)
    except TypeError:
        path = None
    return path, src


def _resolve_track(
    bound: inspect.BoundArguments,
    track: TrackSpec,
) -> tuple[str, Any]:
    """Return (parameter_name, value) for the primary array to instrument."""
    args = bound.arguments

    if isinstance(track, int):
        items = list(args.items())
        if track < 0 or track >= len(items):
            raise TraceError(
                f"visualize(track={track}) is out of range — function has "
                f"{len(items)} bound parameter(s)"
            )
        name, value = items[track]
        if not _is_list_like(value):
            raise TraceError(
                f"visualize(track={track}) parameter {name!r} is not list/tuple/TraceArray"
            )
        return name, value

    if isinstance(track, str):
        if track not in args:
            raise TraceError(
                f"visualize(track={track!r}) — no parameter named {track!r}. "
                f"Known: {', '.join(args)}"
            )
        value = args[track]
        if not _is_list_like(value):
            raise TraceError(
                f"visualize(track={track!r}) value is not list/tuple/TraceArray"
            )
        return track, value

    for name, value in args.items():
        if _is_list_like(value):
            return name, value

    raise TraceError(
        "@visualize requires a list/tuple (or TraceArray) argument to track. "
        "Pass the array as the first list-like parameter, or set track='param_name'."
    )


def _unwrap_result(result: Any) -> Any:
    if isinstance(result, TraceArray):
        result.flush()
        return result.to_list()
    return result


class VisualizedFunction:
    """Callable wrapper produced by :func:`visualize`.

    Attributes
    ----------
    last_trace:
        The :class:`Trace` from the most recent successful instrumentation run.
    last_path:
        Path returned by the most recent ``write()``, if any.
    """

    __slots__ = (
        "__wrapped__",
        "_options",
        "last_trace",
        "last_path",
        "__dict__",
    )

    def __init__(self, fn: Callable[..., Any], options: dict[str, Any]) -> None:
        functools.update_wrapper(self, fn)
        self.__wrapped__ = fn
        self._options = options
        self.last_trace: Optional[Trace] = None
        self.last_path: Optional[Path] = None

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return _run_visualized(self.__wrapped__, self, *args, **kwargs)

    def __repr__(self) -> str:
        return f"<VisualizedFunction {self.__wrapped__.__name__}>"


def _run_visualized(
    fn: Callable[..., Any],
    owner: VisualizedFunction,
    *args: Any,
    **kwargs: Any,
) -> Any:
    opts = owner._options
    algorithm: str = opts["algorithm"] or fn.__name__
    track: TrackSpec = opts["track"]
    sync_assign: bool = opts["sync_assign"]
    array_name: str = opts["name"]
    do_write: bool = opts["write"]
    out: Optional[Union[str, Path]] = opts["out"]
    open_player: bool = opts["open_player"] or _env_flag("ALGOVERSE_OPEN_PLAYER")

    sig = inspect.signature(fn)
    try:
        bound = sig.bind(*args, **kwargs)
    except TypeError as e:
        raise TraceError(f"@visualize could not bind arguments for {fn.__name__}: {e}") from e
    bound.apply_defaults()

    param_name, raw = _resolve_track(bound, track)

    source_path = opts.get("source_path")
    source_code = opts.get("source_code")
    if source_path is None or source_code is None:
        auto_path, auto_src = _try_source(fn)
        if source_path is None:
            source_path = auto_path
        if source_code is None:
            source_code = auto_src

    arrays: list[TraceArray] = []

    if isinstance(raw, TraceArray):
        # Adopt caller's TraceArray — must already be bound to a Trace.
        arr = raw
        tr = arr.trace
        if tr.algorithm != algorithm and opts["algorithm"]:
            # Explicit algorithm override on decorator wins for document id only
            # when we own construction; adopting keeps the existing Trace as-is.
            pass
        arrays.append(arr)
    else:
        # One list copy inside TraceArray.tracked (seed + working storage).
        tr, arr = TraceArray.tracked(
            raw,
            algorithm=algorithm,
            name=array_name,
            sync_assign=sync_assign,
            source_path=source_path,
            source_code=source_code,
        )
        arrays.append(arr)
        bound.arguments[param_name] = arr

    session = InstrumentationSession(trace=tr)
    for a in arrays:
        session.register_structure(a)

    try:
        result = session.run(fn, *bound.args, **bound.kwargs)
    except Exception:
        owner.last_trace = tr
        owner.last_path = None
        raise

    # session.stop already flushed registered structures; keep explicit flush for safety.
    for a in arrays:
        a.flush()

    # Validate TraceDocument shape (bootstrap + JSON-friendliness).
    try:
        tr.to_dict()
    except TraceError:
        owner.last_trace = tr
        owner.last_path = None
        raise

    owner.last_trace = tr
    owner.last_path = None

    if do_write:
        path = tr.write(out)
        owner.last_path = path
        if open_player:
            try:
                try_open_trace_player(path)
            except Exception as e:  # noqa: BLE001 — player open must not fail the algorithm
                print(
                    f"[algoverse] tip: player launch failed ({e}). "
                    f"Trace is at {path}",
                    flush=True,
                )

    return _unwrap_result(result)


@overload
def visualize(fn: F) -> VisualizedFunction: ...


@overload
def visualize(
    fn: None = None,
    *,
    algorithm: Optional[str] = None,
    out: Optional[Union[str, Path]] = None,
    write: bool = True,
    open_player: bool = False,
    track: TrackSpec = None,
    name: str = "array",
    sync_assign: bool = True,
    source_path: Optional[str] = None,
    source_code: Optional[str] = None,
) -> Callable[[F], VisualizedFunction]: ...


def visualize(
    fn: Optional[F] = None,
    *,
    algorithm: Optional[str] = None,
    out: Optional[Union[str, Path]] = None,
    write: bool = True,
    open_player: bool = False,
    track: TrackSpec = None,
    name: str = "array",
    sync_assign: bool = True,
    source_path: Optional[str] = None,
    source_code: Optional[str] = None,
) -> Any:
    """Decorate a function so each call emits a TraceDocument automatically.

    Parameters
    ----------
    algorithm:
        Trace ``algorithm`` id (default: function ``__name__``).
    out:
        Output path for ``Trace.write`` (else ``ALGOVERSE_TRACE_OUT`` / default).
    write:
        If True (default), write ``.trace.json`` after a successful run.
    open_player:
        If True (or env ``ALGOVERSE_OPEN_PLAYER=1``), best-effort open the Trace Player.
    track:
        Which parameter is the primary array: name (``str``), bind-order index
        (``int``), or ``None`` for the first list/tuple/TraceArray argument.
    name:
        Variable name used for TraceArray ``assign`` events (default ``\"array\"``).
    sync_assign:
        Forwarded to :class:`TraceArray` (disable to avoid O(n) snapshots).
    source_path / source_code:
        Optional Trace source panel overrides (else ``inspect`` best-effort).

    Examples
    --------
    >>> @visualize
    ... def bubble_sort(arr):
    ...     ...
    >>> bubble_sort([5, 4, 3, 2])
    """

    options = {
        "algorithm": algorithm,
        "out": out,
        "write": write,
        "open_player": open_player,
        "track": track,
        "name": name,
        "sync_assign": sync_assign,
        "source_path": source_path,
        "source_code": source_code,
    }

    def decorator(f: Callable[..., Any]) -> VisualizedFunction:
        if not callable(f) or not hasattr(f, "__code__"):
            raise TraceError("@visualize requires a Python function with __code__")
        return VisualizedFunction(f, options)

    if fn is not None:
        return decorator(fn)
    return decorator
