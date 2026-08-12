#!/usr/bin/env node
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceConfig } from "../export/workspace-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(repoRoot, "evals/fixtures/product-designer/workspace");
const runtimeRoot = mkdtempSync(path.join(tmpdir(), "next-job-kit-fixture-"));

try {
  cpSync(path.join(repoRoot, "export"), path.join(runtimeRoot, "export"), { recursive: true });
  cpSync(fixtureRoot, runtimeRoot, { recursive: true });

  const workspace = loadWorkspaceConfig(runtimeRoot);
  if (workspace.values.candidate_slug !== "maya-chen") {
    throw new Error(`unexpected fixture candidate: ${workspace.values.candidate_slug}`);
  }

  console.log("Synthetic fixture valid: product-designer workspace resolves cleanly");
} catch (error) {
  console.error(`Fixture validation failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(runtimeRoot, { recursive: true, force: true });
}
