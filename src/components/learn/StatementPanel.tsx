"use client";

interface Props {
  title: string;
  difficulty: string;
  statement: string;
  tags: string[];
}

function renderMarkdownLite(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("# ")) {
      return (
        <h2 key={i} className="mt-2 font-display text-xl font-semibold">
          {line.slice(2)}
        </h2>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="mt-4 text-sm font-semibold uppercase tracking-wider text-accent">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc text-sm text-text-muted">
          {line.slice(2).replace(/`([^`]+)`/g, "$1")}
        </li>
      );
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-sm leading-relaxed text-text-primary/90">
        {line.replace(/`([^`]+)`/g, "$1")}
      </p>
    );
  });
}

export function StatementPanel({ title, difficulty, statement, tags }: Props) {
  return (
    <aside className="glass flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="border-b border-white/5 px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
          Problem · {difficulty}
        </div>
        <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">{renderMarkdownLite(statement)}</div>
    </aside>
  );
}
