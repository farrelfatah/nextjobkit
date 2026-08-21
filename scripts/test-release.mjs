#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractReleaseNotes } from "./release-notes.mjs";
import { validateRelease } from "./validate-release.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const tag = `v${packageJson.version}`;

assert(validateRelease(repoRoot, tag) === packageJson.version, "current release contract is invalid");
expectFailure(() => validateRelease(repoRoot, "v9.9.9"), "mismatched release tag");
const releaseNotes = extractReleaseNotes(repoRoot, tag);
assert(releaseNotes.startsWith(`## [${packageJson.version}]`), "release notes heading is incorrect");
assert(/^### (Added|Changed|Deprecated|Removed|Fixed|Security)$/m.test(releaseNotes), "release notes have no recognized category");

const lock = JSON.parse(readFileSync(path.join(repoRoot, "package-lock.json"), "utf8"));
assert(lock.version === packageJson.version, "package-lock version differs from package.json");
for (const workflow of ["ci.yml", "release.yml"]) {
  assert(existsSync(path.join(repoRoot, ".github/workflows", workflow)), `missing ${workflow}`);
}

const releaseWorkflow = readFileSync(path.join(repoRoot, ".github/workflows/release.yml"), "utf8");
for (const requirement of [
  "id-token: write",
  "npm publish",
  "validate-release.mjs",
  "release-notes.mjs",
  "gh release create",
  "gh release edit",
  "working-directory: ${{ runner.temp }}",
  'if existing_sha="$(npm view',
  "for attempt in {1..12}",
  "npm metadata did not propagate after 12 attempts",
  "Published CLI reported unexpected version",
  "Published CLI did not become installable after 12 attempts",
  "Waiting for npm install resolver to propagate",
  "sleep 5",
]) {
  assert(releaseWorkflow.includes(requirement), `release workflow is missing ${requirement}`);
}

console.log(`Release automation valid: ${tag} matches package, lockfile, changelog, npm, and GitHub gates`);

function expectFailure(callback, label) {
  let failed = false;
  try {
    callback();
  } catch {
    failed = true;
  }
  assert(failed, `${label} should fail`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
