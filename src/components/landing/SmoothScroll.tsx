"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Lenis + ScrollTrigger bridge. Landing page only. */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onChange = () => {
      if (reduce.matches) lenis.stop();
      else lenis.start();
    };
    reduce.addEventListener("change", onChange);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      reduce.removeEventListener("change", onChange);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
