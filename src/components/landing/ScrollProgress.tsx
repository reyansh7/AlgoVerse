"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!bar.current) return;
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      },
    );
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px">
      <div
        ref={bar}
        className="h-full w-full origin-left bg-gradient-to-r from-accent via-accent-2 to-accent"
      />
    </div>
  );
}
