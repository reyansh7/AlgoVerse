"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { eventsToStates } from "@/engine/events/reduce";
import { iterativeBinarySearch } from "@/problems/704-binary-search/solutions/iterative";
import { barColor } from "@/lib/highlight-colors";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

const INPUT = { array: [-9, -4, -1, 0, 3, 7, 11, 14, 18, 23, 27, 31], target: 23 };
const STEP_MS = 780;

export function LiveDemo() {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const states = useMemo(
    () => eventsToStates("704-iterative", iterativeBinarySearch.execute(INPUT)),
    [],
  );

  const state = states[Math.min(step, states.length - 1)];
  const values = (state?.structures.array ?? INPUT.array) as number[];
  const kinds = state?.highlights.indexKinds;
  const sorted = state?.highlights.sorted;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % states.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [running, states.length]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-demo-card]", {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 80%" },
        });

        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top 75%",
          end: "bottom 25%",
          onToggle: (self) => setRunning(self.isActive),
          onRefresh: (self) => setRunning(self.isActive),
        });
        return () => st.kill();
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        setRunning(false);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const max = Math.max(...values.map((v) => Math.abs(v)), 1);

  return (
    <section
      ref={root}
      className="relative mx-auto w-full max-w-6xl px-6 py-28 md:py-36"
    >
      <div className="mb-10 max-w-xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
          Live engine
        </span>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Every frame is real execution.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-text-muted sm:text-base">
          This is LeetCode 704 running through the same event pipeline the whole
          platform uses — no scripted animation, no video.
        </p>
      </div>

      <div
        data-demo-card
        className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#080d15]/80 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
            <span className="ml-3 font-mono text-[11px] text-text-muted">
              704 · binary-search · iterative
            </span>
          </div>
          <span className="font-mono text-[11px] text-text-muted">
            step {step + 1}/{states.length}
          </span>
        </div>

        <div className="flex h-[280px] items-end justify-center gap-1.5 px-5 pb-5 pt-8 sm:gap-2.5 md:h-[320px]">
          {values.map((v, i) => {
            const h = 18 + (Math.abs(v) / max) * 78;
            const color = barColor(i, kinds, sorted);
            const active = Boolean(kinds?.[i]);
            return (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-end gap-2"
              >
                <span
                  className="font-mono text-[10px] transition-colors duration-300 sm:text-xs"
                  style={{ color: active ? color : "#4a5a72" }}
                >
                  {v}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-500 ease-out"
                  style={{
                    height: `${h}%`,
                    background: color,
                    opacity: active ? 1 : 0.32,
                    boxShadow: active ? `0 0 24px ${color}55` : "none",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06] px-5 py-4">
          <p className="min-h-[2.5rem] text-sm leading-relaxed text-text-primary/85">
            {state?.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] text-text-muted">
            {Object.entries(state?.variables ?? {})
              .filter(([, v]) => v !== null && typeof v !== "object")
              .slice(0, 5)
              .map(([k, v]) => (
                <span key={k}>
                  {k}
                  <span className="text-accent-2"> = {String(v)}</span>
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/learn/binary-search"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg-deep transition hover:brightness-110"
        >
          Open this problem
        </Link>
        <span className="text-xs text-text-muted">
          Scrub, step, and switch approaches inside the workspace.
        </span>
      </div>
    </section>
  );
}
