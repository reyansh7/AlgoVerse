import type { TestCase } from "@/core/types/execution";
import type {
  InputSchema,
  ProblemCategory,
  ProblemDifficulty,
  ProblemPackage,
  ReferenceSolution,
  SolutionApproach,
} from "./types";

export function createProblem(opts: {
  id: number;
  title: string;
  slug?: string;
  difficulty: ProblemDifficulty;
  category: ProblemCategory;
  tags: string[];
  statement: string;
  inputSchema: InputSchema;
  testcases: Array<{ label: string; input: unknown }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  solutions: ReferenceSolution<any>[];
  leetcodeUrl?: string;
}): ProblemPackage {
  const slug =
    opts.slug ??
    opts.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return {
    metadata: {
      id: opts.id,
      slug,
      title: opts.title,
      difficulty: opts.difficulty,
      category: opts.category,
      tags: opts.tags,
      leetcodeUrl:
        opts.leetcodeUrl ?? `https://leetcode.com/problems/${slug}/`,
      inputSchema: opts.inputSchema,
    },
    statement: opts.statement,
    testcases: opts.testcases.map(
      (tc, i): TestCase => ({
        id: `${opts.id}-${i + 1}`,
        label: tc.label,
        input: tc.input,
        createdAt: 0,
      }),
    ),
    solutions: opts.solutions,
  };
}

export function sol<T>(opts: {
  id: string;
  name: string;
  approach?: SolutionApproach;
  time: string;
  space: string;
  code: string;
  codeByLang?: ReferenceSolution["codeByLang"];
  execute: (input: T) => import("@/engine/events/types").ExecutionEvent[];
}): ReferenceSolution<T> {
  return {
    id: opts.id,
    name: opts.name,
    approach: opts.approach ?? "optimal",
    timeComplexity: opts.time,
    spaceComplexity: opts.space,
    code: opts.code,
    codeByLang: opts.codeByLang,
    execute: opts.execute,
  };
}
