import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

export const validParenthesesStack: ReferenceSolution<{ s: string }> = {
  id: "20-stack",
  name: "Stack Matching",
  approach: "iterative",
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  code: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  for (const ch of s) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (stack.pop() !== map[ch]) return false;
  }
  return stack.length === 0;
}`,
  execute({ s }) {
    const r = new EventRecorder("20-stack");
    const chars = s.split("");
    const stack: string[] = [];
    r.setStructure(
      { array: chars, stack: [] },
      { description: "Validate parentheses with a stack." },
    );

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      r.movePointer("i", i);
      r.highlight({
        kinds: { [i]: "current" },
        description: `Process '${ch}'.`,
      });
      if ("([{".includes(ch)) {
        stack.push(ch);
        r.push(ch, { description: `Push '${ch}'.` });
        r.setStructure({ array: chars, stack: [...stack] });
      } else {
        const top = stack.pop();
        r.pop(top, { description: `Pop '${top}' for closing '${ch}'.` });
        r.setStructure({ array: chars, stack: [...stack] });
        if (top !== pairs[ch]) {
          r.highlight({
            kinds: { [i]: "swapped" },
            description: `Mismatch — expected pair for '${ch}'.`,
          });
          r.returnValue(false);
          r.done(false);
          return r.getEvents();
        }
      }
    }
    const ok = stack.length === 0;
    r.returnValue(ok, {
      description: ok ? "Stack empty — valid." : "Stack not empty — invalid.",
    });
    r.done(ok);
    return r.getEvents();
  },
};
