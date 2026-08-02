"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface StatsProps {
  problemCount: number;
  familyCount: number;
  solutionCount: number;
}

export function Stats({
  problemCount,
  familyCount,
  solutionCount,
}: StatsProps) {
  const root = useRef<HTMLElement>(null);

  const items = [
    { value: problemCount, label: "LeetCode problems", suffix: "" },
    { value: familyCount, label: "Algorithm families", suffix: "" },
    { value: solutionCount, label: "Reference solutions", suffix: "" },
    { value: 4, label: "Editor languages", suffix: "" },
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.8,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = String(Math.round(obj.v));
            },
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-[#080d15] px-6 py-10 text-center">
            <div className="font-display text-4xl font-semibold tracking-tight text-gradient sm:text-5xl">
              <span data-count={item.value}>{item.value}</span>
              {item.suffix}
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
