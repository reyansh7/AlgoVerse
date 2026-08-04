"""Bubble sort via @visualize (Milestone 3).

Run (no npm / no CLI)::

  pip install -e sdk/python
  python examples/bubble_visualize.py

This starts the embedded Visualization Service on http://localhost:3210,
pushes the Trace over HTTP, and opens your browser.

Disable the player for headless runs::

  set ALGOVERSE_NO_PLAYER=1
  python examples/bubble_visualize.py

Optional disk write::

  @visualize(write=True)
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
    if bubble_sort.last_player_url:
        print("player:", bubble_sort.last_player_url)
    if bubble_sort.last_path:
        print("trace file:", bubble_sort.last_path)
