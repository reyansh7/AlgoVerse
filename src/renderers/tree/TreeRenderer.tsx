"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { ExecutionState } from "@/core/types/execution";
import type { TreeNode } from "@/core/types/structures";

interface Props {
  state: ExecutionState | null;
}

interface LaidOut {
  id: string;
  value: number | string;
  col: number;
  depth: number;
  parentId?: string;
}

const VB_W = 640;
const VB_H = 420;
const R = 22;
const PAD_X = 48;
const PAD_Y = 44;

/** In-order column layout — stable parent/child geometry for BSTs. */
function layoutTree(root: TreeNode | null | undefined): LaidOut[] {
  const nodes: LaidOut[] = [];
  if (!root) return nodes;
  let col = 0;

  function walk(node: TreeNode, depth: number, parentId?: string) {
    if (node.left) walk(node.left, depth + 1, node.id);
    nodes.push({
      id: node.id,
      value: node.value,
      col: col++,
      depth,
      parentId,
    });
    if (node.right) walk(node.right, depth + 1, node.id);
  }

  walk(root, 0);
  return nodes;
}

function positions(laidOut: LaidOut[]) {
  const n = laidOut.length;
  const maxDepth = laidOut.reduce((m, node) => Math.max(m, node.depth), 0);
  const usableW = VB_W - PAD_X * 2;
  const usableH = VB_H - PAD_Y * 2;
  const map = new Map<string, { cx: number; cy: number }>();

  for (const node of laidOut) {
    const cx =
      n <= 1 ? VB_W / 2 : PAD_X + (node.col / Math.max(n - 1, 1)) * usableW;
    const cy =
      maxDepth === 0
        ? PAD_Y + usableH * 0.15
        : PAD_Y + (node.depth / maxDepth) * usableH;
    map.set(node.id, { cx, cy });
  }

  return map;
}

export function TreeRenderer({ state }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tree = state?.structures.tree;
  const step = state?.step ?? -1;

  const laidOut = useMemo(() => layoutTree(tree ?? null), [tree]);
  const pos = useMemo(() => positions(laidOut), [laidOut]);
  const highlights = useMemo(
    () => new Set(state?.highlights.nodes ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );

  // Pulse active node radius only — never CSS-transform the <g>, or edges detach.
  useLayoutEffect(() => {
    if (!svgRef.current || step < 0) return;
    const circles = svgRef.current.querySelectorAll<SVGCircleElement>(
      "circle[data-node-active='true']",
    );
    if (!circles.length) return;

    gsap.killTweensOf(circles);
    gsap.fromTo(
      circles,
      { attr: { r: R * 0.85 } },
      {
        attr: { r: R * 1.2 },
        duration: 0.28,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          circles.forEach((c) => c.setAttribute("r", String(R)));
        },
      },
    );
  }, [step]);

  if (!tree) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-text-muted">
        Empty tree — the first insertion creates the root
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center p-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-full max-h-[480px] w-full max-w-3xl"
        role="img"
        aria-label="Binary search tree visualization"
      >
        <defs>
          <filter id="bst-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {laidOut.map((node) => {
          if (!node.parentId) return null;
          const parentPos = pos.get(node.parentId);
          const childPos = pos.get(node.id);
          if (!parentPos || !childPos) return null;

          // Light edge only when this child (or its parent) is the active highlight
          const lit =
            highlights.has(node.id) || highlights.has(node.parentId);

          return (
            <line
              key={`e-${node.parentId}-${node.id}`}
              x1={parentPos.cx}
              y1={parentPos.cy}
              x2={childPos.cx}
              y2={childPos.cy}
              stroke={lit ? "#2ee6a6" : "#3a4a63"}
              strokeWidth={lit ? 2.8 : 1.6}
              strokeOpacity={lit ? 1 : 0.7}
              strokeLinecap="round"
            />
          );
        })}

        {laidOut.map((node) => {
          const p = pos.get(node.id);
          if (!p) return null;
          const active = highlights.has(node.id);

          return (
            <g key={node.id} filter={active ? "url(#bst-glow)" : undefined}>
              <circle
                data-node-active={active ? "true" : "false"}
                cx={p.cx}
                cy={p.cy}
                r={R}
                fill={active ? "#2ee6a6" : "#152033"}
                stroke={active ? "#eafff7" : "#3ecbff"}
                strokeWidth={active ? 3 : 2}
              />
              <text
                x={p.cx}
                y={p.cy + 5}
                textAnchor="middle"
                fill="#e8eef7"
                fontSize="13"
                fontWeight="600"
                fontFamily="ui-monospace, monospace"
                style={{ pointerEvents: "none" }}
              >
                {String(node.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
