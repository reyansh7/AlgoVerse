"""
Structure plugins — TraceStructure base and TraceArray (Array Plugin Core).

Future: tree.py, graph.py, … following the same contract.
"""

from __future__ import annotations

from algoverse.instrument.structures.array import TraceArray
from algoverse.instrument.structures.base import TraceStructure

__all__ = ["TraceStructure", "TraceArray"]
