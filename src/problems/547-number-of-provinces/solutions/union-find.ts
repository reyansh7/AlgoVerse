import { EventRecorder } from "@/engine/events/recorder";
import type { ReferenceSolution } from "@/problems/types";

export const unionFindProvinces: ReferenceSolution<{ isConnected: number[][] }> = {
  id: "547-uf",
  name: "Union-Find",
  approach: "optimal",
  timeComplexity: "O(n² α(n))",
  spaceComplexity: "O(n)",
  code: `function findCircleNum(isConnected: number[][]): number {
  const n = isConnected.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number =>
    parent[x] === x ? x : (parent[x] = find(parent[x]));
  let provinces = n;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isConnected[i][j] && find(i) !== find(j)) {
        parent[find(i)] = find(j);
        provinces--;
      }
    }
  }
  return provinces;
}`,
  execute({ isConnected }) {
    const r = new EventRecorder("547-uf");
    const n = isConnected.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    let provinces = n;
    const nodes = Array.from({ length: n }, (_, i) => ({
      id: String(i),
      label: i,
      x: Math.cos((i / n) * Math.PI * 2),
      y: Math.sin((i / n) * Math.PI * 2),
    }));
    const edges: { id: string; from: string; to: string }[] = [];

    r.setStructure(
      { graph: { nodes, edges }, array: [...parent] },
      { description: `${n} cities — initially ${provinces} provinces.` },
    );
    r.updateVariable("provinces", provinces);

    const find = (x: number): number =>
      parent[x] === x ? x : (parent[x] = find(parent[x]));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!isConnected[i][j]) continue;
        r.compare({
          nodes: [String(i), String(j)],
          description: `Cities ${i} and ${j} are connected.`,
        });
        const pi = find(i);
        const pj = find(j);
        if (pi !== pj) {
          parent[pi] = pj;
          provinces--;
          edges.push({ id: `${i}-${j}`, from: String(i), to: String(j) });
          r.setStructure({
            graph: { nodes, edges: [...edges] },
            array: [...parent],
          });
          r.updateVariable("provinces", provinces, {
            description: `Union ${i} and ${j} → ${provinces} provinces.`,
          });
        }
      }
    }
    r.returnValue(provinces);
    r.done(provinces);
    return r.getEvents();
  },
};
