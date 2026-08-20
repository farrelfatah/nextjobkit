#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
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
  assert(
    readFileSync(path.join(workspace, "README.md"), "utf8") ===
      readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    "generated workspace README must match the canonical root README",
  );

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
  for (const required of ["bin/next-job-kit.mjs", "AGENTS.md", "README.md", "CHANGELOG.md", "templates/workspace-package.json"]) {
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
