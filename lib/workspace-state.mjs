import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  cpSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const STATE_DIRECTORY = ".next-job-kit";
const MANIFEST_PATH = `${STATE_DIRECTORY}/manifest.json`;
const HISTORY_PATH = `${STATE_DIRECTORY}/history.jsonl`;
const BASE_CACHE_PATH = `${STATE_DIRECTORY}/base-cache`;

const MANAGED_ROOTS = [
  ".agents/skills",
  ".claude/skills",
  ".gitignore",
  "AGENTS.md",
  "CLAUDE.md",
  "LICENSE",
  "README.md",
  "export",
  "package.json",
  "scripts",
  "templates",
  "tests/fixtures",
];

export function initializeWorkspaceState(workspaceDirectory, installedVersion) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const stateRoot = path.join(workspaceRoot, STATE_DIRECTORY);

  if (existsSync(path.join(workspaceRoot, MANIFEST_PATH))) {
    throw new Error(`${MANIFEST_PATH} already exists`);
  }

  mkdirSync(stateRoot, { recursive: true });
  const managedFiles = collectManagedFiles(workspaceRoot);
  cacheBaseFiles(workspaceRoot, managedFiles);

  const timestamp = new Date().toISOString();
  const manifest = {
    schema_version: 1,
    package: "next-job-kit",
    installed_version: installedVersion,
    installed_at: timestamp,
    managed_files: managedFiles,
  };

  writeFileSync(path.join(workspaceRoot, MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`);
  appendHistoryEvent(workspaceRoot, {
    action: "init",
    version: installedVersion,
    result: "completed",
    timestamp,
  });

  return manifest;
}

export function loadWorkspaceManifest(workspaceDirectory) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const manifestPath = path.join(workspaceRoot, MANIFEST_PATH);

  if (!existsSync(manifestPath)) {
    throw new Error(`Next Job Kit manifest not found: ${MANIFEST_PATH}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (
    manifest.schema_version !== 1 ||
    manifest.package !== "next-job-kit" ||
    !Array.isArray(manifest.managed_files)
  ) {
    throw new Error(`Unsupported or invalid Next Job Kit manifest: ${MANIFEST_PATH}`);
  }

  return manifest;
}

export function writeWorkspaceManifest(workspaceDirectory, manifest) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  writeFileSync(
    path.join(workspaceRoot, MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

export function appendHistoryEvent(workspaceDirectory, event) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const stateRoot = path.join(workspaceRoot, STATE_DIRECTORY);

  if (!existsSync(stateRoot)) {
    return;
  }

  const record = {
    event_id: randomUUID(),
    timestamp: event.timestamp || new Date().toISOString(),
    ...event,
  };
  delete record.prompt;
  delete record.content;
  delete record.diff;

  appendFileSync(path.join(workspaceRoot, HISTORY_PATH), `${JSON.stringify(record)}\n`);
}

export function collectManagedFiles(workspaceDirectory) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const files = [];

  for (const managedRoot of MANAGED_ROOTS) {
    const absolutePath = path.join(workspaceRoot, managedRoot);
    if (existsSync(absolutePath)) {
      walkManagedPath(workspaceRoot, absolutePath, files);
    }
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

export function cacheBaseFiles(workspaceDirectory, managedFiles) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const cacheRoot = path.join(workspaceRoot, BASE_CACHE_PATH);
  mkdirSync(cacheRoot, { recursive: true });

  for (const entry of managedFiles) {
    const source = path.join(workspaceRoot, entry.path);
    const destination = path.join(cacheRoot, entry.path);
    mkdirSync(path.dirname(destination), { recursive: true });

    if (entry.type === "symlink") {
      if (!existsSync(destination)) {
        symlinkSync(entry.target, destination, entry.symlink_type || "file");
      }
    } else {
      copyFileSync(source, destination);
    }
  }
}

export function createWorkspaceBackup(workspaceDirectory, relativePaths, reason = "update") {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const backupId = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}`;
  const backupRoot = path.join(workspaceRoot, STATE_DIRECTORY, "backups", backupId);
  const entries = [];

  mkdirSync(backupRoot, { recursive: true });

  for (const relativePath of [...new Set(relativePaths)].sort()) {
    const normalizedPath = assertRelativeWorkspacePath(relativePath);
    const source = safeWorkspacePath(workspaceRoot, normalizedPath);
    const destination = path.join(backupRoot, "files", normalizedPath);
    const exists = existsSync(source);
    entries.push({ path: normalizedPath, existed: exists });

    if (!exists) {
      continue;
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true, verbatimSymlinks: true });
  }

  writeFileSync(
    path.join(backupRoot, "backup.json"),
    `${JSON.stringify(
      {
        schema_version: 1,
        backup_id: backupId,
        created_at: new Date().toISOString(),
        reason,
        entries,
      },
      null,
      2,
    )}\n`,
  );

  return { backupId, backupRoot, entries };
}

export function recordBackupAppliedState(workspaceDirectory, backupId, relativePaths) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const backupRoot = backupDirectory(workspaceRoot, backupId);
  const metadataPath = path.join(backupRoot, "backup.json");
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  const tracked = new Set(relativePaths.map(assertRelativeWorkspacePath));

  for (const entry of metadata.entries) {
    if (tracked.has(entry.path)) {
      entry.applied_state = inspectPathState(safeWorkspacePath(workspaceRoot, entry.path));
    }
  }

  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

export function captureInstalledState(workspaceDirectory) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  return {
    manifest: inspectPathState(safeWorkspacePath(workspaceRoot, MANIFEST_PATH)),
    base_cache: inspectPathState(safeWorkspacePath(workspaceRoot, BASE_CACHE_PATH)),
  };
}

export function restoreWorkspaceBackup(workspaceDirectory, backupId, options = {}) {
  const workspaceRoot = path.resolve(workspaceDirectory);
  const backupRoot = backupDirectory(workspaceRoot, backupId);
  const metadataPath = path.join(backupRoot, "backup.json");
  if (!existsSync(metadataPath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  if (metadata.schema_version !== 1 || !Array.isArray(metadata.entries)) {
    throw new Error(`Invalid backup metadata: ${backupId}`);
  }

  if (options.verifyCurrent !== false) {
    const changed = metadata.entries.filter(
      (entry) =>
        entry.applied_state &&
        JSON.stringify(inspectPathState(safeWorkspacePath(workspaceRoot, entry.path))) !==
          JSON.stringify(entry.applied_state),
    );
    if (changed.length > 0) {
      throw new Error(
        `Rollback blocked because files changed after the update:\n- ${changed.map((entry) => entry.path).join("\n- ")}`,
      );
    }
  }

  for (const entry of metadata.entries) {
    const relativePath = assertRelativeWorkspacePath(entry.path);
    const destination = safeWorkspacePath(workspaceRoot, relativePath);
    const source = path.join(backupRoot, "files", relativePath);
    rmSync(destination, { recursive: true, force: true });

    if (!entry.existed) {
      continue;
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true, verbatimSymlinks: true });
  }

  return metadata;
}

export function statePaths() {
  return {
    directory: STATE_DIRECTORY,
    manifest: MANIFEST_PATH,
    history: HISTORY_PATH,
    baseCache: BASE_CACHE_PATH,
  };
}

function walkManagedPath(workspaceRoot, absolutePath, files) {
  const stats = lstatSync(absolutePath);
  const relativePath = normalizePath(path.relative(workspaceRoot, absolutePath));

  if (stats.isSymbolicLink()) {
    files.push({
      path: relativePath,
      type: "symlink",
      strategy: "managed-symlink",
      target: readlinkSync(absolutePath),
      symlink_type: relativePath.endsWith("/skills") ? "dir" : "file",
    });
    return;
  }

  if (stats.isDirectory()) {
    for (const entry of readdirSync(absolutePath).sort()) {
      if (relativePath === "export" && entry === "custom-templates") {
        continue;
      }
      walkManagedPath(workspaceRoot, path.join(absolutePath, entry), files);
    }
    return;
  }

  const contents = readFileSync(absolutePath);
  files.push({
    path: relativePath,
    type: "file",
    strategy: strategyForPath(relativePath),
    sha256: createHash("sha256").update(contents).digest("hex"),
  });
}

export function strategyForPath(relativePath) {
  if (relativePath === "export/templates.json" || relativePath === "package.json") {
    return "semantic-json";
  }

  if (
    relativePath === "AGENTS.md" ||
    relativePath === "README.md" ||
    relativePath === ".gitignore" ||
    relativePath.startsWith(".agents/skills/")
  ) {
    return "three-way-text";
  }

  if (relativePath === "export/resume-template.html" || relativePath === "export/resume.css") {
    return "built-in-template";
  }

  return "replace-if-unmodified";
}

export function isManagedWorkspacePath(relativePath) {
  const normalized = normalizePath(relativePath);
  if (normalized.startsWith("export/custom-templates/")) {
    return false;
  }
  return MANAGED_ROOTS.some(
    (managedRoot) => normalized === managedRoot || normalized.startsWith(`${managedRoot}/`),
  );
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function assertRelativeWorkspacePath(value) {
  const normalized = normalizePath(value);
  if (!normalized || path.isAbsolute(value) || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Backup path must stay inside the workspace: ${value}`);
  }
  return normalized;
}

