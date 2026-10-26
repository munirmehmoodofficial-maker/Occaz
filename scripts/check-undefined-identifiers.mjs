/**
 * Undefined-identifier guard.
 *
 * `tsc --noEmit` does NOT catch a bare identifier that was never imported
 * (e.g. using `Clock` from lucide without importing it) unless the project
 * has `strict` / `noImplicitAny` enabled. That mistake ships as a
 * `ReferenceError: X is not defined` at runtime.
 *
 * This script compiles with strict mode on and fails the build if any
 * TS2304 ("Cannot find name 'X'") error appears. TS2304 is the ONLY code
 * we treat as fatal — other strict-mode findings (implicit any, unused
 * vars) are pre-existing noise and do not block the build.
 *
 * The temporary tsconfig is written INSIDE the project (not /tmp) so that
 * `types: ["vite/client"]` and node_modules resolution still work.
 *
 * Usage: node scripts/check-undefined-identifiers.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsconfigPath = join(root, "tsconfig.app.json");
const tmpConfig = join(root, "tsconfig.strict-check.json");

const original = readFileSync(tsconfigPath, "utf-8");

let output = "";
try {
  // Strict mode on; unused-var checks off (noise for our purpose).
  const strictConfig = original
    .replace(/"noUnusedLocals":\s*true,?/g, "")
    .replace(/"noUnusedParameters":\s*true,?/g, "")
    .replace(/"strict":\s*true,?/g, "")
    .replace(/"noImplicitAny":\s*true,?/g, "")
    .replace(/\{/, '{\n    "strict": true,\n    "noImplicitAny": true,');

  writeFileSync(tmpConfig, strictConfig);

  try {
    execSync(`npx tsc --noEmit -p ${JSON.stringify(tmpConfig)}`, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    output = "";
  } catch (err) {
    output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  }
} finally {
  writeFileSync(tsconfigPath, original);
  try {
    unlinkSync(tmpConfig);
  } catch {}
}

// TS2304 = "Cannot find name 'X'" (no suggestion)
// TS2552 = "Cannot find name 'X'. Did you mean 'Y'?" (with suggestion)
// Both mean the identifier is not in scope -> ReferenceError at runtime.
const fatal = output
  .split("\n")
  .filter((line) => /error TS(2304|2552):/.test(line));

if (fatal.length > 0) {
  console.error(
    "\n✖ Build blocked: undefined identifier(s) found.\n" +
      "  These would throw `ReferenceError: X is not defined` at runtime.\n\n",
  );
  for (const line of fatal) console.error("  " + line.trim());
  console.error("\n  Fix: import the missing symbol, or check that it is in scope.\n");
  process.exit(1);
}

console.log("✔ No undefined identifiers.");
