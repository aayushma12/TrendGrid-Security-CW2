// Strips stray NUL bytes from source files. Run if you ever see a
// "TS1127 invalid character" error caused by a flaky file sync.
//   node scripts/clean-nuls.mjs
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".prisma", ".json", ".md"]);
let cleaned = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (EXTS.has(extname(name))) {
      const buf = readFileSync(p);
      if (buf.includes(0)) {
        writeFileSync(p, buf.filter((b) => b !== 0));
        console.log("cleaned", p);
        cleaned++;
      }
    }
  }
}
walk(process.cwd());
console.log(cleaned ? `Done — cleaned ${cleaned} file(s).` : "No NUL bytes found.");
