import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  appendHistoryEvent,
  isManagedWorkspacePath,
  statePaths,
  strategyForPath,
  writeWorkspaceManifest,
} from "./workspace-state.mjs";

export function adoptLegacyClone(workspaceDirectory) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const gitRoot = git(workspaceRoot, ["rev-parse", "--show-toplevel"]).trim();
  if (path.resolve(gitRoot) !== workspaceRoot) {
    throw new Error("Legacy adoption requires the Next Job Kit clone root");
  }

  const remoteMain = git(workspaceRoot, ["rev-parse", "--verify", "refs/remotes/origin/main"]).trim();
  const baseCommit = git(workspaceRoot, ["merge-base", "HEAD", remoteMain]).trim();
  const tree = git(workspaceRoot, ["ls-tree", "-rz", "--full-tree", baseCommit]);
  const managedFiles = [];
  const paths = statePaths();
  const cacheRoot = path.join(workspaceRoot, paths.baseCache);
  mkdirSync(cacheRoot, { recursive: true });

  for (const record of tree.split("\0")) {
    if (!record) continue;
    const match = record.match(/^(\d+)\s+\w+\s+[0-9a-f]+\t(.+)$/s);
    if (!match) continue;
    const [, mode, relativePath] = match;
    if (!isManagedWorkspacePath(relativePath)) continue;

    const contents = git(workspaceRoot, ["show", `${baseCommit}:${relativePath}`]);
    const destination = path.join(cacheRoot, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });

    if (mode === "120000") {
      symlinkSync(contents, destination, relativePath.endsWith("/skills") ? "dir" : "file");
      managedFiles.push({
        path: relativePath,
        type: "symlink",
        strategy: "managed-symlink",
        target: contents,
        symlink_type: relativePath.endsWith("/skills") ? "dir" : "file",
      });
    } else {
      writeFileSync(destination, contents);
      managedFiles.push({
        path: relativePath,
        type: "file",
        strategy: strategyForPath(relativePath),
        sha256: createHash("sha256").update(contents).digest("hex"),
      });
    }
  }

  if (managedFiles.length === 0) {
    throw new Error("Could not recover a managed baseline from Git history");
  }

  const timestamp = new Date().toISOString();
  const manifest = {
    schema_version: 1,
    package: "next-job-kit",
    installed_version: `legacy:${baseCommit.slice(0, 12)}`,
    installed_at: timestamp,
    base_commit: baseCommit,
    managed_files: managedFiles.sort((left, right) => left.path.localeCompare(right.path)),
  };
  writeWorkspaceManifest(workspaceRoot, manifest);
  appendHistoryEvent(workspaceRoot, {
    action: "legacy-adoption",
    version: manifest.installed_version,
    base_commit: baseCommit,
    result: "completed",
    timestamp,
  });
  return manifest;
}

function git(workspaceRoot, args) {
  try {
    return execFileSync("git", ["-C", workspaceRoot, ...args], { encoding: "utf8" });
  } catch (error) {
    throw new Error(`Legacy clone baseline is unavailable: ${error.stderr?.trim() || error.message}`);
  }
}
