#!/usr/bin/env node
// Claude Code SessionStart hook: runs the quick workspace checks and adds
// context only when something needs attention, so healthy sessions stay quiet.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const findings = [];

for (const script of [
  "scripts/check-prerequisites.mjs",
  "scripts/validate-workspace.mjs",
  "scripts/validate-agent-compat.mjs",
]) {
  const result = spawnSync(process.execPath, [script], { cwd: workspaceRoot, encoding: "utf8" });
  if (result.status !== 0 || result.stderr.trim()) {
    findings.push((result.stderr || result.stdout).trim());
  }
}

if (findings.length > 0) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `Next Job Kit session check found issues. Mention them to the user before PDF or setup work:\n\n${findings.join("\n\n")}`,
      },
    }),
  );
}
