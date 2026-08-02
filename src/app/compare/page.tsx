"use client";

import dynamic from "next/dynamic";

const ComparePageClient = dynamic(() => import("./ComparePageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center pt-28 text-text-muted">
      Loading compare…
    </div>
  ),
});

export default function ComparePage() {
  return <ComparePageClient />;
}
