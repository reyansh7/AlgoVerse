"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getProblemBySlug } from "@/problems/registry";

const LearnWorkspace = dynamic(
  () =>
    import("@/components/learn/LearnWorkspace").then((m) => m.LearnWorkspace),
  { ssr: false },
);

export function ClientLearnWorkspace({ slug }: { slug: string }) {
  const problem = getProblemBySlug(slug);
  if (!problem) notFound();
  return <LearnWorkspace problem={problem} />;
}
