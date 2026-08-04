"""Tests for @visualize (Sprint 3 milestone 3)."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from algoverse import Trace, TraceError, visualize


class VisualizeDecoratorTests(unittest.TestCase):
    def test_bare_decorator_sorts_and_writes(self) -> None:
        @visualize(write=True, open_player=False)
        def bubble_sort(arr):
            n = len(arr)
            for i in range(n - 1):
                for j in range(n - i - 1):
                    if arr[j] > arr[j + 1]:
                        arr[j], arr[j + 1] = arr[j + 1], arr[j]
            return arr

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "bubble.trace.json"
            with mock.patch.dict(os.environ, {"ALGOVERSE_TRACE_OUT": str(out)}):
                result = bubble_sort([5, 4, 3, 2])

            self.assertEqual(result, [2, 3, 4, 5])
            self.assertTrue(out.is_file())
            self.assertIsNotNone(bubble_sort.last_trace)
            doc = bubble_sort.last_trace.to_dict()
            self.assertEqual(doc["algorithm"], "bubble_sort")
            self.assertEqual(doc["metadata"]["initial"]["array"], [5, 4, 3, 2])
            types = [e["type"] for e in doc["events"]]
            self.assertIn("call", types)
            self.assertIn("swap", types)
            self.assertIn("return", types)
            self.assertEqual(bubble_sort.last_path, out.resolve())

    def test_write_false_keeps_in_memory_only(self) -> None:
        @visualize(write=False)
        def identity(xs):
            return xs

        result = identity([1, 2])
        self.assertEqual(result, [1, 2])
        self.assertIsNotNone(identity.last_trace)
        self.assertIsNone(identity.last_path)
        self.assertTrue(any(e["type"] == "call" for e in identity.last_trace.to_dict()["events"]))

    def test_track_by_name(self) -> None:
        @visualize(write=False, track="nums")
        def scale(factor, nums):
            nums[0] = nums[0] * factor
            return nums

        out = scale(2, [3, 4])
        self.assertEqual(out, [6, 4])
        self.assertEqual(
            scale.last_trace.metadata["initial"]["array"],
            [3, 4],
        )

    def test_missing_list_raises(self) -> None:
        @visualize(write=False)
        def add(a, b):
            return a + b

        with self.assertRaises(TraceError):
            add(1, 2)

    def test_exception_restores_and_does_not_write(self) -> None:
        @visualize(write=True, open_player=False)
        def boom(arr):
            arr[0] = 9
            raise RuntimeError("fail")

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "boom.trace.json"
            with mock.patch.dict(os.environ, {"ALGOVERSE_TRACE_OUT": str(out)}):
                with self.assertRaises(RuntimeError):
                    boom([1, 2])
            self.assertFalse(out.exists())
            self.assertIsNotNone(boom.last_trace)
            self.assertIsNone(boom.last_path)

    def test_open_player_env_invokes_launcher(self) -> None:
        @visualize(write=True, open_player=False)
        def nop(arr):
            return list(arr)

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "nop.trace.json"
            with mock.patch.dict(
                os.environ,
                {"ALGOVERSE_TRACE_OUT": str(out), "ALGOVERSE_OPEN_PLAYER": "1"},
            ):
                with mock.patch(
                    "algoverse.instrument.visualize.try_open_trace_player",
                    return_value=True,
                ) as launch:
                    nop([1])
                launch.assert_called_once()

    def test_manual_trace_still_works(self) -> None:
        tr = Trace(algorithm="manual", metadata={"initial": {"array": [1]}})
        tr.assign("x", 1)
        self.assertEqual(len(tr.to_dict()["events"]), 1)

    def test_algorithm_override(self) -> None:
        @visualize(write=False, algorithm="custom_id")
        def sort_me(a):
            return a

        sort_me([2, 1])
        self.assertEqual(sort_me.last_trace.algorithm, "custom_id")


if __name__ == "__main__":
    unittest.main()
