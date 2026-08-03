"""Unit tests for the AlgoVerse Python Trace recorder (v0.1)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from algoverse import Trace


class TraceRecorderTests(unittest.TestCase):
    def test_requires_metadata_initial_array(self) -> None:
        tr = Trace(algorithm="x")
        with self.assertRaises(ValueError):
            tr.to_dict()

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


if __name__ == "__main__":
    unittest.main()
