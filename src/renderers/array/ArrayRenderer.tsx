"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { ExecutionState } from "@/core/types/execution";
import { diffStates } from "@/core/animation/diff";
import { planAnimation } from "@/core/animation/orchestrator";
import { barColor } from "@/lib/highlight-colors";
import {
  HIGHLIGHT_COLORS,
  MOTION,
  prefersReducedMotion,
  stepBudgetSec,
} from "@/lib/visual-language";

interface Props {
  state: ExecutionState | null;
  previous: ExecutionState | null;
  /** Playback speed — keeps tweens inside the step interval. */
  speed?: number;
}

const GAP = 6;
const TRACK_H = 260;

export function ArrayRenderer({ state, previous, speed = 1 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pointerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mounted = useRef(false);
  const lastStep = useRef<number | null>(null);

  const array = useMemo(
    () => (state?.structures.array ?? []) as (number | string)[],
    [state],
  );
  const kinds = state?.highlights.indexKinds ?? {};
  const sorted = state?.highlights.sorted ?? [];
  const sortedSet = useMemo(() => new Set(sorted), [sorted]);
  const variables = state?.variables ?? {};
  const operation = state?.operation ?? "";
  const step = state?.step;

  const num = (key: string) =>
    typeof variables[key] === "number" ? (variables[key] as number) : null;
  const left = num("left");
  const right = num("right");
  const mid = num("mid");
  const iVar = num("i");
  const jVar = num("j");

  const maxValue = useMemo(() => {
    const nums = array.filter((v): v is number => typeof v === "number");
    return nums.length ? Math.max(...nums, 1) : 1;
  }, [array]);

  const n = array.length;
  const cellW = n > 14 ? 36 : n > 10 ? 44 : 54;
  const slot = cellW + GAP;
  const trackWidth = Math.max(n * slot - GAP, 0);

  const heightFor = (value: number | string) => {
    if (typeof value !== "number") return 56;
    return Math.max((value / maxValue) * (TRACK_H - 36), 12);
  };

  const pointers = useMemo(() => {
    const list: { key: string; label: string; index: number; color: string }[] =
      [];
    if (left !== null)
      list.push({ key: "L", label: "L", index: left, color: HIGHLIGHT_COLORS.left });
    if (right !== null)
      list.push({
        key: "R",
        label: "R",
        index: right,
        color: HIGHLIGHT_COLORS.right,
      });
    if (mid !== null)
      list.push({
        key: "M",
        label: "M",
        index: mid,
        color: HIGHLIGHT_COLORS.current,
      });
    if (iVar !== null)
      list.push({
        key: "i",
        label: "i",
        index: iVar,
        color: HIGHLIGHT_COLORS.selected,
      });
    if (jVar !== null)
      list.push({
        key: "j",
        label: "j",
        index: jVar,
        color: HIGHLIGHT_COLORS.comparing,
      });
    return list;
  }, [left, right, mid, iVar, jVar]);

  useLayoutEffect(() => {
    if (!state || step === undefined || n === 0) return;

    const diff = diffStates(previous, state);
    const plan = planAnimation(diff);
    const first = !mounted.current;
    mounted.current = true;

    const reduced = prefersReducedMotion();
    const jumpScrub =
      lastStep.current !== null && Math.abs(step - lastStep.current) > 1;
    lastStep.current = step;

    const instant = first || reduced || jumpScrub;
    const budget = stepBudgetSec(speed);
    const colorDur = instant ? 0 : Math.min(0.28, budget * 0.45);
    const moveDur = instant ? 0 : Math.min(0.42, budget * 0.7);
    const swapLift = instant ? 0 : Math.min(0.18, budget * 0.28);
    const swapSlide = instant ? 0 : Math.min(0.36, budget * 0.55);
    const pulseDur = instant ? 0 : Math.min(0.16, budget * 0.22);
    const pulseOps = new Set(["compare", "highlight", "swap"]);

    for (const [index, el] of cellRefs.current) {
      if (index >= n) continue;
      const targetX = index * slot;
      const bar = el.querySelector<HTMLElement>("[data-bar]");
      const targetH = heightFor(array[index]);
      const color = barColor(index, kinds, sorted);
      const active = Boolean(kinds[index]) || sortedSet.has(index);

      if (bar) {
        gsap.to(bar, {
          height: targetH,
          backgroundColor: color,
          opacity: active ? 1 : 0.55,
          duration: colorDur,
          ease: MOTION.easeDefault,
          overwrite: "auto",
        });
      }

      const label = el.querySelector<HTMLElement>("[data-val]");
      if (label) {
        gsap.to(label, {
          color,
          duration: colorDur,
          overwrite: "auto",
        });
      }

      const idxEl = el.querySelector<HTMLElement>("[data-idx]");
      if (idxEl) {
        gsap.to(idxEl, {
          color,
          backgroundColor: `${color}18`,
          borderBottomColor: kinds[index] ? `${color}66` : "transparent",
          duration: colorDur,
          overwrite: "auto",
        });
      }

      const swap = diff?.swappedIndices;
      const swapping = Boolean(swap && (index === swap[0] || index === swap[1]));

      if (instant) {
        gsap.killTweensOf(el);
        gsap.set(el, { x: targetX, y: 0, scale: 1, zIndex: 1 });
        continue;
      }

      if (swapping && swap) {
        const partner = index === swap[0] ? swap[1] : swap[0];
        // Arc: one lifts up, one dips — identity travels, never teleports.
        const lift = index === swap[0] ? -32 : 32;
        gsap.killTweensOf(el);
        gsap
          .timeline({ defaults: { overwrite: "auto" } })
          .set(el, { x: partner * slot, zIndex: 20 })
          .to(el, { y: lift, duration: swapLift, ease: MOTION.easeDefault })
          .to(
            el,
            { x: targetX, duration: swapSlide, ease: MOTION.easeSwap },
            "<0.04",
          )
          .to(el, {
            y: 0,
            duration: swapLift,
            ease: "back.out(1.6)",
          })
          .set(el, { zIndex: 1 });
      } else {
        gsap.to(el, {
          x: targetX,
          y: 0,
          duration: moveDur,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      // Pulse affected indices from AnimationPlan — Trace event ops only.
      if (
        kinds[index] &&
        (plan.pulseIndices.includes(index) ||
          pulseOps.has(plan.emphasizeOperation) ||
          pulseOps.has(operation))
      ) {
        gsap.fromTo(
          el,
          { scale: 1 },
          {
            scale: MOTION.pulseScale,
            duration: pulseDur,
            yoyo: true,
            repeat: 1,
            ease: MOTION.easePulse,
            overwrite: false,
            delay: colorDur * 0.35,
          },
        );
      }
    }

    for (const p of pointers) {
      const el = pointerRefs.current.get(p.key);
      if (!el) continue;
      const clamped = Math.min(Math.max(p.index, 0), n - 1);
      gsap.to(el, {
        x: clamped * slot + cellW / 2,
        opacity: p.index === clamped ? 1 : 0.45,
        duration: instant ? 0 : Math.min(0.4, budget * 0.65),
        ease: instant ? "none" : "back.out(1.4)",
        overwrite: "auto",
      });
    }
  }, [
    step,
    state,
    previous,
    array,
    kinds,
    sorted,
    sortedSet,
    operation,
    pointers,
    n,
    slot,
    cellW,
    maxValue,
    speed,
  ]);

  if (!array.length) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-text-muted">
        No array in current state
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 overflow-x-auto px-4 pb-4 pt-10">
      <div
        ref={trackRef}
        className="relative shrink-0"
        style={{ width: trackWidth, height: TRACK_H + 110 }}
      >
        {left !== null && right !== null && right >= left && (
          <div
            className="pointer-events-none absolute rounded-xl border border-sky-400/20 bg-sky-400/5 transition-all duration-500"
            style={{
              left: left * slot - 4,
              width: (right - left) * slot + cellW + 8,
              top: 0,
              height: TRACK_H + 8,
            }}
          />
        )}

        {array.map((value, index) => {
          const color = barColor(index, kinds, sorted);
          const active = Boolean(kinds[index]) || sortedSet.has(index);
          return (
            <div
              key={index}
              ref={(el) => {
                if (el) cellRefs.current.set(index, el);
                else cellRefs.current.delete(index);
              }}
              className="absolute top-0 flex flex-col items-center will-change-transform"
              style={{ width: cellW, left: 0, height: TRACK_H + 28 }}
            >
              <span
                data-val
                className="mb-1.5 font-mono text-[11px] font-semibold tabular-nums"
                style={{ color }}
              >
                {value}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  data-bar
                  className="w-full rounded-t-md"
                  style={{
                    height: heightFor(value),
                    backgroundColor: color,
                    opacity: active ? 1 : 0.55,
                  }}
                />
              </div>
              <span
                data-idx
                className="mt-1.5 w-full rounded-md py-0.5 text-center font-mono text-[10px]"
                style={{
                  color,
                  backgroundColor: `${color}18`,
                  borderBottom: kinds[index]
                    ? `2px solid ${color}66`
                    : "2px solid transparent",
                }}
              >
                {index}
              </span>
            </div>
          );
        })}

        <div className="absolute left-0" style={{ top: TRACK_H + 40 }}>
          {pointers.map((p, order) => (
            <div
              key={p.key}
              ref={(el) => {
                if (el) pointerRefs.current.set(p.key, el);
                else pointerRefs.current.delete(p.key);
              }}
              className="absolute will-change-transform"
              style={{ left: -12, top: order * 20 }}
            >
              <div
                className="flex h-5 min-w-6 items-center justify-center rounded-md border px-1.5 font-mono text-[10px] font-semibold"
                style={{
                  color: p.color,
                  borderColor: `${p.color}99`,
                  backgroundColor: `${p.color}22`,
                }}
              >
                {p.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
