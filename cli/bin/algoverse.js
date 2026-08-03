#!/usr/bin/env node
/**
 * algoverse CLI entry — boots TypeScript via tsx.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let tsxCli;
try {
  tsxCli = require.resolve("tsx/cli");
} catch {
  console.error("tsx is required to run the AlgoVerse CLI. Run: npm install");
  process.exit(1);
}

const runTs = join(__dirname, "../src/run.ts");
const child = spawn(
  process.execPath,
  [tsxCli, runTs, ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);
child.on("exit", (code) => process.exit(code ?? 1));
