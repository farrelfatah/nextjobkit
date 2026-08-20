#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const stateRoot = path.join(repoRoot, ".next-job-kit");

if (!existsSync(stateRoot)) {
  if (packageJson.private === true) {
    console.error("Workspace state invalid: .next-job-kit/manifest.json is missing");
    process.exit(1);
  }
  console.log("Workspace state valid: maintainer checkout does not require an installed manifest");
  process.exit(0);
}

const failures = [];
const manifestPath = path.join(stateRoot, "manifest.json");
const historyPath = path.join(stateRoot, "history.jsonl");
if (!existsSync(manifestPath)) failures.push("manifest.json is missing");
if (!existsSync(historyPath)) failures.push("history.jsonl is missing");

if (failures.length === 0) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schema_version !== 1 || manifest.package !== "next-job-kit") {
    failures.push("manifest.json uses an unsupported schema");
  }
  if (!Array.isArray(manifest.managed_files)) failures.push("manifest managed_files must be an array");

  for (const entry of manifest.managed_files || []) {
    if (path.isAbsolute(entry.path) || entry.path.startsWith("../")) {
      failures.push(`managed path escapes the workspace: ${entry.path}`);
      continue;
    }
    const cached = path.join(stateRoot, "base-cache", entry.path);
    if (!existsSync(cached) && !isSymlink(cached)) {
      failures.push(`base cache entry is missing: ${entry.path}`);
      continue;
    }
    if (entry.type === "symlink") {
      if (!isSymlink(cached) || readlinkSync(cached) !== entry.target) {
        failures.push(`base cache symlink changed: ${entry.path}`);
      }
    } else {
      const hash = createHash("sha256").update(readFileSync(cached)).digest("hex");
      if (hash !== entry.sha256) failures.push(`base cache hash changed: ${entry.path}`);
    }
  }

  const forbidden = /"(?:prompt|content|diff|absolute_path)"\s*:/;
  for (const [index, line] of readFileSync(historyPath, "utf8").split("\n").entries()) {
    if (!line) continue;
    try {
      JSON.parse(line);
      if (forbidden.test(line)) failures.push(`history line ${index + 1} contains forbidden content`);
      if (line.includes(`${repoRoot}${path.sep}`)) {
        failures.push(`history line ${index + 1} contains an absolute workspace path`);
      }
    } catch {
      failures.push(`history line ${index + 1} is not valid JSON`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Workspace state invalid:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Workspace state valid: manifest, base cache, and privacy-safe history agree");

function isSymlink(filePath) {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}
