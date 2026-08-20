#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { initializeWorkspaceState } from "../lib/workspace-state.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_SCRIPTS = [
  "validate-agent-compat.mjs",
  "validate-fixtures.mjs",
  "validate-pdf.mjs",
  "validate-skills.mjs",
  "validate-state.mjs",
  "validate-template.mjs",
  "validate-workspace.mjs",
];

export function createStarter(outputDirectory, options = {}) {
  if (!outputDirectory) {
    throw new Error("An output directory is required");
  }

  const sourceRoot = options.sourceRoot ? path.resolve(options.sourceRoot) : repoRoot;
  const workingDirectory = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const outputRoot = path.resolve(workingDirectory, outputDirectory);

  if (outputRoot === sourceRoot || outputRoot === path.parse(outputRoot).root) {
    throw new Error("Refusing to use the package or filesystem root as the starter destination");
  }

  if (existsSync(outputRoot) && readdirSync(outputRoot).length > 0) {
    throw new Error(`Starter destination must be empty: ${outputRoot}`);
  }

  mkdirSync(outputRoot, { recursive: true });

  for (const relativePath of [".agents/skills", "export", "templates", "AGENTS.md"]) {
    cpSync(path.join(sourceRoot, relativePath), path.join(outputRoot, relativePath), {
      recursive: true,
    });
  }

  mkdirSync(path.join(outputRoot, "scripts"), { recursive: true });
  for (const script of WORKSPACE_SCRIPTS) {
    cpSync(path.join(sourceRoot, "scripts", script), path.join(outputRoot, "scripts", script));
  }

  mkdirSync(path.join(outputRoot, ".claude"), { recursive: true });
  createSymlink(outputRoot, "AGENTS.md", "CLAUDE.md", "file");
  createSymlink(outputRoot, "../.agents/skills", ".claude/skills", "dir");

  mkdirSync(path.join(outputRoot, "tests"), { recursive: true });
  cpSync(path.join(sourceRoot, "tests/fixtures"), path.join(outputRoot, "tests/fixtures"), {
    recursive: true,
  });

  copyProjectFile(sourceRoot, outputRoot, "README.md", "README.md");
  copyProjectFile(sourceRoot, outputRoot, "docs/updating.md", "docs/updating.md");
  copyTemplate(sourceRoot, outputRoot, "workspace-package.json", "package.json");
  copyTemplate(sourceRoot, outputRoot, "public-license.txt", "LICENSE");
  copyTemplate(sourceRoot, outputRoot, "public-gitignore.txt", ".gitignore");
  copyTemplate(sourceRoot, outputRoot, "candidate.md", "profile/candidate.md");
  copyTemplate(sourceRoot, outputRoot, "master-resume.md", "master/your-name-master-resume.md");
  copyTemplate(sourceRoot, outputRoot, "resume-evidence.md", "master/your-name-resume-evidence.md");
  copyTemplate(
    sourceRoot,
    outputRoot,
    "application-tracker.md",
    "applications/application-tracker.md",
  );

  for (const directory of ["tailored", "cover-letters", "archive"]) {
    mkdirSync(path.join(outputRoot, directory), { recursive: true });
  }

  const packageJson = JSON.parse(readFileSync(path.join(sourceRoot, "package.json"), "utf8"));
  initializeWorkspaceState(outputRoot, packageJson.version);

  return outputRoot;
}

function copyTemplate(sourceRoot, outputRoot, sourceName, destination) {
  copyFile(outputRoot, path.join(sourceRoot, "templates", sourceName), destination);
}

function copyProjectFile(sourceRoot, outputRoot, sourceName, destination) {
  copyFile(outputRoot, path.join(sourceRoot, sourceName), destination);
}

function copyFile(outputRoot, source, destination) {
  const target = path.join(outputRoot, destination);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source));
}

function createSymlink(outputRoot, target, destination, type) {
  try {
    symlinkSync(target, path.join(outputRoot, destination), type);
  } catch (error) {
    throw new Error(
      `Could not create ${destination} -> ${target}. Next Job Kit requires symbolic-link support for Claude Code compatibility: ${error.message}`,
    );
  }
}

function runFromCommandLine() {
  const outputArg = process.argv[2];

  if (!outputArg) {
    console.error("Usage: npm run create:starter -- <empty-output-directory>");
    process.exitCode = 1;
    return;
  }

  try {
    const outputRoot = createStarter(outputArg);
    console.log(`Next Job Kit starter written: ${outputRoot}`);
    console.log(
      "The starter contains synthetic placeholders only; review profile/candidate.md before use.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runFromCommandLine();
}
