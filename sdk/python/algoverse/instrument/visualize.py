"""
@visualize — public automatic visualization API (Milestone 3).

Composition (no AST / bytecode; Trace v0.1 unchanged)::

    @visualize
        → InstrumentationSession
        → TraceArray (auto-wrap list/tuple args)
        → TraceRecorder (Trace)
        → TraceDocument
        → Visualization Service (embedded player)  [open_player=True]
        → optional .trace.json                     [write=True]

Manual :class:`~algoverse.Trace` APIs continue to work unchanged.
"""

from __future__ import annotations

import functools
import inspect
import os
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar, Union, overload

from algoverse.instrument.session import InstrumentationSession
from algoverse.instrument.structures import TraceArray
from algoverse.recorder import Trace, TraceError

F = TypeVar("F", bound=Callable[..., Any])
TrackSpec = Union[str, int, None]


def _env_flag(name: str) -> bool:
    v = os.environ.get(name, "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _env_flag_default_true(name: str) -> Optional[bool]:
    """Return True/False if env set, else None (caller keeps default)."""
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return None
    return _env_flag(name)


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


def _should_open_player(opt: bool) -> bool:
    """Resolve open_player with env overrides.

    - ``ALGOVERSE_NO_PLAYER=1`` / ``ALGOVERSE_OPEN_PLAYER=0`` → force off
    - ``ALGOVERSE_OPEN_PLAYER=1`` → force on
    - else use decorator option
    """
    if _env_flag("ALGOVERSE_NO_PLAYER"):
        return False
    forced = _env_flag_default_true("ALGOVERSE_OPEN_PLAYER")
    if forced is False:
        return False
    if forced is True:
        return True
    return opt


class VisualizedFunction:
    """Callable wrapper produced by :func:`visualize`.

    Attributes
    ----------
    last_trace:
        The :class:`Trace` from the most recent successful instrumentation run.
    last_path:
        Path returned by the most recent ``write()``, if any.
    last_player_url:
        Player URL from the most recent viewer launch, if any.
    """

    __slots__ = (
        "__wrapped__",
        "_options",
        "last_trace",
        "last_path",
        "last_player_url",
        "__dict__",
    )

    def __init__(self, fn: Callable[..., Any], options: dict[str, Any]) -> None:
        functools.update_wrapper(self, fn)
        self.__wrapped__ = fn
        self._options = options
        self.last_trace: Optional[Trace] = None
        self.last_path: Optional[Path] = None
        self.last_player_url: Optional[str] = None

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
    compact: bool = opts["compact"]
    array_name: str = opts["name"]
    do_write: bool = opts["write"]
    out: Optional[Union[str, Path]] = opts["out"]
    open_player = _should_open_player(bool(opts["open_player"]))
    port: int = int(opts.get("port") or os.environ.get("ALGOVERSE_VIEWER_PORT") or 3210)
    # Compact teaching traces: skip bookkeeping assign after swap (swap already mutates).
    assign_after_swap = not compact if opts.get("assign_after_swap") is None else bool(
        opts["assign_after_swap"]
    )

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
        arr = raw
        tr = arr.trace
        arrays.append(arr)
    else:
        tr, arr = TraceArray.tracked(
            raw,
            algorithm=algorithm,
            name=array_name,
            sync_assign=sync_assign,
            assign_after_swap=assign_after_swap,
            source_path=source_path,
            source_code=source_code,
        )
        arrays.append(arr)
        bound.arguments[param_name] = arr

    session = InstrumentationSession(trace=tr, compact=compact)
    for a in arrays:
        session.register_structure(a)

    print(f"Running {algorithm}...", flush=True)

    try:
        result = session.run(fn, *bound.args, **bound.kwargs)
    except Exception:
        owner.last_trace = tr
        owner.last_path = None
        owner.last_player_url = None
        raise

    for a in arrays:
        a.flush()

    try:
        doc = tr.to_dict()
    except TraceError:
        owner.last_trace = tr
        owner.last_path = None
        owner.last_player_url = None
        raise

    owner.last_trace = tr
    owner.last_path = None
    owner.last_player_url = None

    print("[algoverse] Trace generated", flush=True)

    if do_write:
        path = tr.write(out)
        owner.last_path = path

    if open_player:
        from algoverse.viewer import try_open_viewer

        ok = try_open_viewer(doc, port=port, open_browser=True)
        if ok:
            from algoverse.viewer import viewer_base_url

            owner.last_player_url = viewer_base_url(port) + "/"

    return _unwrap_result(result)


@overload
def visualize(fn: F) -> VisualizedFunction: ...


@overload
def visualize(
    fn: None = None,
    *,
    algorithm: Optional[str] = None,
    out: Optional[Union[str, Path]] = None,
    write: bool = False,
    open_player: bool = True,
    track: TrackSpec = None,
    name: str = "array",
    sync_assign: bool = True,
    compact: bool = True,
    assign_after_swap: Optional[bool] = None,
    source_path: Optional[str] = None,
    source_code: Optional[str] = None,
    port: Optional[int] = None,
) -> Callable[[F], VisualizedFunction]: ...


def visualize(
    fn: Optional[F] = None,
    *,
    algorithm: Optional[str] = None,
    out: Optional[Union[str, Path]] = None,
    write: bool = False,
    open_player: bool = True,
    track: TrackSpec = None,
    name: str = "array",
    sync_assign: bool = True,
    compact: bool = True,
    assign_after_swap: Optional[bool] = None,
    source_path: Optional[str] = None,
    source_code: Optional[str] = None,
    port: Optional[int] = None,
) -> Any:
    """Decorate a function so each call emits a TraceDocument automatically.

    Parameters
    ----------
    algorithm:
        Trace ``algorithm`` id (default: function ``__name__``).
    out:
        Output path for ``Trace.write`` when ``write=True``.
    write:
        If True, write ``.trace.json`` after a successful run (default False).
    open_player:
        If True (default), start the embedded Visualization Service and open
        the browser. Disable with ``open_player=False`` or ``ALGOVERSE_NO_PLAYER=1``.
    track:
        Which parameter is the primary array: name (``str``), bind-order index
        (``int``), or ``None`` for the first list/tuple/TraceArray argument.
    name:
        Variable name used for TraceArray ``assign`` events (default ``\"array\"``).
    sync_assign:
        Forwarded to :class:`TraceArray` — emit ``assign`` after non-swap writes.
    compact:
        When True (default), emit a short teaching trace: no ``line`` spam, no
        local loop-counter assigns; keep ``call`` / ``compare`` / ``swap`` /
        ``return`` and meaningful structure writes.
    assign_after_swap:
        If None, defaults to ``not compact``. When False, skip bookkeeping
        ``assign`` after ``swap`` (Player already applies swap to the array).
    source_path / source_code:
        Optional Trace source panel overrides (else ``inspect`` best-effort).
    port:
        Visualization Service port (default 3210 / ``ALGOVERSE_VIEWER_PORT``).

    Examples
    --------
    >>> from algoverse import visualize
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
        "compact": compact,
        "assign_after_swap": assign_after_swap,
        "source_path": source_path,
        "source_code": source_code,
        "port": port,
    }

    def decorator(f: Callable[..., Any]) -> VisualizedFunction:
        if not callable(f) or not hasattr(f, "__code__"):
            raise TraceError("@visualize requires a Python function with __code__")
        return VisualizedFunction(f, options)

    if fn is not None:
        return decorator(fn)
    return decorator
