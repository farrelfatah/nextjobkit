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
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputArg = process.argv[2];

if (!outputArg) {
  console.error("Usage: npm run create:starter -- <empty-output-directory>");
  process.exit(1);
}

const outputRoot = path.resolve(process.cwd(), outputArg);

if (outputRoot === repoRoot || outputRoot === path.parse(outputRoot).root) {
  console.error("Refusing to use the repository or filesystem root as the starter destination");
  process.exit(1);
}

if (existsSync(outputRoot) && readdirSync(outputRoot).length > 0) {
  console.error(`Starter destination must be empty: ${outputRoot}`);
  process.exit(1);
}

mkdirSync(outputRoot, { recursive: true });

for (const relativePath of [
  ".agents/skills",
  "export",
  "scripts",
  "templates",
  "AGENTS.md",
  "package.json",
]) {
  cpSync(path.join(repoRoot, relativePath), path.join(outputRoot, relativePath), {
    recursive: true,
  });
}

mkdirSync(path.join(outputRoot, ".claude"), { recursive: true });
createSymlink("AGENTS.md", "CLAUDE.md", "file");
createSymlink("../.agents/skills", ".claude/skills", "dir");

mkdirSync(path.join(outputRoot, "tests"), { recursive: true });
const fixtureSource = existsSync(path.join(repoRoot, "tests/fixtures"))
  ? path.join(repoRoot, "tests/fixtures")
  : path.join(repoRoot, "evals/fixtures");
cpSync(fixtureSource, path.join(outputRoot, "tests/fixtures"), {
  recursive: true,
});

copyTemplate("public-readme.md", "README.md");
copyTemplate("public-license.txt", "LICENSE");
copyTemplate("public-gitignore.txt", ".gitignore");
copyTemplate("candidate.md", "profile/candidate.md");
copyTemplate("master-resume.md", "master/your-name-master-resume.md");
copyTemplate("resume-evidence.md", "master/your-name-resume-evidence.md");
copyTemplate("application-tracker.md", "applications/application-tracker.md");

for (const directory of ["tailored", "cover-letters", "archive"]) {
  mkdirSync(path.join(outputRoot, directory), { recursive: true });
}

console.log(`Next Job Kit starter written: ${outputRoot}`);
console.log("The starter contains synthetic placeholders only; review profile/candidate.md before use.");

function copyTemplate(sourceName, destination) {
  const source = path.join(repoRoot, "templates", sourceName);
  const target = path.join(outputRoot, destination);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source));
}

function createSymlink(target, destination, type) {
  try {
    symlinkSync(target, path.join(outputRoot, destination), type);
  } catch (error) {
    console.error(
      `Could not create ${destination} -> ${target}. Next Job Kit requires symbolic-link support for Claude Code compatibility.`,
    );
    console.error(error.message);
    process.exit(1);
  }
}
