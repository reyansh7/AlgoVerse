"""Bubble sort via @visualize (Sprint 3 milestone 3).

Run:
  pip install -e sdk/python
  python examples/bubble_visualize.py

Optional player (with `npm run dev` running):
  set ALGOVERSE_OPEN_PLAYER=1
  python examples/bubble_visualize.py

Or:
  npm run algoverse -- run examples/bubble_visualize.py
"""

from __future__ import annotations

from algoverse import visualize


@visualize
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


if __name__ == "__main__":
    result = bubble_sort([5, 4, 3, 2])
    print("result:", result)
    print("trace:", bubble_sort.last_path)
