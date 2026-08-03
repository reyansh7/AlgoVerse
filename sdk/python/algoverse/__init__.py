"""AlgoVerse Python SDK — emit Trace v0.1 JSON from instrumented algorithms."""

from .recorder import Trace, TraceError

__all__ = ["Trace", "TraceError", "__version__"]
__version__ = "0.1.0"
