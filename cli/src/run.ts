/**
 * `algoverse run <script.py>`
 *
 * 1. Runs the Python script with PYTHONPATH including sdk/python
 * 2. Discovers the written .trace.json
 * 3. Validates with @algoverse/trace
 * 4. Opens the web Trace Player (Next.js expected on :3000)
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTrace } from "@algoverse/trace";
import { openTracePlayer } from "./serve";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const SDK_PYTHON = join(REPO_ROOT, "sdk", "python");

function usage(): never {
  console.log(`AlgoVerse CLI v0.1

Usage:
  algoverse run <script.py> [--out <path>] [--port <n>] [--no-open]

Environment:
  ALGOVERSE_TRACE_OUT   Output .trace.json path
  ALGOVERSE_PLAYER_URL  Trace Player base (default http://localhost:3000/trace)
`);
  process.exit(1);
}

function parseArgs(argv: string[]) {
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") usage();
  const cmd = argv[0];
  if (cmd !== "run") {
    console.error(`Unknown command: ${cmd}`);
    usage();
  }
  const script = argv[1];
  if (!script) usage();

  let out: string | undefined;
  let port = 3000;
  let openBrowserFlag = true;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out = argv[++i];
    else if (a === "--port") port = Number(argv[++i]);
    else if (a === "--no-open") openBrowserFlag = false;
  }
  // npm workspaces change cwd to the package dir; prefer the caller's cwd.
  const base =
    process.env.INIT_CWD || process.env.PWD || process.cwd();
  return {
    script: resolve(base, script!),
    out: out ? resolve(base, out) : undefined,
    port,
    open: openBrowserFlag,
  };
}

function runPython(script: string, outPath: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const env = {
      ...process.env,
      PYTHONPATH: [SDK_PYTHON, process.env.PYTHONPATH]
        .filter(Boolean)
        .join(process.platform === "win32" ? ";" : ":"),
      ALGOVERSE_TRACE_OUT: outPath,
    };

    const py = process.platform === "win32" ? "python" : "python3";
    const child = spawn(py, [script], {
      env,
      cwd: dirname(script),
      stdio: "inherit",
    });

    child.on("error", (err) => {
      reject(
        new Error(
          `Failed to start Python (${py}): ${err.message}\nInstall Python 3 and retry.`,
        ),
      );
    });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`Python exited with code ${code}`));
    });
  });
}

function findNewestTrace(dir: string, sinceMs: number): string | null {
  if (!existsSync(dir)) return null;
  let best: { path: string; mtime: number } | null = null;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".trace.json")) continue;
    const p = join(dir, name);
    try {
      const st = statSync(p);
      if (st.mtimeMs + 50 < sinceMs) continue;
      if (!best || st.mtimeMs > best.mtime) best = { path: p, mtime: st.mtimeMs };
    } catch {
      /* skip */
    }
  }
  return best?.path ?? null;
}

export async function main(argv: string[]): Promise<void> {
  const { script, out, port, open } = parseArgs(argv);

  if (!existsSync(script)) {
    throw new Error(`Script not found: ${script}`);
  }

  const defaultOut = join(
    dirname(script),
    `${basename(script, ".py")}.trace.json`,
  );
  const outPath = resolve(out ?? process.env.ALGOVERSE_TRACE_OUT ?? defaultOut);

  console.log(`[algoverse] running ${script}`);
  const started = Date.now();
  await runPython(script, outPath);

  let tracePath = existsSync(outPath) ? outPath : null;
  if (!tracePath) {
    tracePath = findNewestTrace(dirname(script), started);
  }
  if (!tracePath || !existsSync(tracePath)) {
    throw new Error(
      `No trace file found. Expected ${outPath}. Ensure the script calls Trace.write().`,
    );
  }

  const json = readFileSync(tracePath, "utf8");
  const doc = parseTrace(json);
  console.log(
    `[algoverse] validated ${tracePath} (${doc.events.length} events, algorithm=${doc.algorithm})`,
  );

  if (open) {
    await openTracePlayer({
      tracePath,
      port,
      json,
    });
  } else {
    console.log(`[algoverse] skip open — load ${tracePath} at /trace`);
  }
}

const isDirect =
  typeof process.argv[1] === "string" &&
  (process.argv[1].endsWith("run.ts") || process.argv[1].endsWith("run.js"));
if (isDirect) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
