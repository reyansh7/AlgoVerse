"""Tests for InstrumentationSession (Sprint 3 milestone 1)."""

from __future__ import annotations

import sys
import unittest

from algoverse import InstrumentationSession, Trace, TraceError


def _types(session: InstrumentationSession) -> list[str]:
    return [e["type"] for e in session.trace.to_dict()["events"]]


class InstrumentationSessionTests(unittest.TestCase):
    def test_run_emits_call_line_assign_return(self) -> None:
        def add(a: int, b: int) -> int:
            s = a + b
            return s

        session = InstrumentationSession(
            algorithm="add",
            metadata={"initial": {"array": [0]}},
            source_code="def add(a, b):\n    s = a + b\n    return s\n",
        )
        result = session.run(add, 2, 3)
        self.assertEqual(result, 5)
        self.assertFalse(session.active)
        self.assertIsNone(sys.gettrace())

        types = _types(session)
        self.assertIn("call", types)
        self.assertIn("line", types)
        self.assertIn("assign", types)
        self.assertIn("return", types)
        self.assertEqual(types[0], "call")
        self.assertEqual(types[-1], "return")

        doc = session.trace.to_dict()
        self.assertEqual(doc["metadata"]["initial"]["array"], [0])
        self.assertEqual(doc["algorithm"], "add")

    def test_restores_trace_hook_after_exception(self) -> None:
        def boom() -> None:
            raise RuntimeError("fail")

        prev = sys.gettrace()
        session = InstrumentationSession(
            algorithm="boom",
            metadata={"initial": {"array": [1]}},
        )
        with self.assertRaises(RuntimeError):
            session.run(boom)
        self.assertFalse(session.active)
        self.assertEqual(sys.gettrace(), prev)

    def test_does_not_double_start(self) -> None:
        def nop() -> None:
            return None

        session = InstrumentationSession(
            algorithm="nop",
            metadata={"initial": {"array": [1]}},
        )
        session.start(nop)
        with self.assertRaises(TraceError):
            session.start(nop)
        session.stop()

    def test_accepts_existing_trace(self) -> None:
        tr = Trace(algorithm="existing", metadata={"initial": {"array": [9]}})

        def id_(x: int) -> int:
            return x

        session = InstrumentationSession(trace=tr)
        self.assertIs(session.trace, tr)
        self.assertEqual(session.run(id_, 7), 7)
        self.assertTrue(any(e["type"] == "call" for e in tr.to_dict()["events"]))

    def test_context_manager_stops_if_left_active(self) -> None:
        def nop() -> int:
            return 1

        with InstrumentationSession(
            algorithm="cm",
            metadata={"initial": {"array": [1]}},
        ) as session:
            session.start(nop)
            self.assertTrue(session.active)
        self.assertFalse(session.active)
        self.assertIsNone(sys.gettrace())

    def test_ignores_nested_helper_frames(self) -> None:
        def helper(x: int) -> int:
            y = x + 1
            return y

        def outer(n: int) -> int:
            return helper(n)

        session = InstrumentationSession(
            algorithm="outer",
            metadata={"initial": {"array": [1]}},
        )
        self.assertEqual(session.run(outer, 10), 11)
        frames = [
            e["data"].get("frame")
            for e in session.trace.to_dict()["events"]
            if e["type"] in ("call", "return")
        ]
        self.assertEqual(frames, ["outer", "outer"])
        self.assertNotIn("helper", frames)

    def test_inplace_list_mutation_emits_assign(self) -> None:
        def grow() -> list[int]:
            xs = [1]
            xs.append(2)
            return xs

        session = InstrumentationSession(
            algorithm="grow",
            metadata={"initial": {"array": [1]}},
        )
        self.assertEqual(session.run(grow), [1, 2])
        assigns = [
            e for e in session.trace.to_dict()["events"] if e["type"] == "assign"
        ]
        self.assertTrue(any(e["data"]["name"] == "xs" and e["data"]["value"] == [1, 2] for e in assigns))

    def test_requires_metadata_or_trace(self) -> None:
        with self.assertRaises(TraceError):
            InstrumentationSession(algorithm="x")

    def test_manual_trace_still_importable(self) -> None:
        tr = Trace(algorithm="manual", metadata={"initial": {"array": [1, 2]}})
        tr.assign("x", 1)
        doc = tr.to_dict()
        self.assertEqual(len(doc["events"]), 1)


if __name__ == "__main__":
    unittest.main()
