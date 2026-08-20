import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { createStarter } from "../scripts/create-starter.mjs";
import { adoptLegacyClone } from "./legacy-adoption.mjs";
import { mergeJson, mergeText } from "./merge.mjs";
import {
  appendHistoryEvent,
  captureInstalledState,
  createWorkspaceBackup,
  loadWorkspaceManifest,
  recordBackupAppliedState,
  restoreWorkspaceBackup,
  statePaths,
  writeWorkspaceManifest,
} from "./workspace-state.mjs";

export function planUpdate(workspaceDirectory, options = {}) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const sourceRoot = path.resolve(options.sourceRoot);
  ensureManifest(workspaceRoot);

  const paths = statePaths();
  const planId = randomUUID();
  const pendingRoot = path.join(workspaceRoot, paths.directory, "pending", planId);
  const incomingRoot = path.join(pendingRoot, "incoming");
  const resultRoot = path.join(pendingRoot, "result");
  mkdirSync(pendingRoot, { recursive: true });
  createStarter(incomingRoot, { sourceRoot });
  mkdirSync(resultRoot, { recursive: true });

  const baseManifest = loadWorkspaceManifest(workspaceRoot);
  const incomingManifest = loadWorkspaceManifest(incomingRoot);
  const baseEntries = new Map(baseManifest.managed_files.map((entry) => [entry.path, entry]));
  const incomingEntries = new Map(
    incomingManifest.managed_files.map((entry) => [entry.path, entry]),
  );
  const allPaths = [...new Set([...baseEntries.keys(), ...incomingEntries.keys()])].sort();
  const items = [];

  for (const relativePath of allPaths) {
    items.push(
      comparePath({
        workspaceRoot,
        incomingRoot,
        resultRoot,
        relativePath,
        baseEntry: baseEntries.get(relativePath),
        incomingEntry: incomingEntries.get(relativePath),
      }),
    );
  }

  const plan = {
    schema_version: 1,
    plan_id: planId,
    created_at: new Date().toISOString(),
    from_version: baseManifest.installed_version,
    to_version: incomingManifest.installed_version,
    installed_state: captureInstalledState(workspaceRoot),
    items,
  };
  writeFileSync(path.join(pendingRoot, "plan.json"), `${JSON.stringify(plan, null, 2)}\n`);
  return summarizePlan(plan);
}

