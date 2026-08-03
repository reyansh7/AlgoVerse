/**
 * Open the Next.js Trace Player with the generated document.
 *
 * Writes validated JSON under public/traces/ and opens
 * http://localhost:PORT/trace?src=/traces/<name>
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function openBrowser(url: string): void {
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
  } else if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" });
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
  }
}

async function probePlayer(port: number): Promise<boolean> {
  const url = `http://127.0.0.1:${port}/trace`;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 800);
    const res = await fetch(url, { signal: ac.signal, method: "GET" });
    clearTimeout(t);
    return res.ok || res.status === 404 || res.status < 500;
  } catch {
    return false;
  }
}

export async function openTracePlayer(opts: {
  tracePath: string;
  port: number;
  json: string;
}): Promise<void> {
  const publicDir = join(REPO_ROOT, "public", "traces");
  mkdirSync(publicDir, { recursive: true });

  const name = basename(opts.tracePath).replace(/\.json$/i, "") + ".json";
  const dest = join(publicDir, name);
  writeFileSync(dest, opts.json, "utf8");

  const base =
    process.env.ALGOVERSE_PLAYER_URL ??
    `http://localhost:${opts.port}/trace`;
  const url = `${base}?src=/traces/${encodeURIComponent(name)}&t=${Date.now()}`;

  console.log(`[algoverse] opening ${url}`);
  console.log(`[algoverse] served file ${dest}`);

  if (!process.env.ALGOVERSE_PLAYER_URL) {
    const up = await probePlayer(opts.port);
    if (!up) {
      console.log(
        `[algoverse] tip: Trace Player does not appear to be running on :${opts.port}. Start it with: npm run dev`,
      );
    }
  }

  openBrowser(url);
}
