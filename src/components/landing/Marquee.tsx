"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const ITEMS = [
  "Arrays",
  "Binary Search",
  "Two Pointers",
  "Sliding Window",
  "Prefix Sum",
  "Hash Maps",
  "Linked Lists",
  "Stacks",
  "Queues",
  "Binary Trees",
  "BST",
  "Heaps",
  "Graphs",
  "Backtracking",
  "Dynamic Programming",
  "Tries",
  "Union Find",
  "Greedy",
  "Bit Manipulation",
  "Monotonic Stack",
  "Segment Tree",
  "Design",
];

export function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-track]", {
          xPercent: -50,
          ease: "none",
          duration: 38,
          repeat: -1,
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="relative overflow-hidden border-y border-white/[0.06] py-5"
      aria-hidden
    >
      <div
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div data-track className="flex w-max gap-10 will-change-transform">
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex shrink-0 items-center gap-10 font-display text-sm uppercase tracking-[0.2em] text-text-muted/70"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-accent/50" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
