"use client";

import dynamic from "next/dynamic";

const TraceWorkspace = dynamic(
  () =>
    import("@/components/trace/TraceWorkspace").then((m) => m.TraceWorkspace),
  { ssr: false },
);

export default function TracePage() {
  return <TraceWorkspace />;
}