function backupDirectory(workspaceRoot, backupId) {
  if (!/^[a-zA-Z0-9._:-]+$/.test(backupId)) {
    throw new Error(`Invalid backup ID: ${backupId}`);
  }
  return path.join(workspaceRoot, STATE_DIRECTORY, "backups", backupId);
}

function safeWorkspacePath(workspaceRoot, relativePath) {
  const normalized = assertRelativeWorkspacePath(relativePath);
  const destination = path.resolve(workspaceRoot, normalized);
  let current = path.dirname(destination);
  while (current !== workspaceRoot) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Workspace path crosses a local symlink: ${relativePath}`);
    }
    current = path.dirname(current);
  }
  return destination;
}

function inspectPathState(absolutePath) {
  try {
    const stats = lstatSync(absolutePath);
    if (stats.isSymbolicLink()) {
      return { exists: true, type: "symlink", target: readlinkSync(absolutePath) };
    }
    if (stats.isFile()) {
      return {
        exists: true,
        type: "file",
        sha256: createHash("sha256").update(readFileSync(absolutePath)).digest("hex"),
      };
    }
    if (stats.isDirectory()) {
      return {
        exists: true,
        type: "directory",
        sha256: hashDirectory(absolutePath),
      };
    }
    return { exists: true, type: "other" };
  } catch {
    return { exists: false };
  }
}

function hashDirectory(directoryRoot) {
  const entries = [];
  walk(directoryRoot);
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");

  function walk(currentDirectory) {
    for (const name of readdirSync(currentDirectory).sort()) {
      const absolutePath = path.join(currentDirectory, name);
      const relativePath = normalizePath(path.relative(directoryRoot, absolutePath));
      const stats = lstatSync(absolutePath);

      if (stats.isSymbolicLink()) {
        entries.push({ path: relativePath, type: "symlink", target: readlinkSync(absolutePath) });
      } else if (stats.isDirectory()) {
        entries.push({ path: relativePath, type: "directory" });
        walk(absolutePath);
      } else if (stats.isFile()) {
        entries.push({
          path: relativePath,
          type: "file",
          sha256: createHash("sha256").update(readFileSync(absolutePath)).digest("hex"),
        });
      } else {
        entries.push({ path: relativePath, type: "other" });
      }
    }
  }
}
