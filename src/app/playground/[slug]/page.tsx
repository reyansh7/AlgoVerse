import { notFound } from "next/navigation";
import { getProblemBySlug, PROBLEMS } from "@/problems/catalog";
import { ClientPlayground } from "@/components/playground/ClientPlayground";

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }));
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) notFound();
  return <ClientPlayground problem={problem} />;
}
