"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { ExecutionState } from "@/core/types/execution";
import { diffStates } from "@/core/animation/diff";
import { barColor, HIGHLIGHT_COLORS } from "@/lib/highlight-colors";

interface Props {
  state: ExecutionState | null;
  previous: ExecutionState | null;
}

const GAP = 6;
const TRACK_H = 260;

export function ArrayRenderer({ state, previous }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pointerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mounted = useRef(false);

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
    const first = !mounted.current;
    mounted.current = true;

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
          duration: first ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      const label = el.querySelector<HTMLElement>("[data-val]");
      if (label) {
        gsap.to(label, {
          color,
          duration: first ? 0 : 0.3,
          overwrite: "auto",
        });
      }

      const idxEl = el.querySelector<HTMLElement>("[data-idx]");
      if (idxEl) {
        gsap.to(idxEl, {
          color,
          backgroundColor: `${color}18`,
          borderBottomColor: kinds[index] ? `${color}66` : "transparent",
          duration: first ? 0 : 0.3,
          overwrite: "auto",
        });
      }

      const swap = diff?.swappedIndices;
      const swapping = swap && (index === swap[0] || index === swap[1]);

      if (first) {
        gsap.set(el, { x: targetX, y: 0, scale: 1 });
        continue;
      }

      if (swapping) {
        const partner = index === swap[0] ? swap[1] : swap[0];
        const lift = index === swap[0] ? -28 : 28;
        gsap.killTweensOf(el);
        gsap
          .timeline()
          .set(el, { x: partner * slot, zIndex: 20 })
          .to(el, { y: lift, duration: 0.2, ease: "power2.out" })
          .to(el, { x: targetX, duration: 0.34, ease: "power2.inOut" }, "<")
          .to(el, { y: 0, duration: 0.2, ease: "power2.in" })
          .set(el, { zIndex: 1 });
      } else {
        gsap.to(el, {
          x: targetX,
          y: 0,
          duration: 0.38,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      }

      if (
        kinds[index] &&
        (operation === "compare" ||
          operation === "found" ||
          operation === "mid" ||
          operation === "minimum" ||
          operation === "pivot")
      ) {
        gsap.fromTo(
          el,
          { scale: 1 },
          {
            scale: 1.08,
            duration: 0.18,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            overwrite: false,
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
        duration: first ? 0 : 0.42,
        ease: "back.out(1.5)",
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
  ]);

  if (!array.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-text-muted">
        No array in current state
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-4 overflow-x-auto px-6 py-5">
      {/* legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] uppercase tracking-wider text-text-muted">
        <Legend swatch={HIGHLIGHT_COLORS.comparing} label="compare" />
        <Legend swatch={HIGHLIGHT_COLORS.swapped} label="swap" />
        <Legend swatch={HIGHLIGHT_COLORS.sorted} label="sorted" />
        <Legend swatch={HIGHLIGHT_COLORS.pivot} label="pivot" />
        <Legend swatch={HIGHLIGHT_COLORS.found} label="found" />
        <Legend swatch={HIGHLIGHT_COLORS.left} label="left" />
        <Legend swatch={HIGHLIGHT_COLORS.right} label="right" />
      </div>

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

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-sm"
        style={{ backgroundColor: swatch }}
      />
      {label}
    </span>
  );
}
