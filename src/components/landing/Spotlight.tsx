"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Cursor-following light. Pointer-fine devices only. */
export function Spotlight() {
  const glow = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!glow.current) return;
    const mm = gsap.matchMedia();

    mm.add(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const el = glow.current!;
        gsap.set(el, { opacity: 0 });
        const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" });

        const move = (e: PointerEvent) => {
          xTo(e.clientX);
          yTo(e.clientY);
          gsap.to(el, { opacity: 1, duration: 0.6, overwrite: "auto" });
        };
        const leave = () =>
          gsap.to(el, { opacity: 0, duration: 0.4, overwrite: "auto" });

        window.addEventListener("pointermove", move);
        document.addEventListener("pointerleave", leave);

        return () => {
          window.removeEventListener("pointermove", move);
          document.removeEventListener("pointerleave", leave);
        };
      },
    );

    return () => mm.revert();
  });

  return (
    <div
      ref={glow}
      aria-hidden
      className="pointer-events-none fixed -left-[300px] -top-[300px] z-[1] h-[600px] w-[600px] rounded-full opacity-0 mix-blend-screen blur-[80px]"
      style={{
        background:
          "radial-gradient(circle, rgba(46,230,166,0.10) 0%, rgba(62,203,255,0.06) 40%, transparent 70%)",
      }}
    />
  );
}
