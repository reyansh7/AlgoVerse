"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-text-muted">
      Loading editor…
    </div>
  ),
});

interface Props {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnlyHint?: string;
}

export function MonacoPane({ value, language, onChange, readOnlyHint }: Props) {
  return (
    <div className="flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-border-glass bg-[#0d1117]">
      {readOnlyHint ? (
        <p className="border-b border-white/5 px-3 py-2 text-[11px] leading-snug text-text-muted">
          {readOnlyHint}
        </p>
      ) : null}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={(v) => onChange?.(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