export function applyUpdate(workspaceDirectory, planId, resolutions = {}) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const paths = statePaths();
  const pendingRoot = safePendingRoot(workspaceRoot, planId);
  const planPath = path.join(pendingRoot, "plan.json");
  if (!existsSync(planPath)) throw new Error(`Update plan not found: ${planId}`);

  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const conflicts = new Map(
    plan.items
      .filter((item) => item.action === "conflict")
      .map((item) => [item.path, item]),
  );

  for (const [relativePath, resolution] of Object.entries(resolutions)) {
    const conflictItem = conflicts.get(relativePath);
    if (!conflictItem) {
      throw new Error(`Resolution does not match an update conflict: ${relativePath}`);
    }
    if (!conflictItem.resolutions?.includes(resolution)) {
      throw new Error(`Unsupported resolution for ${relativePath}: ${resolution}`);
    }
  }

  const unresolved = plan.items.filter(
    (item) => item.action === "conflict" && !resolutions[item.path],
  );
  if (unresolved.length > 0) {
    throw new Error(`Unresolved update conflicts:\n- ${unresolved.map((item) => item.path).join("\n- ")}`);
  }

  const lockPath = path.join(workspaceRoot, paths.directory, "update.lock");
  const lock = acquireLock(lockPath);
  let backup;

  try {
    assertInstalledState(workspaceRoot, plan.installed_state);
    for (const item of plan.items) {
      assertLocalPrecondition(workspaceRoot, item.path, item.local_before);
    }

    const changes = plan.items.filter((item) => {
      if (["write", "delete"].includes(item.action)) return true;
      return item.action === "conflict" && resolutions[item.path] === "accept-incoming";
    });
    const backupPaths = [
      ...changes.map((item) => item.path),
      paths.manifest,
      paths.baseCache,
    ];
    backup = createWorkspaceBackup(workspaceRoot, backupPaths, `update:${plan.plan_id}`);
    for (const item of changes) applyItem(workspaceRoot, pendingRoot, item);
    validateWorkspace(workspaceRoot);

    const incomingRoot = path.join(pendingRoot, "incoming");
    const incomingManifest = loadWorkspaceManifest(incomingRoot);
    replaceBaseCache(workspaceRoot, path.join(incomingRoot, paths.baseCache));
    writeWorkspaceManifest(workspaceRoot, {
      ...incomingManifest,
      installed_at: loadWorkspaceManifest(workspaceRoot).installed_at,
      updated_at: new Date().toISOString(),
    });
    recordBackupAppliedState(
      workspaceRoot,
      backup.backupId,
      backupPaths,
    );

    const recordedDecisions = Object.entries(resolutions).map(([relativePath, decision]) => ({
      path: relativePath,
      decision,
    }));
    appendHistoryEvent(workspaceRoot, {
      action: "update",
      from_version: plan.from_version,
      to_version: plan.to_version,
      plan_id: plan.plan_id,
      result: "completed",
      backup_id: backup.backupId,
      decisions: recordedDecisions,
      validation: "passed",
    });

    return { ...summarizePlan(plan), applied: true, backup_id: backup.backupId };
  } catch (error) {
    if (backup) {
      restoreWorkspaceBackup(workspaceRoot, backup.backupId, { verifyCurrent: false });
      throw new Error(`Update failed and was rolled back: ${error.message}`);
    }
    throw error;
  } finally {
    closeSync(lock);
    unlinkSync(lockPath);
  }
}

export function rollbackUpdate(workspaceDirectory, backupId) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const paths = statePaths();
  const lockPath = path.join(workspaceRoot, paths.directory, "update.lock");
  const lock = acquireLock(lockPath);

  try {
    const metadata = restoreWorkspaceBackup(workspaceRoot, backupId);
    validateWorkspace(workspaceRoot);
    appendHistoryEvent(workspaceRoot, {
      action: "rollback",
      backup_id: backupId,
      restored_paths: metadata.entries.map((entry) => entry.path),
      result: "completed",
      validation: "passed",
    });
    return { backup_id: backupId, restored: metadata.entries.length };
  } finally {
    closeSync(lock);
    unlinkSync(lockPath);
  }
}

