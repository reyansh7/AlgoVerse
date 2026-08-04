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
import { LearningPanel } from "@/components/trace/learning";
import { useTraceStore } from "@/store/traceStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSelectionStore } from "@/store/selectionStore";
import { frameToExecutionState } from "@/engine/state";
import { diffStates } from "@/core/animation/diff";
import {
  explainStep,
  collectLegend,
  buildTraceIntro,
  buildTraceSummary,
} from "@/engine/explain";
import type { ExecutionState } from "@/core/types/execution";
import { cn } from "@/lib/cn";

async function loadSample(): Promise<string> {
  const res = await fetch(`/samples/bubble.trace.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load sample (${res.status})`);
  return res.text();
}

/** Hide internal reducer keys from the Variables panel. */
function displayState(state: ExecutionState | null): ExecutionState | null {
  if (!state) return null;
  const variables: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state.variables)) {
    if (k.startsWith("__")) continue;
    variables[k] = v;
  }
  return { ...state, variables };
}

function structuresPresent(state: ExecutionState | null): string[] {
  if (!state) return [];
  return (Object.keys(state.structures) as (keyof ExecutionState["structures"])[])
    .filter((k) => state.structures[k] != null);
}

export function TraceWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedOnce = useRef(false);
  const [paste, setPaste] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [codeOpen, setCodeOpen] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

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
  const isPlaying = usePlayerStore((s) => s.isPlaying);

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
        setShowIntro(true);
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

    try {
      if (
        typeof window !== "undefined" &&
        !window.localStorage.getItem("algoverse.trace.onboarded")
      ) {
        setOnboarding(true);
      }
    } catch {
      /* ignore */
    }

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

  const diff = useMemo(() => diffStates(previous, state), [previous, state]);

  const event = document?.events[currentStep];
  const lesson = useMemo(
    () => explainStep(event, state, diff),
    [event, state, diff],
  );

  const legend = useMemo(() => collectLegend(document), [document]);

  const structureKinds = useMemo(() => structuresPresent(state), [state]);

  const intro = useMemo(
    () => buildTraceIntro(document, structureKinds),
    [document, structureKinds],
  );

  const summary = useMemo(
    () => buildTraceSummary(document, structureKinds),
    [document, structureKinds],
  );

  const atEnd =
    frames.length > 0 && currentStep >= frames.length - 1 && !isPlaying;

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

  const dismissOnboarding = () => {
    setOnboarding(false);
    try {
      window.localStorage.setItem("algoverse.trace.onboarded", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2 overflow-hidden px-5 pb-2 pt-20">
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
              : "Upload a .trace.json or try the sample."}
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
            Learn →
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

      {onboarding && (
        <div
          role="status"
          className="flex shrink-0 items-start justify-between gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-text-primary"
        >
          <p>
            Watch the stage and the Guide panel — play to step through
            execution. Open Event log only if you need raw debug data.
          </p>
          <button
            type="button"
            onClick={dismissOnboarding}
            className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100"
            aria-label="Dismiss tip"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

      {/* Viz dominant + Learning Layer secondary */}
      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
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
                  Drop a <code className="text-accent">.trace.json</code> here,
                  or use Upload / Load sample.
                </p>
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute left-3 top-3 z-10">
                  <span className="rounded-md border border-white/10 bg-bg-deep/70 px-2 py-1 font-mono text-[10px] text-text-muted backdrop-blur-md">
                    step {state.step}
                    {state.line > 0 ? ` · L${state.line}` : ""}
                  </span>
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
        </div>

        <aside className="flex min-h-0 flex-col gap-2 overflow-hidden">
          <div className="min-h-0 flex-[1.4] basis-0 overflow-hidden">
            <LearningPanel
              lesson={lesson}
              legend={legend}
              step={currentStep}
              total={frames.length}
              intro={intro}
              summary={summary}
              showIntro={showIntro && !!intro && currentStep < 2}
              showSummary={atEnd && !!summary}
              onDismissIntro={() => setShowIntro(false)}
            />
          </div>

          <div className="min-h-0 flex-1 basis-0 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
              <button
                type="button"
                onClick={() => setCodeOpen((v) => !v)}
                className="shrink-0 rounded-lg px-1 text-left text-[10px] uppercase tracking-wider text-text-muted hover:text-text-primary"
              >
                Source {codeOpen ? "▾" : "▸"}
              </button>
              {codeOpen && (
                <div className="min-h-0 flex-1 overflow-hidden">
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
                      No source in this trace
                    </div>
                  )}
                </div>
              )}
              <div
                className={cn(
                  "min-h-0 overflow-hidden",
                  codeOpen ? "basis-[40%] flex-1" : "flex-1",
                )}
              >
                <VariablesPanel
                  state={state}
                  previous={previous}
                  compact
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="shrink-0 space-y-2">
        <TracePlaybackControls />
        <EventLog
          events={document?.events ?? []}
          activeIndex={currentStep}
          defaultOpen={false}
        />
      </div>

      <details className="shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1">
        <summary className="cursor-pointer text-xs text-text-muted">
          Paste trace JSON
        </summary>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={3}
          className="mt-2 max-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-xs text-text-primary outline-none focus:border-accent/40"
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
