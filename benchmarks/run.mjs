/**
 * Run the full AlgoVerse baseline benchmark suite and merge JSON results.
 *
 * Usage (repo root):
 *   node benchmarks/run.mjs
 *   node benchmarks/run.mjs --sizes=100,1000
 *   npm run bench
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS = join(ROOT, "benchmarks", "results");

function ensureDir(dir) {
  // OneDrive reparse-point dirs throw EEXIST from mkdirSync(recursive) on Windows.
  if (existsSync(dir)) return;
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (!e || e.code !== "EEXIST") throw e;
  }
}

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function main() {
  ensureDir(RESULTS);
  const passthrough = process.argv.slice(2);
  const sizesArg = passthrough.find((a) => a.startsWith("--sizes="));
  const pyArgs = [join("benchmarks", "python", "bench_emit_write.py")];
  if (sizesArg) pyArgs.push("--sizes", sizesArg.slice("--sizes=".length));

  run("python", pyArgs);

  const tsArgs = [join("benchmarks", "ts", "bench_pipeline.ts")];
  if (sizesArg) tsArgs.push(sizesArg);
  run("npx", ["tsx", ...tsArgs]);

  const pyPath = join(RESULTS, "python_emit_write.json");
  const tsPath = join(RESULTS, "ts_pipeline.json");
  const merged = {
    generated_at: new Date().toISOString(),
    platform: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    python: existsSync(pyPath) ? JSON.parse(readFileSync(pyPath, "utf8")) : null,
    typescript: existsSync(tsPath)
      ? JSON.parse(readFileSync(tsPath, "utf8"))
      : null,
  };
  const out = join(RESULTS, "latest.json");
  writeFileSync(out, JSON.stringify(merged, null, 2), "utf8");
  console.log(`\n[bench] merged results → ${out}`);
  console.log("[bench] Update benchmarks/BASELINE.md with observations after reviewing numbers.");
}

main();
