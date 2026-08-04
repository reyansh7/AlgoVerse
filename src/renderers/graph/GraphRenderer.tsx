"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { ExecutionState } from "@/core/types/execution";
import { MOTION, prefersReducedMotion } from "@/lib/visual-language";
import { QueueStackRenderer } from "../queue/QueueRenderer";

interface Props {
  state: ExecutionState | null;
}

const VB_W = 560;
const VB_H = 380;
const R = 24;

/** Map graph layout coords → SVG viewBox space. */
function project(
  nodes: { x?: number; y?: number }[],
): { sx: (x: number) => number; sy: (y: number) => number } {
  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);
  const pad = 56;
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);

  return {
    sx: (x) => pad + ((x - minX) / spanX) * (VB_W - pad * 2),
    // graph utils use +y downward-ish in data; flip for SVG
    sy: (y) => pad + ((y - minY) / spanY) * (VB_H - pad * 2),
  };
}

export function GraphRenderer({ state }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const graph = state?.structures.graph;
  const step = state?.step ?? -1;

  const highlightNodes = useMemo(
    () => new Set(state?.highlights.nodes ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );
  const highlightEdges = useMemo(
    () => new Set(state?.highlights.edges ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );
  const visited = useMemo(() => {
    const raw = state?.variables.visited;
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  }, [step, state?.variables.visited]);
  const visitedEdges = useMemo(() => {
    const raw = state?.variables.visitedEdges;
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  }, [step, state?.variables.visitedEdges]);
  const distances = useMemo(() => {
    const raw = state?.variables.dist;
    if (!raw || typeof raw !== "object") return null;
    return raw as Record<string, number | string>;
  }, [step, state?.variables.dist]);

  const layout = useMemo(
    () => (graph ? project(graph.nodes) : null),
    [graph],
  );

  const hasQueue = Array.isArray(state?.structures.queue);
  const hasStack = Array.isArray(state?.structures.stack);

  useLayoutEffect(() => {
    if (!svgRef.current || step < 0) return;
    const activeNodes = svgRef.current.querySelectorAll("[data-node-active='true']");
    const activeEdges = svgRef.current.querySelectorAll("[data-edge-active='true']");

    gsap.killTweensOf(activeNodes);
    gsap.killTweensOf(activeEdges);

    if (prefersReducedMotion()) return;

    if (activeNodes.length) {
      gsap.fromTo(
        activeNodes,
        { scale: 0.85, transformOrigin: "center" },
        {
          scale: MOTION.pulseScale,
          duration: 0.28,
          yoyo: true,
          repeat: 1,
          ease: MOTION.easePulse,
          overwrite: "auto",
        },
      );
    }
    if (activeEdges.length) {
      gsap.fromTo(
        activeEdges,
        { attr: { "stroke-opacity": 0.4 } },
        {
          attr: { "stroke-opacity": 1 },
          duration: 0.35,
          ease: MOTION.easeDefault,
          overwrite: "auto",
        },
      );
    }
  }, [step]);

  if (!graph || !layout) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-text-muted">
        No graph in current state
      </div>
    );
  }

  const { sx, sy } = layout;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-full max-h-[480px] w-full max-w-3xl"
          role="img"
          aria-label="Graph visualization"
        >
          <defs>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {graph.edges.map((edge) => {
            const from = graph.nodes.find((n) => n.id === edge.from);
            const to = graph.nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;

            const active = highlightEdges.has(edge.id);
            const settled = visitedEdges.has(edge.id);
            const x1 = sx(from.x ?? 0);
            const y1 = sy(from.y ?? 0);
            const x2 = sx(to.x ?? 0);
            const y2 = sy(to.y ?? 0);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const stroke = active ? "#2ee6a6" : settled ? "#34d399" : "#3a4a63";
            const width = active ? 3.5 : settled ? 2.2 : 1.4;

            return (
              <g key={edge.id}>
                <line
                  data-edge-active={active ? "true" : "false"}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeOpacity={active ? 1 : settled ? 0.9 : 0.5}
                  strokeLinecap="round"
                />
                {active && (
                  <circle r="4" fill="#eafff7">
                    <animateMotion
                      dur="0.9s"
                      repeatCount="indefinite"
                      path={`M${x1},${y1} L${x2},${y2}`}
                    />
                  </circle>
                )}
                {edge.weight !== undefined && (
                  <g>
                    <rect
                      x={mx - 12}
                      y={my - 18}
                      width="24"
                      height="16"
                      rx="4"
                      fill="#0d1420"
                      stroke="#2a3b55"
                    />
                    <text
                      x={mx}
                      y={my - 6}
                      textAnchor="middle"
                      fill={active ? "#2ee6a6" : "#8b9bb4"}
                      fontSize="11"
                      fontFamily="ui-monospace, monospace"
                    >
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {graph.nodes.map((node) => {
            const active = highlightNodes.has(node.id);
            const isVisited = visited.has(node.id);
            const cx = sx(node.x ?? 0);
            const cy = sy(node.y ?? 0);
            const fill = active ? "#2ee6a6" : isVisited ? "#14413a" : "#152033";
            const stroke = active
              ? "#eafff7"
              : isVisited
                ? "#34d399"
                : "#3a4a63";
            const dist = distances ? String(distances[node.id] ?? "") : "";

            return (
              <g
                key={node.id}
                data-node-active={active ? "true" : "false"}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
                filter={active ? "url(#node-glow)" : undefined}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={R}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={active ? 3 : 2}
                  className="transition-[fill,stroke] duration-300"
                />
                <text
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  fill={active || isVisited ? "#e8eef7" : "#8b9bb4"}
                  fontSize="14"
                  fontWeight="600"
                  fontFamily="ui-monospace, monospace"
                >
                  {String(node.label)}
                </text>
                {dist && (
                  <text
                    x={cx}
                    y={cy + R + 16}
                    textAnchor="middle"
                    fill={active ? "#2ee6a6" : "#6b7c96"}
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                  >
                    {dist}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-3 px-4 pb-4">
        {hasQueue && (
          <div className="max-w-md flex-1">
            <QueueStackRenderer state={state} mode="queue" />
          </div>
        )}
        {hasStack && (
          <div className="max-w-md flex-1">
            <QueueStackRenderer state={state} mode="stack" />
          </div>
        )}
      </div>
    </div>
  );
}
