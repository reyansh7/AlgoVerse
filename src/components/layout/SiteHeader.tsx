"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

const links = [
  { href: "/learn", label: "Learn" },
  { href: "/explore", label: "Explore" },
  { href: "/trace", label: "Trace" },
  { href: "/compare", label: "Compare" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const root = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        start: 40,
        end: "max",
        onToggle: (self) => setScrolled(self.isActive),
        onRefresh: (self) => setScrolled(self.isActive),
      });

      const mm = gsap.matchMedia();
      if (isHome) {
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          let hidden = false;
          const hide = ScrollTrigger.create({
            start: 240,
            end: "max",
            onUpdate: (self) => {
              const shouldHide = self.direction === 1;
              if (shouldHide === hidden) return;
              hidden = shouldHide;
              gsap.to(root.current, {
                yPercent: shouldHide ? -140 : 0,
                duration: 0.45,
                ease: "power3.out",
                overwrite: true,
              });
            },
            onLeaveBack: () => {
              hidden = false;
              gsap.to(root.current, {
                yPercent: 0,
                duration: 0.3,
                overwrite: true,
              });
            },
          });
          return () => hide.kill();
        });
      }

      return () => {
        st.kill();
        mm.revert();
        gsap.set(root.current, { clearProps: "transform" });
      };
    },
    { scope: root, dependencies: [isHome], revertOnUpdate: true },
  );

  return (
    <header
      ref={root}
      className="fixed inset-x-0 top-0 z-50 px-5 pt-5 will-change-transform"
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-2 transition-all duration-500",
          scrolled
            ? "border border-white/[0.08] bg-[#0a1018]/75 backdrop-blur-xl"
            : "border border-transparent bg-transparent",
        )}
      >
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight"
        >
          Algo<span className="text-accent">Verse</span>
        </Link>
        <nav className="flex items-center gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                pathname?.startsWith(link.href)
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/learn"
            className="ml-2 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-bg-deep transition hover:brightness-110"
          >
            Launch
          </Link>
        </nav>
      </div>
    </header>
  );
}
