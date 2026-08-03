"""AlgoVerse Python SDK — emit Trace v0.1 JSON from instrumented algorithms."""

from .instrument import InstrumentationSession, TraceArray, TraceStructure
from .recorder import Trace, TraceError

__all__ = [
    "Trace",
    "TraceError",
    "InstrumentationSession",
    "TraceArray",
    "TraceStructure",
    "__version__",
]
__version__ = "0.1.0"
