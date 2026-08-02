import fs from "node:fs";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");

function rm(target) {
  if (!fs.existsSync(target)) {
    console.log(`skip (missing): ${target}`);
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed: ${target}`);
}

rm(nextDir);
console.log("Dev cache cleared. Run: npm run dev");
