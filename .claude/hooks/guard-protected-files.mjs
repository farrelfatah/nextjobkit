#!/usr/bin/env node
// Claude Code PreToolUse hook: asks the user before an edit touches a locked
// built-in template file, internal update metadata, or an archived artifact.
// It never blocks outright; approval in the prompt is the template-change approval.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { workspaceRelativePath, workspaceRoot } from "./workspace-path.mjs";

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path || input?.tool_input?.notebook_path;
if (!filePath) {
  process.exit(0);
}

const relativePath = workspaceRelativePath(filePath, input.cwd);
const reason = relativePath && protectionReason(relativePath);

if (reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
}

function protectionReason(relative) {
  if (lockedTemplatePaths().includes(relative)) {
    return `${relative} is a locked built-in template file. Approve only for a deliberate template change; to customize, fork it with next-job-kit template fork instead.`;
  }

  if (relative.startsWith(".next-job-kit/")) {
    return `${relative} is internal update metadata. It should change only through the next-job-kit update command.`;
  }

  if (relative.startsWith("archive/") && existsSync(path.join(workspaceRoot, relative))) {
    return `${relative} is an archived artifact. Submitted versions are preserved, not overwritten.`;
  }

  return null;
}

function lockedTemplatePaths() {
  try {
    const baseline = JSON.parse(
      readFileSync(path.join(workspaceRoot, "export/template-baseline.json"), "utf8"),
    );
    return Object.values(baseline).flatMap((entries) =>
      Object.values(entries).map((entry) => entry.path),
    );
  } catch {
    return [];
  }
}
