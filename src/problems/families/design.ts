import { EventRecorder } from "@/engine/events/recorder";
import { createProblem, sol } from "@/problems/define";
import { showArray, showArrayMap } from "@/problems/lib/viz";
import type { ProblemPackage } from "@/problems/types";

type CacheOps = {
  ops: Array<{ op: string; key?: number; value?: number }>;
  capacity: number;
};

function showLruState(
  r: EventRecorder,
  order: number[],
  map: Record<string, number>,
  description: string,
  opts: { vars?: Record<string, unknown>; line?: number } = {},
) {
  r.setStructure(
    { array: [...order], hashmap: { ...map } },
    { line: opts.line, description },
  );
  if (opts.vars) {
    for (const [k, v] of Object.entries(opts.vars)) r.updateVariable(k, v);
  }
}

export const designFamily: ProblemPackage[] = [
  createProblem({
    id: 146,
    title: "LRU Cache",
    difficulty: "medium",
    category: "list",
    tags: ["design", "hashmap", "linked-list", "lru"],
    inputSchema: "list-ops",
    statement: `# 146. LRU Cache

Design a Least Recently Used cache with \`get\` and \`put\` in O(1). Evict the least recently used key when capacity is exceeded.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          capacity: 2,
          ops: [
            { op: "put", key: 1, value: 1 },
            { op: "put", key: 2, value: 2 },
            { op: "get", key: 1 },
            { op: "put", key: 3, value: 3 },
            { op: "get", key: 2 },
            { op: "put", key: 4, value: 4 },
            { op: "get", key: 1 },
            { op: "get", key: 3 },
            { op: "get", key: 4 },
          ],
        },
      },
    ],
    solutions: [
      sol<CacheOps>({
        id: "146-lru-map-order",
        name: "HashMap + Order List",
        time: "O(1) per op",
        space: "O(capacity)",
        code: `class LRUCache {
  cap: number; map = new Map<number, number>(); order: number[] = [];
  get(key: number) {
    if (!this.map.has(key)) return -1;
    this.order = this.order.filter(k => k !== key).concat(key);
    return this.map.get(key)!;
  }
  put(key: number, value: number) {
    if (this.map.has(key)) this.order = this.order.filter(k => k !== key);
    else if (this.order.length >= this.cap) {
      const evict = this.order.shift()!;
      this.map.delete(evict);
    }
    this.map.set(key, value);
    this.order.push(key);
  }
}`,
        execute({ capacity, ops }) {
          const r = new EventRecorder("146-lru-map-order");
          const map: Record<string, number> = {};
          const order: number[] = [];
          const results: unknown[] = [];
          showLruState(r, order, map, `LRU cache capacity=${capacity}. Order list = MRU→LRU.`, {
            vars: { capacity },
          });

          const touch = (key: number) => {
            const idx = order.indexOf(key);
            if (idx >= 0) order.splice(idx, 1);
            order.push(key);
          };

          for (const op of ops) {
            if (op.op === "get" && op.key !== undefined) {
              const key = op.key;
              showLruState(r, order, map, `get(${key}): lookup in map.`, {
                line: 3,
                vars: { key },
              });
              if (!(String(key) in map)) {
                showLruState(r, order, map, `Key ${key} missing → return -1.`, {});
                results.push(-1);
              } else {
                touch(key);
                const val = map[String(key)];
                showLruState(
                  r,
                  order,
                  map,
                  `Hit ${key}=${val}. Move to MRU (end of order).`,
                  { vars: { result: val } },
                );
                results.push(val);
              }
            } else if (op.op === "put" && op.key !== undefined && op.value !== undefined) {
              const { key, value } = op;
              showLruState(r, order, map, `put(${key}, ${value}).`, {
                line: 8,
                vars: { key, value },
              });
              if (String(key) in map) {
                touch(key);
                map[String(key)] = value;
                showLruState(r, order, map, `Update existing key ${key}=${value}.`, {});
              } else {
                if (order.length >= capacity) {
                  const evict = order.shift()!;
                  delete map[String(evict)];
                  showLruState(
                    r,
                    order,
                    map,
                    `At capacity — evict LRU key ${evict}.`,
                    { vars: { evicted: evict } },
                  );
                }
                map[String(key)] = value;
                order.push(key);
                showLruState(r, order, map, `Insert ${key}=${value} as MRU.`, {});
              }
            }
          }
          r.returnValue(results, { description: `Operation results: [${results.join(", ")}].` });
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),

  createProblem({
    id: 460,
    title: "LFU Cache",
    difficulty: "hard",
    category: "heap",
    tags: ["design", "hashmap", "lfu"],
    inputSchema: "list-ops",
    statement: `# 460. LFU Cache

Design a Least Frequently Used cache. Evict the least frequently used key; on ties evict the least recently used.`,
    testcases: [
      {
        label: "Example 1",
        input: {
          capacity: 2,
          ops: [
            { op: "put", key: 1, value: 1 },
            { op: "put", key: 2, value: 2 },
            { op: "get", key: 1 },
            { op: "put", key: 3, value: 3 },
            { op: "get", key: 2 },
            { op: "get", key: 3 },
            { op: "put", key: 4, value: 4 },
            { op: "get", key: 1 },
            { op: "get", key: 3 },
            { op: "get", key: 4 },
          ],
        },
      },
    ],
    solutions: [
      sol<CacheOps>({
        id: "460-lfu-freq-map",
        name: "Frequency Buckets",
        time: "O(1) amortized",
        space: "O(capacity)",
        code: `class LFUCache {
  cap: number; keyVal = new Map(); freq = new Map(); minF = 0;
  freqKeys = new Map<number, Set<number>>();
  get(key) { /* bump freq */ }
  put(key, val) { /* evict min freq LRU */ }
}`,
        execute({ capacity, ops }) {
          const r = new EventRecorder("460-lfu-freq-map");
          const keyVal: Record<string, number> = {};
          const freq: Record<string, number> = {};
          const freqKeys: Record<string, number[]> = {};
          let minF = 0;
          const results: unknown[] = [];

          const mapForViz = () => {
            const m: Record<string, number | string> = {};
            for (const k of Object.keys(keyVal)) {
              m[k] = `${keyVal[k]}@f${freq[k] ?? 0}`;
            }
            return m;
          };

          const touch = (key: number) => {
            const ks = String(key);
            const f = freq[ks] ?? 0;
            const bucket = freqKeys[String(f)] ?? [];
            freqKeys[String(f)] = bucket.filter((k) => k !== key);
            freq[ks] = f + 1;
            if (!freqKeys[String(f + 1)]) freqKeys[String(f + 1)] = [];
            freqKeys[String(f + 1)].push(key);
            if (minF === f && (freqKeys[String(f)]?.length ?? 0) === 0) minF = f + 1;
          };

          showArrayMap(
            r,
            Object.keys(keyVal).map(Number),
            mapForViz(),
            `LFU cache capacity=${capacity}. Track min frequency minF=${minF}.`,
            { vars: { capacity, minF } },
          );

          for (const op of ops) {
            if (op.op === "get" && op.key !== undefined) {
              const key = op.key;
              showArrayMap(r, Object.keys(keyVal).map(Number), mapForViz(), `get(${key}).`, {
                vars: { key, minF },
              });
              if (!(String(key) in keyVal)) {
                results.push(-1);
                showArrayMap(r, Object.keys(keyVal).map(Number), mapForViz(), `Miss → -1.`, {});
              } else {
                touch(key);
                results.push(keyVal[String(key)]);
                showArrayMap(
                  r,
                  Object.keys(keyVal).map(Number),
                  mapForViz(),
                  `Hit ${key}=${keyVal[String(key)]}. Increment freq → f${freq[String(key)]}. minF=${minF}.`,
                  { vars: { minF } },
                );
              }
            } else if (op.op === "put" && op.key !== undefined && op.value !== undefined) {
              const { key, value } = op;
              showArrayMap(
                r,
                Object.keys(keyVal).map(Number),
                mapForViz(),
                `put(${key}, ${value}).`,
                { vars: { key, value } },
              );
              if (String(key) in keyVal) {
                keyVal[String(key)] = value;
                touch(key);
                showArrayMap(r, Object.keys(keyVal).map(Number), mapForViz(), `Update + bump freq.`, {});
              } else {
                if (Object.keys(keyVal).length >= capacity) {
                  const bucket = freqKeys[String(minF)] ?? [];
                  const evict = bucket.shift()!;
                  delete keyVal[String(evict)];
                  delete freq[String(evict)];
                  showArrayMap(
                    r,
                    Object.keys(keyVal).map(Number),
                    mapForViz(),
                    `Full — evict LFU key ${evict} at minF=${minF}.`,
                    { vars: { evicted: evict, minF } },
                  );
                }
                keyVal[String(key)] = value;
                freq[String(key)] = 1;
                if (!freqKeys["1"]) freqKeys["1"] = [];
                freqKeys["1"].push(key);
                minF = 1;
                showArrayMap(
                  r,
                  Object.keys(keyVal).map(Number),
                  mapForViz(),
                  `Insert ${key}=${value} at freq=1. minF=1.`,
                  { vars: { minF } },
                );
              }
            }
          }
          r.returnValue(results);
          r.done(results);
          return r.getEvents();
        },
      }),
    ],
  }),
];
