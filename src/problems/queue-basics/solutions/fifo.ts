import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export const queueFifo: ReferenceSolution<{ s: string }> = {
  id: "queue-fifo",
  name: "FIFO Enqueue/Dequeue",
  approach: "iterative",
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  code: `function demo(values: string[]) {
  const q: string[] = [];
  for (const v of values) q.push(v);
  while (q.length) q.shift();
}`,
  execute({ s }) {
    const r = new EventRecorder("queue-fifo");
    const values = s.split("");
    const q: string[] = [];
    r.setStructure({ array: values, queue: [] }, { description: "Queue is FIFO." });
    for (const v of values) {
      q.push(v);
      r.enqueue(v, { description: `Enqueue '${v}'.` });
      r.setStructure({ array: values, queue: [...q] });
    }
    while (q.length) {
      const v = q.shift()!;
      r.dequeue(v, { description: `Dequeue '${v}'.` });
      r.setStructure({ array: values, queue: [...q] });
    }
    r.done();
    return r.getEvents();
  },
};
