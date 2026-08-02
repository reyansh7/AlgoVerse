import Link from "next/link";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/explore", label: "Explore" },
  { href: "/compare", label: "Compare" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link
          href="/"
          className="font-display text-sm font-semibold tracking-tight"
        >
          Algo<span className="text-accent">Verse</span>
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted/60">
          Built for people who learn by watching
        </p>
      </div>
    </footer>
  );
}
