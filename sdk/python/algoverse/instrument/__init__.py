"""Automatic instrumentation adapters (Sprint 3). Additive to manual Trace."""

from .session import InstrumentationSession
from .trace_array import TraceArray, TraceStructure

__all__ = ["InstrumentationSession", "TraceArray", "TraceStructure"]
