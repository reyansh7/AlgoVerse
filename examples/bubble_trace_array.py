"""Bubble sort via TraceArray + InstrumentationSession (Sprint 3 milestone 2).

Structure bootstrap comes from TraceArray.tracked().
Swaps are detected by TraceArray; call/line/return come from InstrumentationSession.
Compare is still manual / deferred (Milestone 3+).

Run:
  pip install -e sdk/python
  python examples/bubble_trace_array.py

Play:
  npm run algoverse -- run examples/bubble_trace_array.py
"""

from __future__ import annotations

from algoverse import InstrumentationSession, TraceArray

ALGORITHM_SOURCE = """\
def bubble_sort(nums):
    n = len(nums)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
    return nums
"""


def bubble_sort(values: list[int]) -> list[int]:
    tr, nums = TraceArray.tracked(
        values,
        algorithm="bubble_sort",
        source_path="examples/bubble_trace_array.py",
        source_code=ALGORITHM_SOURCE,
    )

    def _bubble(a: TraceArray) -> TraceArray:
        n = len(a)
        for i in range(n - 1):
            for j in range(n - i - 1):
                if a[j] > a[j + 1]:
                    a[j], a[j + 1] = a[j + 1], a[j]
        return a

    session = InstrumentationSession(trace=tr)
    result = session.run(_bubble, nums)
    result.flush()
    tr.write()
    return result.to_list()


if __name__ == "__main__":
    out = bubble_sort([5, 1, 4, 2])
    print("result:", out)
