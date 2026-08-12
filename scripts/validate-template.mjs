#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(repoRoot, "export/template-baseline.json");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const failures = [];

for (const [templateId, entries] of Object.entries(baseline)) {
  for (const [kind, expected] of Object.entries(entries)) {
    const filePath = path.resolve(repoRoot, expected.path);

    if (!existsSync(filePath)) {
      failures.push(`${templateId} ${kind} is missing: ${expected.path}`);
      continue;
    }

    const actual = createHash("sha256").update(readFileSync(filePath)).digest("hex");

    if (actual !== expected.sha256) {
      failures.push(
        `${templateId} ${kind} changed: expected ${expected.sha256}, received ${actual}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`Template validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Template valid: classic-timeline matches the approved baseline");
