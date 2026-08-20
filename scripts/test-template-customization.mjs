#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadWorkspaceConfig } from "../export/workspace-config.mjs";
import { forkTemplate } from "../lib/template-customization.mjs";
import { createStarter } from "./create-starter.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "next-job-kit-template-"));

try {
  const workspace = createStarter(path.join(temporaryRoot, "workspace"), { sourceRoot: repoRoot });
  forkTemplate(workspace, "classic-timeline", "my-classic");

  const registry = JSON.parse(readFileSync(path.join(workspace, "export/templates.json"), "utf8"));
  const custom = registry.templates["my-classic"];
  assert(custom.origin === "user", "custom template must be user-owned");
  assert(custom.forked_from === "classic-timeline", "template fork origin is missing");
  assert(existsSync(path.join(workspace, custom.template)), "custom HTML is missing");
  assert(existsSync(path.join(workspace, custom.stylesheet)), "custom CSS is missing");
  assert(loadWorkspaceConfig(workspace).template.id === "my-classic", "profile did not select custom template");

  expectFailure(() => forkTemplate(workspace, "classic-timeline", "my-classic"), "existing ID collision");
  expectFailure(() => forkTemplate(workspace, "my-classic", "another-copy"), "user-owned source fork");

  const history = readFileSync(path.join(workspace, ".next-job-kit/history.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert(history.at(-1).action === "template-fork", "template decision was not logged");
  console.log("Template customization valid: built-in forked once and tracked as user-owned");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

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
