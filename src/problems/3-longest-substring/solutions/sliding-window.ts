import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export const slidingWindowSolution: ReferenceSolution<{ s: string }> = {
  id: "3-sliding-window",
  name: "Sliding Window",
  approach: "optimal",
  timeComplexity: "O(n)",
  spaceComplexity: "O(min(n, Σ))",
  code: `function lengthOfLongestSubstring(s: string): number {
  const seen = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right])! >= left) {
      left = seen.get(s[right])! + 1;
    }
    seen.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
  execute({ s }) {
    const r = new EventRecorder("3-sliding-window");
    const chars = s.split("");
    const seen: Record<string, number> = {};
    let left = 0;
    let best = 0;
    r.setStructure(
      { array: chars, hashmap: {} },
      { description: "Sliding window for longest unique substring." },
    );

    for (let right = 0; right < chars.length; right++) {
      const ch = chars[right];
      r.movePointer("right", right);
      r.movePointer("left", left);
      if (ch in seen && seen[ch] >= left) {
        left = seen[ch] + 1;
        r.movePointer("left", left, {
          description: `Duplicate '${ch}' — move left to ${left}.`,
        });
      }
      seen[ch] = right;
      best = Math.max(best, right - left + 1);
      const kinds: Record<number, "searching" | "current" | "left" | "right"> = {};
      for (let i = left; i <= right; i++) kinds[i] = "searching";
      kinds[left] = "left";
      kinds[right] = "right";
      r.setStructure({ array: chars, hashmap: { ...seen } });
      r.highlight({
        kinds,
        line: 6,
        description: `Window [${left}, ${right}] = "${s.slice(left, right + 1)}" best=${best}.`,
      });
      r.updateVariable("best", best);
    }
    r.returnValue(best);
    r.done(best);
    return r.getEvents();
  },
};
