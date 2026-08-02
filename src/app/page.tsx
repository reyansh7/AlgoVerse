import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Pillars } from "@/components/landing/Pillars";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Stats } from "@/components/landing/Stats";
import {
  FeaturedProblems,
  type FeaturedItem,
} from "@/components/landing/FeaturedProblems";
import { ClosingCTA } from "@/components/landing/ClosingCTA";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Spotlight } from "@/components/landing/Spotlight";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { LEARN_PROBLEMS } from "@/problems/registry";

const FEATURED_IDS = [1, 20, 42, 200, 206, 300, 322, 704];

export default function HomePage() {
  const problemCount = LEARN_PROBLEMS.length;
  const familyCount = new Set(LEARN_PROBLEMS.map((p) => p.metadata.category))
    .size;
  const solutionCount = LEARN_PROBLEMS.reduce(
    (n, p) => n + p.solutions.length,
    0,
  );

  const featured: FeaturedItem[] = FEATURED_IDS.map((id) =>
    LEARN_PROBLEMS.find((p) => p.metadata.id === id),
  )
    .filter((p): p is (typeof LEARN_PROBLEMS)[number] => Boolean(p))
    .map((p) => ({
      id: p.metadata.id,
      slug: p.metadata.slug,
      title: p.metadata.title,
      difficulty: p.metadata.difficulty,
      category: p.metadata.category,
      solutions: p.solutions.length,
    }));

  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <Spotlight />
      <Hero problemCount={problemCount} familyCount={familyCount} />
      <Marquee />
      <LiveDemo />
      <Pillars />
      <HowItWorks />
      <Stats
        problemCount={problemCount}
        familyCount={familyCount}
        solutionCount={solutionCount}
      />
      <FeaturedProblems items={featured} />
      <ClosingCTA />
      <SiteFooter />
    </>
  );
}
