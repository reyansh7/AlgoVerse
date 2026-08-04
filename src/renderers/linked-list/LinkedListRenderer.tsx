"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { ExecutionState } from "@/core/types/execution";

interface Props {
  state: ExecutionState | null;
}

const NODE_W = 84;
const ARROW_W = 34;
const SLOT = NODE_W + ARROW_W;

export function LinkedListRenderer({ state }: Props) {
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const arrowRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const cursorRef = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string>>(new Set());

  const list = state?.structures.linkedList;
  const step = state?.step;
  const highlights = useMemo(
    () => new Set(state?.highlights.nodes ?? []),
    [state?.highlights.nodes],
  );

  const ordered = useMemo(() => {
    if (!list) return [];
    const map = new Map(list.nodes.map((n) => [n.id, n]));
    const result = [];
    let cur = list.head;
    const guard = new Set<string>();
    while (cur && map.has(cur) && !guard.has(cur)) {
      guard.add(cur);
      const node = map.get(cur)!;
      result.push(node);
      cur = node.next ?? null;
    }
    return result;
  }, [list]);

  const cursorIndex = ordered.findIndex((n) => highlights.has(n.id));

  useLayoutEffect(() => {
    if (step === undefined) return;

    ordered.forEach((node, index) => {
      const el = nodeRefs.current.get(node.id);
      if (!el) return;
      const targetX = index * SLOT;
      const isNew = !seen.current.has(node.id);
      seen.current.add(node.id);

      if (isNew) {
        gsap.killTweensOf(el);
        gsap.fromTo(
          el,
          { x: targetX, y: -40, opacity: 0, scale: 0.7 },
          {
            x: targetX,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
          },
        );
      } else {
        gsap.to(el, {
          x: targetX,
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      }

      const arrow = arrowRefs.current.get(node.id);
      if (arrow) {
        gsap.to(arrow, {
          x: targetX + NODE_W,
          opacity: index < ordered.length - 1 ? 1 : 0,
          duration: 0.45,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      }
    });

    // prune ids that no longer exist so re-insertions pop again
    const live = new Set(ordered.map((n) => n.id));
    for (const id of [...seen.current]) {
      if (!live.has(id)) seen.current.delete(id);
    }

    if (cursorRef.current) {
      if (cursorIndex >= 0) {
        gsap.to(cursorRef.current, {
          x: cursorIndex * SLOT + NODE_W / 2 - 14,
          opacity: 1,
          duration: 0.42,
          ease: "back.out(1.8)",
          overwrite: "auto",
        });
      } else {
        gsap.to(cursorRef.current, {
          opacity: 0,
          duration: 0.2,
          overwrite: "auto",
        });
      }
    }
  }, [step, ordered, cursorIndex]);

  if (!list) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-text-muted">
        No linked list in current state
      </div>
    );
  }

  const trackWidth = Math.max(ordered.length * SLOT, 120);

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-x-auto px-8">
      <div className="relative shrink-0" style={{ width: trackWidth, height: 170 }}>
        <span className="absolute left-0 top-[86px] -translate-x-full pr-3 font-mono text-xs text-accent-2">
          head
        </span>

        {/* travelling pointer */}
        <div
          ref={cursorRef}
          className="absolute top-6 opacity-0 will-change-transform"
          style={{ left: 0 }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="rounded-md border border-accent/50 bg-accent/15 px-2 py-0.5 font-mono text-[10px] text-accent">
              ptr
            </span>
            <span className="text-accent">▼</span>
          </div>
        </div>

        {ordered.map((node) => {
          const active = highlights.has(node.id);
          return (
            <div key={node.id}>
              <div
                ref={(el) => {
                  if (el) nodeRefs.current.set(node.id, el);
                  else nodeRefs.current.delete(node.id);
                }}
                className={cn(
                  "absolute top-[68px] flex flex-col items-center rounded-xl border py-3 will-change-transform",
                  "transition-[border-color,background-color,color,box-shadow] duration-300",
                  active
                    ? "border-accent bg-accent/20 text-accent shadow-[0_0_26px_rgba(46,230,166,0.45)]"
                    : "border-border-glass bg-white/5 text-text-primary",
                )}
                style={{ width: NODE_W, left: 0 }}
              >
                <span className="font-mono text-lg font-semibold">
                  {node.value}
                </span>
                <span className="text-[10px] text-text-muted">{node.id}</span>
              </div>
              <span
                ref={(el) => {
                  if (el) arrowRefs.current.set(node.id, el);
                  else arrowRefs.current.delete(node.id);
                }}
                className="absolute top-[90px] text-center text-lg text-accent-2/80 will-change-transform"
                style={{ width: ARROW_W, left: 0 }}
              >
                →
              </span>
            </div>
          );
        })}

        <span
          className="absolute top-[88px] font-mono text-sm text-text-muted"
          style={{ left: ordered.length * SLOT }}
        >
          ∅
        </span>
      </div>
    </div>
  );
}