function comparePath({ workspaceRoot, incomingRoot, resultRoot, relativePath, baseEntry, incomingEntry }) {
  const localBefore = inspectPath(safeDestination(workspaceRoot, relativePath));
  const baseBefore = baseEntry ? stateFromEntry(baseEntry) : { exists: false };
  const incomingState = incomingEntry ? stateFromEntry(incomingEntry) : { exists: false };
  const common = { path: relativePath, local_before: localBefore };

  if (!baseEntry && incomingEntry) {
    if (!localBefore.exists) {
      prepareIncoming(incomingRoot, resultRoot, relativePath, incomingEntry);
      return { ...common, action: "write", reason: "new-framework-file" };
    }
    if (statesEqual(localBefore, incomingState)) return { ...common, action: "keep", reason: "already-current" };
    return conflict(common, incomingEntry, "new-file-collides-with-local-file");
  }

  if (baseEntry && !incomingEntry) {
    if (!localBefore.exists) return { ...common, action: "keep", reason: "already-removed" };
    if (statesEqual(localBefore, baseBefore)) return { ...common, action: "delete", reason: "removed-upstream" };
    return { ...common, action: "preserve", reason: "locally-modified-upstream-removal" };
  }

  if (!localBefore.exists) {
    if (statesEqual(baseBefore, incomingState)) return { ...common, action: "keep", reason: "local-deletion-preserved" };
    return conflict(common, incomingEntry, "local-file-deleted-while-upstream-changed");
  }

  if (statesEqual(localBefore, baseBefore)) {
    if (statesEqual(baseBefore, incomingState)) return { ...common, action: "keep", reason: "unchanged" };
    prepareIncoming(incomingRoot, resultRoot, relativePath, incomingEntry);
    return { ...common, action: "write", reason: "upstream-changed" };
  }

  if (statesEqual(incomingState, baseBefore) || statesEqual(localBefore, incomingState)) {
    return { ...common, action: "keep", reason: "local-change-preserved" };
  }

  if (baseEntry.type !== "file" || incomingEntry.type !== "file" || localBefore.type !== "file") {
    return conflict(common, incomingEntry, "incompatible-file-types");
  }

  if (["three-way-text", "semantic-json"].includes(baseEntry.strategy)) {
    const baseSource = readFileSync(path.join(workspaceRoot, statePaths().baseCache, relativePath), "utf8");
    const localSource = readFileSync(path.join(workspaceRoot, relativePath), "utf8");
    const incomingSource = readFileSync(path.join(incomingRoot, relativePath), "utf8");
    const merged =
      baseEntry.strategy === "semantic-json"
        ? mergeJson(baseSource, localSource, incomingSource)
        : mergeText(baseSource, localSource, incomingSource);

    if (merged.clean) {
      if (merged.value === localSource) return { ...common, action: "keep", reason: "merged-to-local" };
      writePreparedResult(resultRoot, relativePath, merged.value);
      return { ...common, action: "write", reason: "clean-three-way-merge" };
    }
    return conflict(common, incomingEntry, "overlapping-three-way-changes", merged.conflicts);
  }

  const reason =
    baseEntry.strategy === "built-in-template"
      ? "built-in-template-modified-fork-before-accepting-upstream"
      : "both-local-and-upstream-changed";
  return conflict(common, incomingEntry, reason);
}

function conflict(common, incomingEntry, reason, details = []) {
  return {
    ...common,
    action: "conflict",
    reason,
    incoming_type: incomingEntry?.type || "missing",
    resolutions: ["keep-local", "accept-incoming"],
    recommendation: reason.startsWith("built-in-template") ? "fork-template-then-accept-incoming" : "review",
    details,
  };
}

