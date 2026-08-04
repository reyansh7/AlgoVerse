"""AlgoVerse Python SDK — emit Trace v0.1 JSON from instrumented algorithms."""

from .instrument import (
    InstrumentationSession,
    TraceArray,
    TraceStructure,
    VisualizedFunction,
    visualize,
)
from .recorder import Trace, TraceError

__all__ = [
    "Trace",
    "TraceError",
    "InstrumentationSession",
    "TraceArray",
    "TraceStructure",
    "VisualizedFunction",
    "visualize",
    "__version__",
]
__version__ = "0.1.0"
