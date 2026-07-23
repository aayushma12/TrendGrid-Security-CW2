// Wraps `next dev` so the storefront opens in your default browser
// automatically once the server is actually ready, instead of you having
// to remember the URL and open it by hand. Reads the real port back out of
// Next's own startup output rather than assuming 3000 — Next silently picks
// the next free port if 3000 is already taken, so hardcoding it would open
// the wrong tab (or nothing at all).
import { spawn } from "node:child_process";
import open from "open";

// `shell: true` with a single command string (rather than a separate args
// array) is what's needed to run the `next` binary's platform shim
// (next.cmd on Windows) without Node's "unescaped args" deprecation warning.
const extraArgs = process.argv.slice(2).join(" ");
const child = spawn(`next dev${extraArgs ? ` ${extraArgs}` : ""}`, {
  cwd: process.cwd(),
  stdio: ["inherit", "pipe", "inherit"],
  shell: true,
});

let opened = false;
const portPattern = /localhost:(\d+)/;

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);

  if (!opened) {
    const match = text.match(portPattern);
    if (match) {
      opened = true;
      const url = `http://localhost:${match[1]}`;
      open(url).catch(() => {
        console.warn(`\nCouldn't auto-open the browser — open ${url} manually.`);
      });
    }
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
    process.exit();
  });
}

child.on("exit", (code) => process.exit(code ?? 0));
