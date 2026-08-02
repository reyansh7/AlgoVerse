import { notFound } from "next/navigation";
import { getProblemBySlug, LEARN_PROBLEMS } from "@/problems/registry";
import { ClientLearnWorkspace } from "@/components/learn/ClientLearnWorkspace";

export function generateStaticParams() {
  return LEARN_PROBLEMS.map((p) => ({ slug: p.metadata.slug }));
}

export default async function LearnProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getProblemBySlug(slug)) notFound();
  // Pass slug only — solution execute() functions cannot cross the RSC boundary.
  return <ClientLearnWorkspace slug={slug} />;
}
