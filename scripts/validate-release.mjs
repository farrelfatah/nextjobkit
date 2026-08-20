#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function validateRelease(rootDirectory, tag) {
  const root = path.resolve(rootDirectory);
  const version = tag?.startsWith("v") ? tag.slice(1) : tag;
  if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Release tag must use v<semver>: ${tag || "missing"}`);
  }

  const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  if (packageJson.version !== version) {
    throw new Error(`Tag ${tag} does not match package version ${packageJson.version}`);
  }

  const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  if (!changelog.includes(`## [${version}]`)) {
    throw new Error(`CHANGELOG.md has no ${version} release entry`);
  }

  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const version = validateRelease(repoRoot, process.argv[2]);
    console.log(`Release valid: v${version}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
