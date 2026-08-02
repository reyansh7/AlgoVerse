import type { ReferenceSolution } from "@/problems/types";

export type EditorLanguage = "typescript" | "java" | "python" | "cpp";

export const EDITOR_LANGUAGES: Array<{
  id: EditorLanguage;
  label: string;
  monaco: string;
}> = [
  { id: "typescript", label: "TypeScript", monaco: "typescript" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "cpp", label: "C++", monaco: "cpp" },
];

/** Resolve display code for the editor (override → auto-translate from TS). */
export function getSolutionCode(
  solution: Pick<ReferenceSolution, "code" | "codeByLang">,
  lang: EditorLanguage,
): string {
  if (lang === "typescript") return solution.code.trim();
  const override = solution.codeByLang?.[lang];
  if (override?.trim()) return override.trim();
  return translateTypeScript(solution.code, lang);
}

function stripTypes(ts: string): string {
  return ts
    .replace(/:\s*[A-Za-z0-9_<>,\[\]\s|&{}?]+(?=\s*[=,)\n{])/g, "")
    .replace(/\bas\s+[A-Za-z0-9_<>,\[\]\s|]+/g, "")
    .replace(/<[A-Za-z0-9_,\s]+>/g, "");
}

function bodyToPython(body: string): string {
  let s = stripTypes(body);
  s = s
    .replace(/\bconst\b|\blet\b|\bvar\b/g, "")
    .replace(/\bnull\b/g, "None")
    .replace(/\bundefined\b/g, "None")
    .replace(/\btrue\b/g, "True")
    .replace(/\bfalse\b/g, "False")
    .replace(/===/g, "==")
    .replace(/!==/g, "!=")
    .replace(/&&/g, " and ")
    .replace(/\|\|/g, " or ")
    .replace(/!/g, " not ")
    .replace(/;/g, "")
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    .replace(/\bMath\.floor\(/g, "math.floor(")
    .replace(/\bMath\.ceil\(/g, "math.ceil(")
    .replace(/\bMath\.max\(/g, "max(")
    .replace(/\bMath\.min\(/g, "min(")
    .replace(/\bMath\.abs\(/g, "abs(")
    .replace(/\.length\b/g, ".__len__()")
    .replace(/\.push\(/g, ".append(")
    .replace(/\.pop\(\)/g, ".pop()")
    .replace(/new Map\(/g, "dict(")
    .replace(/new Set\(/g, "set(")
    .replace(/Array\((\w+)\)\.fill\(([^)]*)\)/g, "[$2] * $1");

  // Very light brace-less cleanup — keep readable study code
  return s
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line, i, arr) => line.trim() || (i > 0 && arr[i - 1].trim()))
    .join("\n");
}

function bodyToJava(body: string): string {
  return stripTypes(body)
    .replace(/\bconst\b|\blet\b|\bvar\b/g, "")
    .replace(/\bnull\b/g, "null")
    .replace(/\bundefined\b/g, "null")
    .replace(/===/g, "==")
    .replace(/!==/g, "!=")
    .replace(/\bMath\.floor\(/g, "(int)Math.floor(")
    .replace(/\.length\b/g, ".length")
    .replace(/\.push\(/g, ".add(")
    .replace(/new Map\(/g, "new HashMap<>(")
    .replace(/new Set\(/g, "new HashSet<>(")
    .replace(/Array\((\w+)\)\.fill\(([^)]*)\)/g, "/* fill array size $1 with $2 */")
    .replace(/\bfunction\b/g, "");
}

function bodyToCpp(body: string): string {
  return stripTypes(body)
    .replace(/\bconst\b|\blet\b|\bvar\b/g, "auto ")
    .replace(/\bnull\b|\bundefined\b/g, "nullptr")
    .replace(/===/g, "==")
    .replace(/!==/g, "!=")
    .replace(/\bMath\.floor\(/g, "floor(")
    .replace(/\bMath\.ceil\(/g, "ceil(")
    .replace(/\bMath\.max\(/g, "max(")
    .replace(/\bMath\.min\(/g, "min(")
    .replace(/\bMath\.abs\(/g, "abs(")
    .replace(/\.length\b/g, ".size()")
    .replace(/\.push\(/g, ".push_back(")
    .replace(/new Map\(/g, "unordered_map<int,int>(")
    .replace(/new Set\(/g, "unordered_set<int>(")
    .replace(/\bfunction\b/g, "");
}

function extractFunction(ts: string): {
  name: string;
  params: string;
  body: string;
  full: string;
} | null {
  const m = ts.match(
    /function\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)(?:\s*:\s*[^{]+)?\s*\{([\s\S]*)\}\s*$/,
  );
  if (!m) return null;
  return { name: m[1], params: m[2], body: m[3], full: ts };
}

function pythonParams(params: string): string {
  return params
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const name = p.split(":")[0]?.trim().replace(/\?$/, "") ?? p;
      return name;
    })
    .join(", ");
}

function javaParams(params: string): string {
  return params
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [namePart, typePart] = p.split(":").map((s) => s.trim());
      const name = namePart.replace(/\?$/, "");
      const t = (typePart ?? "int").replace(/\s+/g, "");
      if (t.includes("number[]") || t.includes("number[]")) return `int[] ${name}`;
      if (t.includes("string[]")) return `String[] ${name}`;
      if (t.includes("string")) return `String ${name}`;
      if (t.includes("boolean")) return `boolean ${name}`;
      if (t.includes("number")) return `int ${name}`;
      if (t.includes("[][]")) return `int[][] ${name}`;
      return `int ${name}`;
    })
    .join(", ");
}

function cppParams(params: string): string {
  return params
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [namePart, typePart] = p.split(":").map((s) => s.trim());
      const name = namePart.replace(/\?$/, "");
      const t = (typePart ?? "int").replace(/\s+/g, "");
      if (t.includes("number[][]")) return `vector<vector<int>>& ${name}`;
      if (t.includes("number[]")) return `vector<int>& ${name}`;
      if (t.includes("string[]")) return `vector<string>& ${name}`;
      if (t.includes("string")) return `string ${name}`;
      if (t.includes("boolean")) return `bool ${name}`;
      if (t.includes("number")) return `int ${name}`;
      return `int ${name}`;
    })
    .join(", ");
}

function inferReturnJava(ts: string): string {
  if (/:\s*boolean/.test(ts) || /\breturn\s+(true|false)\b/.test(ts)) return "boolean";
  if (/:\s*string\b/.test(ts)) return "String";
  if (/:\s*number\[\]/.test(ts) || /return\s*\[/.test(ts)) return "int[]";
  if (/:\s*number\b/.test(ts)) return "int";
  if (/:\s*void/.test(ts)) return "void";
  return "int";
}

function inferReturnCpp(ts: string): string {
  if (/:\s*boolean/.test(ts)) return "bool";
  if (/:\s*string\b/.test(ts)) return "string";
  if (/:\s*number\[\]/.test(ts)) return "vector<int>";
  if (/:\s*number\b/.test(ts)) return "int";
  if (/:\s*void/.test(ts)) return "void";
  return "int";
}

function translateTypeScript(tsCode: string, lang: EditorLanguage): string {
  const ts = tsCode.trim();
  const fn = extractFunction(ts);

  if (lang === "python") {
    if (!fn) {
      return `# Auto-translated study stub from TypeScript reference.
# Edit freely — Animate still runs the curated engine, not this buffer.

${bodyToPython(ts)}
`;
    }
    const params = pythonParams(fn.params);
    const body = bodyToPython(fn.body)
      .split("\n")
      .map((line) => (line.trim() ? `        ${line.trim()}` : ""))
      .join("\n");
    return `from typing import List, Optional
import math

class Solution:
    def ${toSnake(fn.name)}(self${params ? `, ${params}` : ""}):
${body || "        pass"}
`;
  }

  if (lang === "java") {
    if (!fn) {
      return `// Auto-translated study stub from TypeScript reference.
// Edit freely — Animate still runs the curated engine, not this buffer.

class Solution {
${bodyToJava(ts)
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
}
`;
    }
    const ret = inferReturnJava(ts);
    const params = javaParams(fn.params);
    const body = bodyToJava(fn.body)
      .split("\n")
      .map((line) => (line.trim() ? `        ${line.trim()}` : ""))
      .join("\n");
    return `import java.util.*;

class Solution {
    public ${ret} ${fn.name}(${params}) {
${body || "        // ..."}
    }
}
`;
  }

  // cpp
  if (!fn) {
    return `// Auto-translated study stub from TypeScript reference.
// Edit freely — Animate still runs the curated engine, not this buffer.

class Solution {
public:
${bodyToCpp(ts)
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
};
`;
  }
  const ret = inferReturnCpp(ts);
  const params = cppParams(fn.params);
  const body = bodyToCpp(fn.body)
    .split("\n")
    .map((line) => (line.trim() ? `        ${line.trim()}` : ""))
    .join("\n");
  return `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ${ret} ${fn.name}(${params}) {
${body || "        // ..."}
    }
};
`;
}

function toSnake(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}
