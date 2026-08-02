"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

export function ClosingCTA() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-cta-line]", {
          yPercent: 110,
          duration: 1.3,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
        gsap.from("[data-cta-btn]", {
          opacity: 0,
          y: 20,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 65%" },
        });
        gsap.to("[data-cta-orb]", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
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
      className="relative overflow-hidden px-6 py-36 text-center md:py-48"
    >
      <div
        data-cta-orb
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(46,230,166,0.16) 0%, rgba(62,203,255,0.08) 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <h2 className="font-display text-[clamp(2.2rem,7vw,5rem)] font-semibold leading-[1.0] tracking-[-0.03em]">
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-cta-line className="block text-gradient">
              AlgoVerse
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-cta-line className="mt-3 block text-[0.55em] font-medium tracking-[-0.02em] text-text-primary/90 sm:mt-4">
              Stop memorising. Start seeing.
            </span>
          </span>
        </h2>

        <div data-cta-btn className="mt-12 flex justify-center">
          <Link
            href="/learn"
            className="group flex items-center gap-2 rounded-full bg-accent px-9 py-4 text-sm font-semibold text-bg-deep transition hover:brightness-110"
          >
            Open the workspace
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
