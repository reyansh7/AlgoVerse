"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const DOTS = [
  { x: 66, y: 22 },
  { x: 78, y: 34 },
  { x: 88, y: 18 },
  { x: 72, y: 62 },
  { x: 84, y: 74 },
  { x: 93, y: 48 },
  { x: 61, y: 82 },
  { x: 90, y: 88 },
];

/** Editorial backdrop: soft light fields, a faint column grid, drifting nodes. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-orb-a]", {
          xPercent: 7,
          yPercent: -5,
          duration: 18,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
        gsap.to("[data-orb-b]", {
          xPercent: -6,
          yPercent: 6,
          duration: 23,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
        gsap.to("[data-ring]", {
          scale: 1.07,
          opacity: 0.16,
          transformOrigin: "72% 46%",
          duration: 10,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: 1.4,
        });
        gsap.to("[data-dot]", {
          opacity: 0.15,
          duration: 3.4,
          yoyo: true,
          repeat: -1,
          stagger: { each: 0.4, from: "random" },
          ease: "sine.inOut",
        });
        gsap.from("[data-column]", {
          scaleY: 0,
          transformOrigin: "top",
          duration: 2.2,
          ease: "power3.inOut",
          stagger: 0.12,
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#060a11]" />

      <div
        data-orb-a
        className="absolute right-[-12%] top-[-18%] h-[58vmax] w-[58vmax] rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(62,203,255,0.17) 0%, transparent 65%)",
        }}
      />
      <div
        data-orb-b
        className="absolute right-[5%] bottom-[-30%] h-[52vmax] w-[52vmax] rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(46,230,166,0.15) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute left-[-18%] top-[20%] h-[46vmax] w-[46vmax] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(46,230,166,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="absolute inset-0 mx-auto flex max-w-6xl justify-between px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            data-column
            className="h-full w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent"
          />
        ))}
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="hero-vignette" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="#060a11" stopOpacity="0" />
            <stop offset="72%" stopColor="#060a11" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#060a11" stopOpacity="0.92" />
          </radialGradient>
        </defs>

        <circle
          data-ring
          cx="72"
          cy="46"
          r="18"
          fill="none"
          stroke="#2ee6a6"
          strokeWidth="0.06"
          strokeOpacity="0.24"
        />
        <circle
          data-ring
          cx="72"
          cy="46"
          r="28"
          fill="none"
          stroke="#3ecbff"
          strokeWidth="0.05"
          strokeOpacity="0.18"
        />

        {DOTS.map((d, i) => (
          <circle
            key={i}
            data-dot
            cx={d.x}
            cy={d.y}
            r={0.32}
            fill={i % 2 === 0 ? "#2ee6a6" : "#3ecbff"}
            opacity="0.5"
          />
        ))}

        <rect width="100" height="100" fill="url(#hero-vignette)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-r from-[#060a11] via-[#060a11]/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#060a11]" />
    </div>
  );
}
