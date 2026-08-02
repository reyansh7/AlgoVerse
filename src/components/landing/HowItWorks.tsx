"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const STEPS = [
  {
    n: "01",
    title: "Pick a problem",
    body: "Search by number, name, or family. Two Sum to N-Queens — the catalogue follows the interview roadmap.",
    code: "search(704) → binary-search",
  },
  {
    n: "02",
    title: "Read the solution",
    body: "Curated reference implementations with stated time and space complexity, in the language you think in.",
    code: "while (left <= right) { … }",
  },
  {
    n: "03",
    title: "Watch it execute",
    body: "The solution emits events. The engine turns those events into frames you can scrub, replay, and narrate.",
    code: "compare(mid, target) → frame 12",
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=2400",
            pin: true,
            scrub: 0.6,
            onUpdate: (self) =>
              setActive(Math.min(2, Math.floor(self.progress * 3))),
          },
        });

        STEPS.forEach((_, i) => {
          if (i === 0) return;
          tl.to(`[data-step="${i - 1}"]`, { opacity: 0.18, duration: 1 }, i)
            .to(`[data-step="${i}"]`, { opacity: 1, duration: 1 }, i);
        });

        gsap.set('[data-step="1"], [data-step="2"]', { opacity: 0.18 });
        return () => tl.kill();
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] items-center border-y border-white/[0.06] px-6 py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-14 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            The loop
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Three moves,
            <br />
            infinitely repeatable.
          </h2>
          <div className="mt-10 hidden items-center gap-3 md:flex">
            {STEPS.map((s, i) => (
              <span
                key={s.n}
                className={`h-[2px] w-12 rounded-full transition-colors duration-500 ${
                  i <= active ? "bg-accent" : "bg-white/12"
                }`}
              />
            ))}
          </div>
        </div>

        <ol className="flex flex-col gap-8">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-step={i}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-accent">{s.n}</span>
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {s.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {s.body}
              </p>
              <code className="mt-5 block rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] text-accent-2">
                {s.code}
              </code>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
