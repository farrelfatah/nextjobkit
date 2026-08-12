#!/usr/bin/env node
import {
  existsSync,
  lstatSync,
  readlinkSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

validateSymlink("CLAUDE.md", "AGENTS.md", "AGENTS.md");
validateSymlink(".claude/skills", "../.agents/skills", ".agents/skills");

const canonicalSkillsRoot = path.join(repoRoot, ".agents/skills");
const claudeSkillsRoot = path.join(repoRoot, ".claude/skills");

if (existsSync(canonicalSkillsRoot) && existsSync(claudeSkillsRoot)) {
  const canonicalSkills = listSkills(canonicalSkillsRoot);
  const claudeSkills = listSkills(claudeSkillsRoot);

  if (canonicalSkills.join("\n") !== claudeSkills.join("\n")) {
    failures.push(
      `Claude skill discovery differs from .agents/skills: expected ${canonicalSkills.join(", ")}; found ${claudeSkills.join(", ")}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`Agent compatibility validation failed:\n- ${failures.join("\n- ")}`);
  console.error(
    "If Git checked out symlinks as plain files, enable symbolic-link support and clone the repository again.",
  );
  process.exit(1);
}

console.log("Agent compatibility valid: AGENTS.md and .agents/skills are canonical");
console.log("Claude Code resolves them through CLAUDE.md and .claude/skills");

function validateSymlink(relativePath, expectedTarget, canonicalPath) {
  const linkPath = path.join(repoRoot, relativePath);

  if (!existsSync(linkPath)) {
    failures.push(`${relativePath}: missing compatibility symlink`);
    return;
  }

  const stats = lstatSync(linkPath);
  if (!stats.isSymbolicLink()) {
    failures.push(`${relativePath}: must be a symbolic link, not a copied file or directory`);
    return;
  }

  const target = readlinkSync(linkPath);
  if (target !== expectedTarget) {
    failures.push(`${relativePath}: expected target ${expectedTarget}; found ${target}`);
  }

  const resolvedTarget = realpathSync(linkPath);
  const resolvedCanonical = realpathSync(path.join(repoRoot, canonicalPath));
  if (resolvedTarget !== resolvedCanonical) {
    failures.push(`${relativePath}: does not resolve to ${canonicalPath}`);
  }
}

function listSkills(skillsRoot) {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(path.join(skillsRoot, entry.name, "SKILL.md")),
    )
    .map((entry) => entry.name)
    .sort();
}
