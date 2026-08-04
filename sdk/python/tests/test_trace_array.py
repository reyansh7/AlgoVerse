"""Tests for TraceArray (Sprint 3 milestone 2)."""

from __future__ import annotations

import unittest

from algoverse import InstrumentationSession, Trace, TraceArray, TraceError


def _types(tr: Trace) -> list[str]:
    return [e["type"] for e in tr.to_dict()["events"]]


def _events_of(tr: Trace, type_: str) -> list[dict]:
    return [e for e in tr.to_dict()["events"] if e["type"] == type_]


class TraceArrayInitTests(unittest.TestCase):
    def test_tracked_seeds_metadata_independent_of_mutations(self) -> None:
        tr, arr = TraceArray.tracked([5, 1, 4, 2], algorithm="bubble")
        self.assertEqual(tr.metadata["initial"]["array"], [5, 1, 4, 2])
        arr[0] = 99
        arr.flush()
        # Bootstrap must stay frozen.
        self.assertEqual(tr.metadata["initial"]["array"], [5, 1, 4, 2])
        self.assertEqual(arr.to_list(), [99, 1, 4, 2])

    def test_seed_metadata_replaces_initial_array(self) -> None:
        tr = Trace(algorithm="x", metadata={"initial": {"array": [0]}})
        arr = TraceArray([7, 8], trace=tr, seed_metadata=True)
        self.assertEqual(tr.metadata["initial"]["array"], [7, 8])
        self.assertEqual(arr.to_list(), [7, 8])

    def test_requires_trace(self) -> None:
        with self.assertRaises(TraceError):
            TraceArray([1], trace=None)  # type: ignore[arg-type]

    def test_list_protocol(self) -> None:
        tr, arr = TraceArray.tracked([1, 2, 3], algorithm="x")
        self.assertEqual(len(arr), 3)
        self.assertEqual(list(arr), [1, 2, 3])
        self.assertEqual(arr, [1, 2, 3])


class TraceArrayReadWriteTests(unittest.TestCase):
    def test_reads_are_tracked_and_may_emit_compare(self) -> None:
        tr, arr = TraceArray.tracked([10, 20, 30], algorithm="x")
        self.assertEqual(arr[1], 20)
        self.assertEqual(arr[0], 10)
        self.assertEqual(arr.last_reads, ((1, 20), (0, 10)))
        self.assertEqual(arr.read_count, 2)
        # Paired distinct reads emit best-effort compare (Array Plugin Core).
        self.assertEqual(_types(tr), ["compare"])

    def test_single_write_emits_assign_on_flush(self) -> None:
        tr, arr = TraceArray.tracked([1, 2, 3], algorithm="x")
        arr[1] = 9
        self.assertEqual(_types(tr), [])  # pending until flush
        arr.flush()
        assigns = _events_of(tr, "assign")
        self.assertEqual(len(assigns), 1)
        self.assertEqual(assigns[0]["data"]["name"], "array")
        self.assertEqual(assigns[0]["data"]["value"], [1, 9, 3])
        self.assertNotIn("swap", _types(tr))

    def test_write_flushed_by_subsequent_read(self) -> None:
        tr, arr = TraceArray.tracked([1, 2], algorithm="x")
        arr[0] = 5
        _ = arr[1]
        self.assertEqual(_events_of(tr, "assign")[0]["data"]["value"], [5, 2])

    def test_sync_assign_false_skips_variable_snapshots(self) -> None:
        tr, arr = TraceArray.tracked(
            [1, 2], algorithm="x", sync_assign=False
        )
        arr[0], arr[1] = arr[1], arr[0]
        self.assertEqual(_types(tr), ["compare", "swap"])
        self.assertEqual(arr.to_list(), [2, 1])


class TraceArraySwapTests(unittest.TestCase):
    def test_tuple_unpack_swap(self) -> None:
        tr, arr = TraceArray.tracked([5, 1, 4], algorithm="x")
        arr[0], arr[1] = arr[1], arr[0]
        swaps = _events_of(tr, "swap")
        self.assertEqual(len(swaps), 1)
        self.assertEqual(swaps[0]["data"], {"i": 0, "j": 1})
        assigns = _events_of(tr, "assign")
        self.assertEqual(len(assigns), 1)
        self.assertEqual(assigns[0]["data"]["value"], [1, 5, 4])
        self.assertEqual(arr.to_list(), [1, 5, 4])

    def test_tmp_variable_swap_pattern(self) -> None:
        tr, arr = TraceArray.tracked([3, 1], algorithm="x")
        tmp = arr[0]
        arr[0] = arr[1]
        arr[1] = tmp
        self.assertEqual(_events_of(tr, "swap")[0]["data"], {"i": 0, "j": 1})
        self.assertEqual(arr.to_list(), [1, 3])

    def test_non_exchange_double_write_is_not_swap(self) -> None:
        tr, arr = TraceArray.tracked([1, 2, 3], algorithm="x")
        arr[0] = 9
        arr[1] = 8
        arr.flush()
        self.assertEqual(_events_of(tr, "swap"), [])
        values = [e["data"]["value"] for e in _events_of(tr, "assign")]
        self.assertIn([9, 2, 3], values)
        self.assertIn([9, 8, 3], values)


class TraceArraySessionTests(unittest.TestCase):
    def test_composes_with_instrumentation_session(self) -> None:
        tr, arr = TraceArray.tracked(
            [3, 1, 2],
            algorithm="sort_step",
            source_code="def sort_step(a):\n    if a[0] > a[1]:\n        a[0], a[1] = a[1], a[0]\n",
        )

        def sort_step(a: TraceArray) -> TraceArray:
            if a[0] > a[1]:
                a[0], a[1] = a[1], a[0]
            return a

        session = InstrumentationSession(trace=tr)
        out = session.run(sort_step, arr)
        self.assertEqual(out.to_list(), [1, 3, 2])

        types = _types(tr)
        self.assertEqual(types[0], "call")
        self.assertIn("line", types)
        self.assertIn("swap", types)
        self.assertEqual(types[-1], "return")
        # Structure proxy must not be deep-copied into assign-noise as a list.
        # Swaps own the array variable updates.
        self.assertTrue(any(e["type"] == "swap" for e in tr.to_dict()["events"]))
        self.assertEqual(tr.metadata["initial"]["array"], [3, 1, 2])

    def test_manual_trace_unchanged(self) -> None:
        tr = Trace(algorithm="manual", metadata={"initial": {"array": [1, 2]}})
        tr.swap(0, 1)
        tr.assign("array", [2, 1])
        doc = tr.to_dict()
        self.assertEqual(_types(tr), ["swap", "assign"])
        self.assertEqual(doc["metadata"]["initial"]["array"], [1, 2])


if __name__ == "__main__":
    unittest.main()
