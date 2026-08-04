"""Automatic instrumentation adapters (Sprint 3 + Array Plugin Core)."""

from .launch import try_open_trace_player
from .session import InstrumentationSession
from .structures import TraceArray, TraceStructure
from .visualize import VisualizedFunction, visualize

__all__ = [
    "InstrumentationSession",
    "TraceArray",
    "TraceStructure",
    "VisualizedFunction",
    "visualize",
    "try_open_trace_player",
]
