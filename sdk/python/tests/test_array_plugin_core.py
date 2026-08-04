"""Array Plugin Core — list ops needed by the six-sort suite."""

from __future__ import annotations

import unittest

from algoverse import TraceArray


def _types(tr) -> list[str]:
    return [e["type"] for e in tr.to_dict()["events"]]


class ArrayPluginCoreTests(unittest.TestCase):
    def test_append_extend_pop(self) -> None:
        tr, arr = TraceArray.tracked([1], algorithm="ops", sync_assign=True)
        arr.append(2)
        arr.extend([3, 4])
        self.assertEqual(arr.to_list(), [1, 2, 3, 4])
        self.assertEqual(arr.pop(), 4)
        self.assertEqual(arr.to_list(), [1, 2, 3])
        types = _types(tr)
        self.assertIn("assign", types)
        self.assertIn("highlight", types)

    def test_negative_index_and_compare(self) -> None:
        tr, arr = TraceArray.tracked([9, 3, 1], algorithm="cmp")
        _ = arr[-1]
        _ = arr[-2]
        self.assertIn("compare", _types(tr))
        compares = [e for e in tr.to_dict()["events"] if e["type"] == "compare"]
        self.assertTrue(compares)
        data = compares[-1]["data"]
        self.assertEqual({data["i"], data["j"]}, {1, 2})

    def test_slice_assign(self) -> None:
        tr, arr = TraceArray.tracked([5, 4, 3, 2], algorithm="slice")
        arr[:] = [1, 2, 3, 4]
        self.assertEqual(arr.to_list(), [1, 2, 3, 4])
        self.assertIn("assign", _types(tr))
        self.assertEqual(tr.metadata["initial"]["array"], [5, 4, 3, 2])

    def test_reverse_is_single_assign(self) -> None:
        tr, arr = TraceArray.tracked([1, 2, 3], algorithm="rev")
        arr.reverse()
        self.assertEqual(arr.to_list(), [3, 2, 1])
        self.assertNotIn("swap", _types(tr))
        self.assertIn("assign", _types(tr))

    def test_swap_still_works(self) -> None:
        tr, arr = TraceArray.tracked([2, 1], algorithm="sw")
        arr[0], arr[1] = arr[1], arr[0]
        self.assertEqual(arr.to_list(), [1, 2])
        self.assertIn("swap", _types(tr))
        self.assertIn("compare", _types(tr))  # paired reads before swap

    def test_out_of_range(self) -> None:
        _, arr = TraceArray.tracked([1], algorithm="x")
        with self.assertRaises(IndexError):
            _ = arr[5]


if __name__ == "__main__":
    unittest.main()
