#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createStarter } from "./create-starter.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "next-job-kit-package-"));

try {
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  assert(packageJson.private !== true, "maintainer package must be publishable");
  assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version), "version must be semver");
  assert(packageJson.bin?.["next-job-kit"] === "bin/next-job-kit.mjs", "CLI bin is missing");
  assert((statSync(path.join(repoRoot, "bin/next-job-kit.mjs")).mode & 0o111) !== 0, "CLI is not executable");

  const workspace = createStarter(path.join(temporaryRoot, "workspace"), { sourceRoot: repoRoot });
  const workspacePackage = JSON.parse(readFileSync(path.join(workspace, "package.json"), "utf8"));
  assert(workspacePackage.private === true, "generated workspace must remain private");
  for (const key of ["name", "version", "bin", "publishConfig"]) {
    assert(!Object.hasOwn(workspacePackage, key), `generated workspace must not contain ${key}`);
  }
  const workspaceReadme = readFileSync(path.join(workspace, "README.md"), "utf8");
  const scaffoldReadme = readFileSync(path.join(repoRoot, "scaffold/README.md"), "utf8");
  const packageReadme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  assert(
    workspaceReadme === scaffoldReadme,
    "generated workspace README must match the post-install scaffold README",
  );
  assert(workspaceReadme !== packageReadme, "workspace and public package READMEs must remain distinct");
  for (const required of [
    "Next Job Kit is already installed here",
    "setup-resume-workspace",
    "Update Next Job Kit Safely",
    "Optional Private Backup",
  ]) {
    assert(workspaceReadme.includes(required), `workspace README is missing ${required}`);
  }
  for (const forbidden of ["next-job-kit@latest init", "git clone", "Contributors working on Next Job Kit"]) {
    assert(!workspaceReadme.includes(forbidden), `workspace README contains pre-install guidance: ${forbidden}`);
  }

  for (const required of [
    ".claude/settings.json",
    ".claude/agents/claim-auditor.md",
    ".claude/hooks/guard-protected-files.mjs",
    "docs/prompts.md",
    "scripts/render-pdf-pages.mjs",
  ]) {
    assert(exists(path.join(workspace, required)), `generated workspace is missing ${required}`);
  }
  const claudeSettings = JSON.parse(readFileSync(path.join(workspace, ".claude/settings.json"), "utf8"));
  assert(
    claudeSettings.permissions?.ask?.includes("Bash(git push *)"),
    "workspace Claude settings must ask before git push",
  );
  // Also reach the workspace through a symlink, as macOS /var -> /private/var does.
  const linkedWorkspace = path.join(temporaryRoot, "linked-workspace");
  symlinkSync(workspace, linkedWorkspace, "dir");
  for (const root of [workspace, linkedWorkspace]) {
    const guard = spawnSync(process.execPath, [path.join(root, ".claude/hooks/guard-protected-files.mjs")], {
      cwd: root,
      encoding: "utf8",
      input: JSON.stringify({
        tool_name: "Edit",
        cwd: root,
        tool_input: { file_path: path.join(root, "export/resume.css") },
      }),
    });
    assert(
      JSON.parse(guard.stdout || "{}").hookSpecificOutput?.permissionDecision === "ask",
      `guard hook must ask before editing a locked built-in template file (${path.basename(root)})`,
    );
  }

  const cache = path.join(temporaryRoot, "npm-cache");
  const packed = JSON.parse(
    execFileSync(
      "npm",
      ["--cache", cache, "pack", "--json", "--pack-destination", temporaryRoot],
      {
      cwd: repoRoot,
      encoding: "utf8",
      },
    ),
  )[0];
  const paths = packed.files.map((entry) => entry.path);
  for (const forbiddenRoot of ["profile/", "master/", "applications/", "tailored/", "cover-letters/", "archive/", ".next-job-kit/"]) {
    assert(!paths.some((entry) => entry.startsWith(forbiddenRoot)), `npm package leaks ${forbiddenRoot}`);
  }
  for (const required of [
    "bin/next-job-kit.mjs",
    "AGENTS.md",
    "README.md",
    "CHANGELOG.md",
    "scaffold/README.md",
    "templates/workspace-package.json",
    "templates/claude-settings.json",
    ".claude/agents/claim-auditor.md",
    ".claude/hooks/guard-protected-files.mjs",
    ".claude/hooks/validate-profile.mjs",
    ".claude/hooks/session-check.mjs",
    ".claude/hooks/workspace-path.mjs",
    "export/find-tools.mjs",
    "scripts/check-prerequisites.mjs",
    "scripts/render-pdf-pages.mjs",
    "docs/prompts.md",
  ]) {
    assert(paths.includes(required), `npm package is missing ${required}`);
  }

  const installRoot = path.join(temporaryRoot, "installed-package");
  execFileSync(
    "npm",
    [
      "--cache",
      cache,
      "install",
      "--prefix",
      installRoot,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      path.join(temporaryRoot, packed.filename),
    ],
    { stdio: "pipe" },
  );
  const installedCli = path.join(
    installRoot,
    "node_modules/.bin",
    process.platform === "win32" ? "next-job-kit.cmd" : "next-job-kit",
  );
  assert(exists(installedCli), "installed package did not expose the next-job-kit command");
  const installedVersion = runInstalledCli(installedCli, ["--version"], {
    encoding: "utf8",
  }).trim();
  assert(installedVersion === packageJson.version, "installed CLI reported the wrong version");
  const packedWorkspace = path.join(temporaryRoot, "packed-workspace");
  runInstalledCli(installedCli, ["init", packedWorkspace], { stdio: "pipe" });
  assert(exists(path.join(packedWorkspace, ".next-job-kit/manifest.json")), "packed CLI did not initialize state");
  assert(
    readFileSync(path.join(packedWorkspace, "README.md"), "utf8") === scaffoldReadme,
    "packed CLI did not install the post-install workspace README",
  );

  console.log(`Package contract valid: ${packed.entryCount} allowlisted files, no candidate workspace data`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runInstalledCli(command, args, options) {
  return execFileSync(command, args, {
    ...options,
    shell: process.platform === "win32",
  });
}

function exists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}
