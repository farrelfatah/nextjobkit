#!/usr/bin/env node
// Claude Code PostToolUse hook: validates the workspace right after
// profile/candidate.md changes so a broken profile is caught in the same turn.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { workspaceRelativePath, workspaceRoot } from "./workspace-path.mjs";

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path;
if (!filePath) {
  process.exit(0);
}

if (workspaceRelativePath(filePath, input.cwd) !== "profile/candidate.md") {
  process.exit(0);
}

const result = spawnSync(process.execPath, ["scripts/validate-workspace.mjs"], {
  cwd: workspaceRoot,
  encoding: "utf8",
});

if (result.status !== 0) {
  // Exit code 2 returns stderr to Claude so it can repair the profile.
  process.stderr.write(
    `${result.stderr || result.stdout}\nRepair profile/candidate.md before continuing.\n`,
  );
  process.exit(2);
}
