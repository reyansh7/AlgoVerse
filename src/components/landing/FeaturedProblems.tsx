"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

export interface FeaturedItem {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  solutions: number;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-accent",
  medium: "text-accent-warm",
  hard: "text-danger",
};

export function FeaturedProblems({ items }: { items: FeaturedItem[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-row]", {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: root.current, start: "top 78%" },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="mx-auto w-full max-w-6xl px-6 py-28">
      <div className="mb-10 flex items-end justify-between gap-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Start anywhere
        </h2>
        <Link
          href="/learn"
          className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-accent transition hover:brightness-125"
        >
          View all →
        </Link>
      </div>

      <div className="border-t border-white/[0.07]">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/learn/${p.slug}`}
            data-row
            className="group flex items-center gap-4 border-b border-white/[0.07] px-1 py-5 transition-colors hover:bg-white/[0.02] sm:gap-8 sm:px-4"
          >
            <span className="w-12 shrink-0 font-mono text-xs text-text-muted/60">
              {String(p.id).padStart(3, "0")}
            </span>
            <span className="flex-1 truncate font-display text-base font-medium tracking-tight transition-colors group-hover:text-accent sm:text-lg">
              {p.title}
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted/70 md:block">
              {p.category}
            </span>
            <span
              className={`hidden w-16 font-mono text-[10px] uppercase tracking-[0.18em] sm:block ${
                DIFFICULTY_COLOR[p.difficulty] ?? "text-text-muted"
              }`}
            >
              {p.difficulty}
            </span>
            <span className="hidden w-24 font-mono text-[10px] text-text-muted/70 lg:block">
              {p.solutions} solution{p.solutions === 1 ? "" : "s"}
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        ))}
      </div>
    </section>
  );
}
