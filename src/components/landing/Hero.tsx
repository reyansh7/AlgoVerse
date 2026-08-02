"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

const HeroScene = dynamic(
  () => import("@/components/scene/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

interface HeroProps {
  problemCount: number;
  familyCount: number;
}

export function Hero({ problemCount, familyCount }: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

        tl.from("[data-hero-eyebrow]", { opacity: 0, y: 12, duration: 0.8 })
          .from(
            "[data-hero-brand]",
            { yPercent: 110, duration: 1.45, ease: "expo.out" },
            "-=0.45",
          )
          .from(
            "[data-hero-line]",
            { y: 22, opacity: 0, duration: 1 },
            "-=0.85",
          )
          .from(
            "[data-hero-rule]",
            { scaleX: 0, duration: 1.15, ease: "power3.inOut" },
            "-=0.85",
          )
          .from(
            "[data-hero-cta] > *",
            { opacity: 0, y: 16, duration: 0.75, stagger: 0.08 },
            "-=0.7",
          )
          .from("[data-hero-meta]", { opacity: 0, duration: 0.9 }, "-=0.5")
          .from("[data-hero-cue]", { opacity: 0, duration: 0.7 }, "-=0.4");

        gsap.to("[data-hero-inner]", {
          yPercent: -12,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.55,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="noise relative flex min-h-[100svh] items-center overflow-hidden px-6"
    >
      <HeroScene />

      <div
        data-hero-inner
        className="relative z-10 mx-auto w-full max-w-6xl pt-24"
      >
        <p
          data-hero-eyebrow
          className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-accent"
        >
          <span className="h-px w-8 bg-accent/60" />
          Interactive DSA engine
        </p>

        <h1 className="mt-8 overflow-hidden pb-[0.06em] font-display text-[clamp(3.4rem,12vw,9rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
          <span data-hero-brand className="block text-gradient">
            AlgoVerse
          </span>
        </h1>

        <p
          data-hero-line
          className="mt-7 max-w-xl font-display text-xl leading-snug text-text-primary/88 sm:text-2xl md:text-[1.7rem]"
        >
          Watch algorithms unfold as living simulations.
        </p>

        <div
          data-hero-rule
          className="mt-10 h-px w-full origin-left bg-gradient-to-r from-white/25 via-white/10 to-transparent"
        />

        <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div data-hero-cta className="flex flex-wrap items-center gap-3">
            <Link
              href="/learn"
              className="group flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-bg-deep transition hover:brightness-110"
            >
              Start learning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-white/12 px-7 py-3.5 text-sm text-text-primary/90 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.05]"
            >
              Explore problems
            </Link>
          </div>

          <div
            data-hero-meta
            className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted/70"
          >
            <span>{problemCount} problems</span>
            <span className="h-1 w-1 rounded-full bg-accent/50" />
            <span>{familyCount} families</span>
            <span className="h-1 w-1 rounded-full bg-accent/50" />
            <span>Deterministic replay</span>
          </div>
        </div>
      </div>

      <div
        data-hero-cue
        className="absolute inset-x-0 bottom-7 z-10 flex justify-center"
      >
        <ArrowDown className="h-4 w-4 animate-bounce text-text-muted/50" />
      </div>
    </section>
  );
}
