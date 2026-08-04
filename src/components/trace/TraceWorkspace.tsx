"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Upload, X } from "lucide-react";
import { parseTrace, TraceValidationError } from "@/core/trace";
import { StructureStage } from "@/renderers/StructureStage";
import {
  VariablesPanel,
  CodePanel,
  TracePlaybackControls,
  EventLog,
} from "@/panels";
import { useTraceStore } from "@/store/traceStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSelectionStore } from "@/store/selectionStore";
import { frameToExecutionState } from "@/engine/state";
import type { ExecutionState } from "@/core/types/execution";
import { cn } from "@/lib/cn";

async function loadSample(): Promise<string> {
  const res = await fetch(`/samples/bubble.trace.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load sample (${res.status})`);
  return res.text();
}

/** Hide internal reducer keys from the State panel. */
function displayState(state: ExecutionState | null): ExecutionState | null {
  if (!state) return null;
  const variables: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state.variables)) {
    if (k.startsWith("__")) continue;
    variables[k] = v;
  }
  return { ...state, variables };
}

export function TraceWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedOnce = useRef(false);
  const [paste, setPaste] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const document = useTraceStore((s) => s.document);
  const error = useTraceStore((s) => s.error);
  const sourceLabel = useTraceStore((s) => s.sourceLabel);
  const setDocument = useTraceStore((s) => s.setDocument);
  const setError = useTraceStore((s) => s.setError);

  const frames = usePlayerStore((s) => s.frames);
  const currentStep = usePlayerStore((s) => s.currentStep);
  const loadPlayer = usePlayerStore((s) => s.load);
  const jump = usePlayerStore((s) => s.jump);
  const speed = usePlayerStore((s) => s.speed);

  const selectEvent = useSelectionStore((s) => s.selectEvent);
  const selectedEventIndex = useSelectionStore((s) => s.selectedEventIndex);

  const applyJson = useCallback(
    (json: string, label: string) => {
      const trimmed = json.trim();
      if (!trimmed) {
        setError("Paste a full Trace JSON document first (empty input).");
        return;
      }
      try {
        const doc = parseTrace(trimmed);
        setDocument(doc, label);
        loadPlayer(doc);
        selectEvent(null);
        setError(null);
      } catch (e) {
        const msg =
          e instanceof TraceValidationError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Invalid trace";
        setError(msg);
      }
    },
    [setDocument, loadPlayer, selectEvent, setError],
  );

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;

    const params = new URLSearchParams(window.location.search);
    const src = params.get("src");

    (async () => {
      setLoading(true);
      try {
        if (src) {
          const data = params.get("data");
          if (data) {
            applyJson(decodeURIComponent(data), src);
            return;
          }
          const url = src.includes("?")
            ? `${src}&t=${Date.now()}`
            : `${src}?t=${Date.now()}`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(
              `Could not fetch ${src} (${res.status}). Is the file in public/traces?`,
            );
          }
          const text = await res.text();
          if (!text.trim()) {
            throw new Error(
              `Trace file at ${src} is empty. Re-run: npm run algoverse -- run examples/bubble.py`,
            );
          }
          applyJson(text, src);
          return;
        }
        applyJson(await loadSample(), "examples/bubble.trace.json");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load trace");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, []);

  useEffect(() => {
    if (selectedEventIndex === null) return;
    jump(selectedEventIndex);
  }, [selectedEventIndex, jump]);

  const state = useMemo(
    () => displayState(frameToExecutionState(frames[currentStep] ?? null)),
    [frames, currentStep],
  );
  const previous = useMemo(
    () =>
      currentStep > 0
        ? frameToExecutionState(frames[currentStep - 1] ?? null)
        : null,
    [frames, currentStep],
  );

  const codeLines = useMemo(() => {
    const code = document?.source?.code;
    if (!code) return [];
    return code.replace(/\r\n/g, "\n").split("\n");
  }, [document]);

  const onFile = async (file: File) => {
    applyJson(await file.text(), file.name);
  };

  const resetFileInput = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-3 overflow-hidden px-5 pb-3 pt-20">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            Trace player · v0.1
          </p>
          <h1 className="mt-1 truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {document?.algorithm ?? "Load a trace"}
          </h1>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {sourceLabel
              ? `${sourceLabel} · ${document?.language ?? ""}`
              : "Upload a .trace.json or try the bubble sort sample."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                applyJson(await loadSample(), "examples/bubble.trace.json");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sample load failed");
              } finally {
                setLoading(false);
              }
            }}
            className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-bg-deep transition hover:brightness-110"
          >
            Load sample
          </button>
          <Link
            href="/learn/bubble-sort"
            className="rounded-xl px-2 py-1.5 text-sm text-text-muted transition hover:text-text-primary"
          >
            Learn bubble sort →
          </Link>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.trace.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              resetFileInput();
            }}
          />
        </div>
      </header>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex shrink-0 items-start justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Single-page workspace: stage + sidebar; lists scroll inside panels */}
      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
          <div
            className={cn(
              "glass relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl p-3",
              dragOver && "ring-2 ring-accent/50",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void onFile(f);
            }}
          >
            {loading && !state ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
                <p className="text-sm">Loading trace…</p>
              </div>
            ) : !state ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-text-muted">
                <Upload className="h-8 w-8 opacity-50" />
                <p className="text-sm">
                  Drop a <code className="text-accent">.trace.json</code> here, or
                  use Upload / Load sample.
                </p>
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
                  <div className="max-w-xl rounded-xl border border-white/10 bg-bg-deep/80 px-3 py-2 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                        {state.operation || "step"}
                      </span>
                      <span className="font-mono text-[10px] text-text-muted">
                        step {state.step}
                        {state.line > 0 ? ` · L${state.line}` : ""}
                      </span>
                    </div>
                    {state.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-snug text-text-primary/95">
                        {state.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-text-muted">
                        Watch what moves — only meaningful changes animate.
                      </p>
                    )}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <StructureStage
                    state={state}
                    previous={previous}
                    speed={speed}
                  />
                </div>
              </>
            )}
          </div>
          <div className="shrink-0">
            <TracePlaybackControls />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="min-h-0 basis-[28%] overflow-hidden">
            <VariablesPanel state={state} previous={previous} />
          </div>
          <div className="min-h-0 basis-[28%] overflow-hidden">
            {codeLines.length > 0 ? (
              <CodePanel
                title="Source"
                code={codeLines}
                activeLine={
                  state?.line && state.line > 0 ? state.line - 1 : null
                }
              />
            ) : (
              <div className="glass flex h-full items-center justify-center rounded-2xl px-4 text-center text-sm text-text-muted">
                No source in this trace — pass{" "}
                <code className="mx-1 text-accent">source_code=</code> when
                emitting.
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 basis-[44%] overflow-hidden">
            <EventLog
              events={document?.events ?? []}
              activeIndex={currentStep}
            />
          </div>
        </aside>
      </div>

      <details className="shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <summary className="cursor-pointer text-xs text-text-muted">
          Paste trace JSON
        </summary>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          className="mt-2 max-h-28 w-full rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-xs text-text-primary outline-none focus:border-accent/40"
          placeholder='{ "version": "0.1", … }'
        />
        <button
          type="button"
          onClick={() => applyJson(paste, "pasted")}
          className="mt-2 rounded-lg bg-accent/20 px-3 py-1 text-xs text-accent transition hover:bg-accent/30"
        >
          Parse & load
        </button>
      </details>
    </div>
  );
}
