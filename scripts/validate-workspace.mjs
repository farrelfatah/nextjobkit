#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceConfig } from "../export/workspace-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  const workspace = loadWorkspaceConfig(repoRoot);
  const failures = [];

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workspace.values.candidate_slug)) {
    failures.push("candidate_slug must use lowercase kebab-case");
  }

  for (const [label, filePath] of [
    ["master resume", workspace.masterResumePath],
    ["resume evidence", workspace.resumeEvidencePath],
    ["application tracker", workspace.applicationTrackerPath],
  ]) {
    if (!existsSync(filePath)) {
      failures.push(`${label} not found: ${path.relative(repoRoot, filePath)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n- "));
  }

  console.log("Workspace valid");
  console.log(`Candidate: ${workspace.values.candidate_name}`);
  console.log(`Template: ${workspace.template.id}`);
} catch (error) {
  console.error(`Workspace validation failed:\n- ${error.message}`);
  process.exit(1);
}
