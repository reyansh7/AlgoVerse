import type { HighlightKind } from "@/core/types/execution";
import type { EventRecorder } from "@/engine/events/recorder";
import type { TreeNode } from "@/core/types/structures";

/** Always pair structure + highlight + description for readable steps. */
export function showArray(
  r: EventRecorder,
  array: (number | string)[],
  description: string,
  opts: {
    line?: number;
    kinds?: Record<number, HighlightKind>;
    sorted?: number[];
    vars?: Record<string, unknown>;
  } = {},
) {
  r.setStructure({ array: [...array] }, { line: opts.line, description });
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) {
      r.updateVariable(k, v);
    }
  }
  r.highlight({
    kinds: opts.kinds ?? {},
    sorted: opts.sorted,
    line: opts.line,
    description,
  });
}

export function showArrayMap(
  r: EventRecorder,
  array: (number | string)[],
  hashmap: Record<string, number | string | null>,
  description: string,
  opts: {
    line?: number;
    kinds?: Record<number, HighlightKind>;
    vars?: Record<string, unknown>;
  } = {},
) {
  r.setStructure(
    { array: [...array], hashmap: { ...hashmap } },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
  r.highlight({
    kinds: opts.kinds ?? {},
    line: opts.line,
    description,
  });
}

export function treeFromLevelOrder(values: (number | null)[]): TreeNode | null {
  if (!values.length || values[0] == null) return null;
  const root: TreeNode = { id: "n0", value: values[0] };
  const queue: TreeNode[] = [root];
  let i = 1;
  let id = 1;
  while (queue.length && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length) {
      const v = values[i++];
      if (v != null) {
        node.left = { id: `n${id++}`, value: v };
        queue.push(node.left);
      }
    }
    if (i < values.length) {
      const v = values[i++];
      if (v != null) {
        node.right = { id: `n${id++}`, value: v };
        queue.push(node.right);
      }
    }
  }
  return root;
}

export function listFromArray(arr: number[]) {
  const nodes = arr.map((value, i) => ({
    id: `n${i}`,
    value,
    next: i < arr.length - 1 ? `n${i + 1}` : null,
  }));
  return { head: nodes.length ? ("n0" as string | null) : null, nodes };
}

export function kindsRange(
  lo: number,
  hi: number,
  kind: HighlightKind = "searching",
): Record<number, HighlightKind> {
  const k: Record<number, HighlightKind> = {};
  for (let i = lo; i <= hi; i++) k[i] = kind;
  return k;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
