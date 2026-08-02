"use client";

import { useRef } from "react";
import {
  Braces,
  GitBranch,
  Gauge,
  Layers,
  Repeat,
  Sparkles,
} from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

const PILLARS = [
  {
    icon: Braces,
    title: "Multi-language reference code",
    body: "Read each solution in TypeScript, Python, Java, or C++ with full syntax highlighting inside Monaco.",
    span: "md:col-span-2",
  },
  {
    icon: Repeat,
    title: "Scrub any step",
    body: "Rewind, pause, and replay. The timeline is deterministic, so step 47 is always step 47.",
    span: "",
  },
  {
    icon: GitBranch,
    title: "Compare approaches",
    body: "Brute force next to optimal, with complexity trade-offs made obvious in motion.",
    span: "",
  },
  {
    icon: Layers,
    title: "One visual language",
    body: "Arrays, trees, graphs, heaps and DP tables share the same highlight palette, so intuition transfers.",
    span: "md:col-span-2",
  },
  {
    icon: Gauge,
    title: "Built for speed",
    body: "Transform-only animation with reduced-motion support. Smooth on a laptop, smooth on a phone.",
    span: "",
  },
  {
    icon: Sparkles,
    title: "Narrated frames",
    body: "Every frame carries a one-line explanation of what just happened and why.",
    span: "md:col-span-2",
  },
];

export function Pillars() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-pillar]", {
          y: 44,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: root.current, start: "top 72%" },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="features"
      className="mx-auto w-full max-w-6xl px-6 py-28 md:py-36"
    >
      <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h2 className="max-w-lg font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Not a slideshow.
          <br />
          <span className="text-text-muted">A runtime you can pause.</span>
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-text-muted">
          Everything you see is produced by executing curated reference
          solutions and recording what they do.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PILLARS.map(({ icon: Icon, title, body, span }) => (
          <article
            key={title}
            data-pillar
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-500 hover:border-accent/25 ${span}`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
            />
            <Icon className="h-5 w-5 text-accent" strokeWidth={1.6} />
            <h3 className="mt-6 font-display text-lg font-semibold tracking-tight">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
