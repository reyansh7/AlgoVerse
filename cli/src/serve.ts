/**
 * Open the Next.js Trace Player with the generated document.
 *
 * Writes validated JSON under public/traces/ and opens
 * http://localhost:PORT/trace?src=/traces/<name>
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

export async function openTracePlayer(opts: {
  tracePath: string;
  port: number;
  json: string;
}): Promise<void> {
  const publicDir = join(REPO_ROOT, "public", "traces");
  mkdirSync(publicDir, { recursive: true });

  const name = basename(opts.tracePath).replace(/\.json$/i, "") + ".json";
  const dest = join(publicDir, name);
  // Write validated in-memory JSON (avoids partial copy races).
  writeFileSync(dest, opts.json, "utf8");

  const base =
    process.env.ALGOVERSE_PLAYER_URL ??
    `http://localhost:${opts.port}/trace`;
  // Cache-bust so the browser never serves a stale/empty public/traces file.
  const url = `${base}?src=/traces/${encodeURIComponent(name)}&t=${Date.now()}`;

  console.log(`[algoverse] opening ${url}`);
  console.log(`[algoverse] served file ${dest}`);
  if (!existsSync(join(REPO_ROOT, ".next")) && !process.env.ALGOVERSE_PLAYER_URL) {
    console.log(
      "[algoverse] tip: start the web app with `npm run dev` if the page does not load",
    );
  }
  openBrowser(url);
}
