#!/usr/bin/env node
/**
 * One-command mutation proof: backup → patch → run → restore → verify.
 *
 *   bun scripts/mutate.mjs --file src/lib/x.ts --from "a" --to "b" --run "bunx vitest run src/lib/x.test.ts"
 *
 * Repeat `--from/--to` pairs to apply several replacements to the same file.
 * Exit 0 when the command FAILS under the mutation (the guard has teeth),
 * exit 1 when it passes (dead guard), exit 2 on a usage or restore error.
 * The file is always restored and its sha256 checked against the original.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
let file;
let run;
const pairs = [];
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  const value = args[++i];
  if (flag === "--file") file = value;
  else if (flag === "--run") run = value;
  else if (flag === "--from") pairs.push({ from: value, to: undefined });
  else if (flag === "--to" && pairs.length > 0) pairs[pairs.length - 1].to = value;
  else {
    console.error(`unknown flag ${flag}`);
    process.exit(2);
  }
}
if (!file || !run || pairs.length === 0 || pairs.some((p) => p.to === undefined)) {
  console.error(
    'usage: mutate.mjs --file <path> --from "<a>" --to "<b>" [--from … --to …] --run "<cmd>"',
  );
  process.exit(2);
}

const sha = (text) => createHash("sha256").update(text).digest("hex");
const original = readFileSync(file, "utf8");
const originalHash = sha(original);

let mutated = original;
for (const { from, to } of pairs) {
  const count = mutated.split(from).length - 1;
  if (count !== 1) {
    console.error(
      `--from must match exactly once in ${file}; matched ${count}: ${JSON.stringify(from)}`,
    );
    process.exit(2);
  }
  mutated = mutated.replace(from, to);
}

const restore = () => {
  writeFileSync(file, original);
  if (sha(readFileSync(file, "utf8")) !== originalHash) {
    console.error(`RESTORE FAILED for ${file}`);
    process.exit(2);
  }
};
process.on("SIGINT", () => {
  restore();
  process.exit(2);
});

writeFileSync(file, mutated);
let passed;
try {
  execSync(run, { stdio: "inherit" });
  passed = true;
} catch {
  passed = false;
} finally {
  restore();
}

console.log(`\nrestored ${file} (sha256 ${originalHash.slice(0, 12)} verified)`);
if (passed) {
  console.log("MUTATION SURVIVED — the command passed with the mutation applied (dead guard).");
  process.exit(1);
}
console.log("MUTATION KILLED — the command failed under the mutation.");
