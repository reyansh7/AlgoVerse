"""Six canonical sorts — Array Plugin Core validation examples.

Run one:
  python examples/array_plugin/bubble.py

Or the suite:
  python -m unittest discover -s sdk/python/tests -p 'test_six_sorts.py' -v
"""

from __future__ import annotations

from algoverse import visualize


@visualize(write=False)
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


@visualize(write=False)
def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        m = i
        for j in range(i + 1, n):
            if arr[j] < arr[m]:
                m = j
        if m != i:
            arr[i], arr[m] = arr[m], arr[i]
    return arr


@visualize(write=False)
def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr


@visualize(write=False)
def quick_sort(arr):
    def partition(lo, hi):
        pivot = arr[hi]
        i = lo
        for j in range(lo, hi):
            if arr[j] <= pivot:
                arr[i], arr[j] = arr[j], arr[i]
                i += 1
        arr[i], arr[hi] = arr[hi], arr[i]
        return i

    def qs(lo, hi):
        if lo < hi:
            p = partition(lo, hi)
            qs(lo, p - 1)
            qs(p + 1, hi)

    if arr:
        qs(0, len(arr) - 1)
    return arr


@visualize(write=False)
def heap_sort(arr):
    n = len(arr)

    def sift(i, size):
        while True:
            largest = i
            l, r = 2 * i + 1, 2 * i + 2
            if l < size and arr[l] > arr[largest]:
                largest = l
            if r < size and arr[r] > arr[largest]:
                largest = r
            if largest == i:
                break
            arr[i], arr[largest] = arr[largest], arr[i]
            i = largest

    for i in range(n // 2 - 1, -1, -1):
        sift(i, n)
    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]
        sift(0, end)
    return arr


@visualize(write=False)
def merge_sort(arr):
    def sort_range(lo, hi):
        if hi - lo <= 1:
            return
        mid = (lo + hi) // 2
        sort_range(lo, mid)
        sort_range(mid, hi)
        left = [arr[i] for i in range(lo, mid)]
        right = [arr[i] for i in range(mid, hi)]
        i = j = 0
        k = lo
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                arr[k] = left[i]
                i += 1
            else:
                arr[k] = right[j]
                j += 1
            k += 1
        while i < len(left):
            arr[k] = left[i]
            i += 1
            k += 1
        while j < len(right):
            arr[k] = right[j]
            j += 1
            k += 1

    sort_range(0, len(arr))
    return arr


if __name__ == "__main__":
    data = [5, 1, 4, 2, 8, 0, 3]
    for name, fn in [
        ("bubble", bubble_sort),
        ("selection", selection_sort),
        ("insertion", insertion_sort),
        ("quick", quick_sort),
        ("heap", heap_sort),
        ("merge", merge_sort),
    ]:
        out = fn(list(data))
        print(f"{name}: {out}")
        assert out == sorted(data), name
    print("ok — six sorts")
