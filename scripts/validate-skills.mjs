#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(repoRoot, ".agents/skills");
const failures = [];
const skillNames = readdirSync(skillsRoot, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      existsSync(path.join(skillsRoot, entry.name, "SKILL.md")),
  )
  .map((entry) => entry.name)
  .sort();

for (const skillName of skillNames) {
  const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
  const metadataPath = path.join(skillsRoot, skillName, "agents/openai.yaml");

  if (!existsSync(skillPath)) {
    failures.push(`${skillName}: missing SKILL.md`);
    continue;
  }

  const source = readFileSync(skillPath, "utf8");
  const frontmatter = parseFrontmatter(source, skillName);

  if (frontmatter.name !== skillName) {
    failures.push(`${skillName}: frontmatter name must match its folder`);
  }

  if (!frontmatter.description || frontmatter.description.length > 1024) {
    failures.push(`${skillName}: description must be 1–1024 characters`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) {
    failures.push(`${skillName}: name must use lowercase kebab-case`);
  }

  const extraKeys = Object.keys(frontmatter).filter(
    (key) => !["name", "description", "license", "compatibility", "metadata", "allowed-tools"].includes(key),
  );
  if (extraKeys.length > 0) {
    failures.push(`${skillName}: unsupported frontmatter keys: ${extraKeys.join(", ")}`);
  }

  if (!existsSync(metadataPath)) {
    failures.push(`${skillName}: missing agents/openai.yaml`);
    continue;
  }

  const metadata = readFileSync(metadataPath, "utf8");
  if (!/^interface:\s*$/m.test(metadata)) {
    failures.push(`${skillName}: openai.yaml must contain an interface mapping`);
  }
  if (!/^\s{2}display_name:\s*\S/m.test(metadata)) {
    failures.push(`${skillName}: openai.yaml is missing interface.display_name`);
  }
  if (!/^\s{2}short_description:\s*\S/m.test(metadata)) {
    failures.push(`${skillName}: openai.yaml is missing interface.short_description`);
  }
  if (!metadata.includes(`$${skillName}`)) {
    failures.push(`${skillName}: default_prompt must explicitly mention $${skillName}`);
  }
}

if (skillNames.length !== 7) {
  failures.push(`expected 7 first-party skills, found ${skillNames.length}`);
}

if (failures.length > 0) {
  console.error(`Skill validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Skills valid: ${skillNames.join(", ")}`);

function parseFrontmatter(source, skillName) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);

  if (!match) {
    failures.push(`${skillName}: missing YAML frontmatter`);
    return {};
  }

  const values = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }
    const pair = line.match(/^([a-z][a-z0-9_-]*):\s*(.*)$/);
    if (!pair) {
      failures.push(`${skillName}: invalid flat frontmatter line: ${line}`);
      continue;
    }
    values[pair[1]] = unquote(pair[2].trim());
  }
  return values;
}

function unquote(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
