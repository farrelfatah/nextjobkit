#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function extractReleaseNotes(rootDirectory, tag) {
  const version = tag.startsWith("v") ? tag.slice(1) : tag;
  const changelog = readFileSync(path.join(rootDirectory, "CHANGELOG.md"), "utf8");
  const heading = `## [${version}]`;
  const start = changelog.indexOf(heading);
  if (start === -1) throw new Error(`Release notes not found for ${version}`);
  const next = changelog.indexOf("\n## [", start + heading.length);
  return `${changelog.slice(start, next === -1 ? undefined : next).trim()}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const notes = extractReleaseNotes(repoRoot, process.argv[2] || "");
    if (process.argv[3]) writeFileSync(process.argv[3], notes);
    else process.stdout.write(notes);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
