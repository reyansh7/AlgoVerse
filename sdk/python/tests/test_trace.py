"""Unit tests for the AlgoVerse Python Trace recorder (v0.1)."""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from algoverse import Trace, TraceError


class TraceRecorderTests(unittest.TestCase):
    def test_constructor_requires_metadata_initial_array(self) -> None:
        with self.assertRaises(TraceError) as ctx:
            Trace(algorithm="x")
        self.assertIn("metadata=", str(ctx.exception))
        self.assertIn("initial", str(ctx.exception))

    def test_constructor_rejects_non_list_array(self) -> None:
        with self.assertRaises(TraceError):
            Trace(algorithm="x", metadata={"initial": {"array": "nope"}})

    def test_constructor_rejects_empty_algorithm(self) -> None:
        with self.assertRaises(TraceError):
            Trace(algorithm="", metadata={"initial": {"array": [1]}})

    def test_seven_event_types_and_write(self) -> None:
        tr = Trace(
            algorithm="demo_sort",
            source_path="demo.py",
            source_code="def demo():\n    pass\n",
            metadata={"initial": {"array": [3, 1]}},
        )
        tr.call("demo", args={"n": 2}, line=1)
        tr.assign("array", [3, 1], line=1)
        tr.compare(0, 1, values=[3, 1], line=2)
        tr.swap(0, 1, line=3)
        tr.assign("array", [1, 3], line=3)
        tr.highlight(indices=[0, 1], kinds={0: "sorted", 1: "sorted"}, sorted=[0, 1])
        tr.line(4)
        tr.return_("demo", value=[1, 3], line=4)

        doc = tr.to_dict()
        self.assertEqual(doc["version"], "0.1")
        self.assertEqual(doc["language"], "python")
        self.assertEqual(doc["metadata"]["initial"]["array"], [3, 1])
        types = [e["type"] for e in doc["events"]]
        self.assertEqual(
            types,
            [
                "call",
                "assign",
                "compare",
                "swap",
                "assign",
                "highlight",
                "line",
                "return",
            ],
        )

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "demo.trace.json"
            written = tr.write(out)
            self.assertTrue(written.is_file())
            loaded = json.loads(written.read_text(encoding="utf-8"))
            self.assertEqual(len(loaded["events"]), 8)
            self.assertEqual(loaded["metadata"]["initial"]["array"], [3, 1])

    def test_fluent_chaining(self) -> None:
        tr = Trace(algorithm="chain", metadata={"initial": {"array": [1]}})
        result = tr.assign("x", 1).compare(0, 0).highlight(clear=True)
        self.assertIs(result, tr)
        self.assertEqual(len(tr.to_dict()["events"]), 3)

    def test_kinds_keys_are_stringified(self) -> None:
        tr = Trace(algorithm="h", metadata={"initial": {"array": [1, 2]}})
        tr.highlight(kinds={0: "comparing", 1: "comparing"})
        kinds = tr.to_dict()["events"][0]["data"]["kinds"]
        self.assertEqual(kinds, {"0": "comparing", "1": "comparing"})

    def test_write_rejects_non_json_values(self) -> None:
        tr = Trace(algorithm="bad", metadata={"initial": {"array": [1]}})
        tr.assign("x", {1, 2, 3})
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(TraceError) as ctx:
                tr.write(Path(tmp) / "out.trace.json")
            self.assertIn("JSON-serializable", str(ctx.exception))

    def test_write_uses_algoverse_trace_out(self) -> None:
        tr = Trace(algorithm="env", metadata={"initial": {"array": [0]}})
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "from_env.trace.json"
            with mock.patch.dict(os.environ, {"ALGOVERSE_TRACE_OUT": str(target)}):
                written = tr.write()
            self.assertEqual(written, target.resolve())
            self.assertTrue(target.is_file())

    def test_return_without_value_omits_value_key(self) -> None:
        tr = Trace(algorithm="r", metadata={"initial": {"array": [1]}})
        tr.return_("r")
        data = tr.to_dict()["events"][0]["data"]
        self.assertEqual(data["frame"], "r")
        self.assertNotIn("value", data)

    def test_default_write_path_uses_algorithm_name(self) -> None:
        tr = Trace(algorithm="named_algo", metadata={"initial": {"array": [1]}})
        with tempfile.TemporaryDirectory() as tmp:
            old = os.getcwd()
            try:
                os.chdir(tmp)
                os.environ.pop("ALGOVERSE_TRACE_OUT", None)
                written = tr.write()
                self.assertEqual(written.name, "named_algo.trace.json")
                self.assertTrue(written.is_file())
            finally:
                os.chdir(old)

    def test_constructor_rejects_missing_initial_key(self) -> None:
        with self.assertRaises(TraceError):
            Trace(algorithm="x", metadata={"other": True})


if __name__ == "__main__":
    unittest.main()