function prepareIncoming(incomingRoot, resultRoot, relativePath, entry) {
  const source = path.join(incomingRoot, relativePath);
  const destination = path.join(resultRoot, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (entry.type === "symlink") symlinkSync(entry.target, destination, entry.symlink_type || "file");
  else copyFileSync(source, destination);
}

function writePreparedResult(resultRoot, relativePath, contents) {
  const destination = path.join(resultRoot, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

function applyItem(workspaceRoot, pendingRoot, item) {
  const destination = safeDestination(workspaceRoot, item.path);
  if (item.action === "delete") {
    rmSync(destination, { recursive: true, force: true });
    return;
  }

  const prepared =
    item.action === "write"
      ? path.join(pendingRoot, "result", item.path)
      : path.join(pendingRoot, "incoming", item.path);
  const state = inspectPath(prepared);
  mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.next-job-kit-${randomUUID()}`;
  if (state.type === "symlink") symlinkSync(state.target, temporary, item.path.endsWith("/skills") ? "dir" : "file");
  else copyFileSync(prepared, temporary);
  rmSync(destination, { recursive: true, force: true });
  renameSync(temporary, destination);
}

function inspectPath(absolutePath) {
  if (!existsSync(absolutePath) && !isSymlink(absolutePath)) return { exists: false };
  const stats = lstatSync(absolutePath);
  if (stats.isSymbolicLink()) return { exists: true, type: "symlink", target: readlinkSync(absolutePath) };
  if (!stats.isFile()) return { exists: true, type: "other" };
  return {
    exists: true,
    type: "file",
    sha256: createHash("sha256").update(readFileSync(absolutePath)).digest("hex"),
  };
}

function stateFromEntry(entry) {
  return entry.type === "symlink"
    ? { exists: true, type: "symlink", target: entry.target }
    : { exists: true, type: "file", sha256: entry.sha256 };
}

function statesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertLocalPrecondition(workspaceRoot, relativePath, expected) {
  const actual = inspectPath(safeDestination(workspaceRoot, relativePath));
  if (!statesEqual(actual, expected)) throw new Error(`Workspace changed after dry-run: ${relativePath}`);
}

function assertInstalledState(workspaceRoot, expected) {
  if (!expected || !statesEqual(captureInstalledState(workspaceRoot), expected)) {
    throw new Error("Installed Next Job Kit state changed after dry-run; create a new update plan");
  }
}

function replaceBaseCache(workspaceRoot, incomingCache) {
  const destination = path.join(workspaceRoot, statePaths().baseCache);
  const temporary = `${destination}-${randomUUID()}`;
  cpSync(incomingCache, temporary, { recursive: true, verbatimSymlinks: true });
  rmSync(destination, { recursive: true, force: true });
  renameSync(temporary, destination);
}

function validateWorkspace(workspaceRoot) {
  for (const script of [
    "validate-workspace.mjs",
    "validate-agent-compat.mjs",
    "validate-skills.mjs",
    "validate-template.mjs",
    "validate-fixtures.mjs",
  ]) {
    execFileSync(process.execPath, [path.join(workspaceRoot, "scripts", script)], {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
  }
}

function summarizePlan(plan) {
  const counts = {};
  for (const item of plan.items) counts[item.action] = (counts[item.action] || 0) + 1;
  return {
    plan_id: plan.plan_id,
    from_version: plan.from_version,
    to_version: plan.to_version,
    counts,
    conflicts: plan.items.filter((item) => item.action === "conflict"),
    preserved: plan.items.filter((item) => item.action === "preserve"),
  };
}

function safePendingRoot(workspaceRoot, planId) {
  if (!/^[0-9a-f-]{36}$/.test(planId)) throw new Error(`Invalid update plan ID: ${planId}`);
  return path.join(workspaceRoot, statePaths().directory, "pending", planId);
}

function safeDestination(workspaceRoot, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith("../")) {
    throw new Error(`Managed path escapes workspace: ${relativePath}`);
  }
  const destination = path.resolve(workspaceRoot, relativePath);
  if (!destination.startsWith(`${workspaceRoot}${path.sep}`)) throw new Error(`Managed path escapes workspace: ${relativePath}`);
  let current = path.dirname(destination);
  while (current !== workspaceRoot) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Managed path crosses a local symlink: ${relativePath}`);
    }
    current = path.dirname(current);
  }
  return destination;
}

function acquireLock(lockPath) {
  mkdirSync(path.dirname(lockPath), { recursive: true });
  try {
    const descriptor = openSync(lockPath, "wx");
    writeFileSync(
      descriptor,
      `${JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() })}\n`,
    );
    return descriptor;
  } catch (error) {
    if (error.code !== "EEXIST" || lockIsActive(lockPath)) {
      throw new Error("Another Next Job Kit update or rollback is already running");
    }
    unlinkSync(lockPath);
    return acquireLock(lockPath);
  }
}

function lockIsActive(lockPath) {
  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    if (!Number.isInteger(lock.pid) || lock.pid < 1) return false;
    process.kill(lock.pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function ensureManifest(workspaceRoot) {
  try {
    loadWorkspaceManifest(workspaceRoot);
  } catch (error) {
    if (!error.message.includes("manifest not found")) throw error;
    adoptLegacyClone(workspaceRoot);
  }
}

function isSymlink(absolutePath) {
  try {
    return lstatSync(absolutePath).isSymbolicLink();
  } catch {
    return false;
  }
}
