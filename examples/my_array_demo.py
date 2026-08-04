"""Personal playground — random array algorithm with @visualize.

This is a slightly quirky in-place "cocktail + selection" hybrid so you can
see compares, swaps, and assigns in the Trace Player — not a textbook sort.

How to visualize
----------------
1. From the AlgoVerse repo root:

       pip install -e sdk/python
       python examples/my_array_demo.py

2. That writes ``my_array_demo.trace.json`` in the current directory
   (or whatever ``ALGOVERSE_TRACE_OUT`` is set to).

3. Start the web app (another terminal):

       npm run dev

4. Open the Trace Player and load the file:

       http://localhost:3000/trace

   Use **Upload** and pick ``my_array_demo.trace.json``,
   or drag the file onto the stage.

Optional — auto-open the player after write (dev server must be running):

       # PowerShell
       $env:ALGOVERSE_OPEN_PLAYER="1"
       python examples/my_array_demo.py

Or via the CLI (runs the script and opens /trace when Next is up):

       npm run algoverse -- run examples/my_array_demo.py
"""

from __future__ import annotations

from algoverse import visualize


@visualize(algorithm="my_array_demo", open_player=False)
def scramble_then_settle(arr):
    """Mess with the array, then settle it with a cocktail-style pass.

    Steps you should see in the Player:
    - early swaps (scramble)
    - compares + swaps (bidirectional bubble)
    - final quiet passes when already ordered
    """
    n = len(arr)
    if n < 2:
        return arr

    # --- scramble: swap every other pair ---
    for i in range(0, n - 1, 2):
        if arr[i] < arr[i + 1]:
            arr[i], arr[i + 1] = arr[i + 1], arr[i]

    # --- settle: cocktail shaker until quiet ---
    left, right = 0, n - 1
    swapped = True
    while swapped and left < right:
        swapped = False
        for i in range(left, right):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
        right -= 1
        if not swapped:
            break
        swapped = False
        for i in range(right, left, -1):
            if arr[i - 1] > arr[i]:
                arr[i - 1], arr[i] = arr[i], arr[i - 1]
                swapped = True
        left += 1

    return arr


if __name__ == "__main__":
    data = [7, 2, 9, 1, 5, 8, 3, 6, 4]
    print("input: ", data)
    result = scramble_then_settle(list(data))
    print("result:", result)
    print("trace: ", scramble_then_settle.last_path)
    print()
    print("Next: npm run dev  →  http://localhost:3000/trace  →  Upload the .trace.json")
