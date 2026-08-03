"""Instrumented bubble sort — AlgoVerse v0.1 example.

Structure bootstrap is metadata.initial.array only.
assign("array", ...) updates the Variables panel; it does not seed structures.

Run:
  pip install -e sdk/python
  python examples/bubble.py

Or via CLI (opens Trace Player when Next is running):
  npm run algoverse -- run examples/bubble.py
"""

from __future__ import annotations

from algoverse import Trace

# Shown in the Trace Player — line numbers match tr.*(line=N) below.
ALGORITHM_SOURCE = """\
def bubble_sort(nums):
    n = len(nums)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
    return nums
"""


def bubble_sort(nums: list[int]) -> list[int]:
    tr = Trace(
        algorithm="bubble_sort",
        source_path="examples/bubble.py",
        source_code=ALGORITHM_SOURCE,
        metadata={"initial": {"array": list(nums)}},
    )

    a = list(nums)
    n = len(a)
    tr.call("bubble_sort", args={"n": n}, line=1, description="Enter bubble_sort")
    tr.assign("array", list(a), line=1)

    for i in range(n - 1):
        tr.assign("i", i, line=3)
        for j in range(n - i - 1):
            tr.assign("j", j, line=4)
            tr.compare(
                j,
                j + 1,
                values=[a[j], a[j + 1]],
                line=5,
                description=f"Compare {a[j]} and {a[j + 1]}",
            )
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                tr.swap(j, j + 1, line=6, description=f"Swap indices {j} and {j + 1}")
                tr.assign("array", list(a), line=6)

        sorted_idx = list(range(n - i - 1, n))
        tr.highlight(
            indices=sorted_idx,
            kinds={k: "sorted" for k in sorted_idx},
            sorted=sorted_idx,
            line=3,
            description=f"Pass {i} complete",
        )

    all_sorted = list(range(n))
    tr.highlight(
        indices=all_sorted,
        kinds={k: "sorted" for k in all_sorted},
        sorted=all_sorted,
        description="Array sorted",
    )
    tr.return_("bubble_sort", value=list(a), line=7, description="Return sorted array")
    tr.write()
    return a


if __name__ == "__main__":
    result = bubble_sort([5, 1, 4, 2])
    print("result:", result)
