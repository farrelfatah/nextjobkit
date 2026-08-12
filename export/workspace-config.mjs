import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PROFILE_PATH = "profile/candidate.md";
const TEMPLATE_REGISTRY_PATH = "export/templates.json";

export function loadWorkspaceConfig(repoRoot) {
  const profilePath = path.resolve(repoRoot, PROFILE_PATH);

  if (!existsSync(profilePath)) {
    throw new Error(`Candidate profile not found: ${PROFILE_PATH}`);
  }

  const source = readFileSync(profilePath, "utf8");
  const values = parseFrontmatter(source, PROFILE_PATH);

  requireValue(values, "schema_version", PROFILE_PATH);
  requireValue(values, "candidate_name", PROFILE_PATH);
  requireValue(values, "candidate_slug", PROFILE_PATH);
  requireValue(values, "resume_template", PROFILE_PATH);
  requireValue(values, "master_resume_path", PROFILE_PATH);
  requireValue(values, "resume_evidence_path", PROFILE_PATH);
  requireValue(values, "application_tracker_path", PROFILE_PATH);

  if (values.schema_version !== "1") {
    throw new Error(
      `Unsupported schema_version in ${PROFILE_PATH}: ${values.schema_version}. Expected 1.`,
    );
  }

  const template = resolveTemplate(repoRoot, values.resume_template);

  return {
    profilePath,
    values,
    template,
    masterResumePath: resolveWorkspacePath(repoRoot, values.master_resume_path),
    resumeEvidencePath: resolveWorkspacePath(repoRoot, values.resume_evidence_path),
    applicationTrackerPath: resolveWorkspacePath(repoRoot, values.application_tracker_path),
  };
}

export function resolveWorkspacePath(repoRoot, configuredPath) {
  const resolved = path.resolve(repoRoot, configuredPath);
  const relative = path.relative(repoRoot, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Configured path must stay inside the workspace: ${configuredPath}`);
  }

  return resolved;
}

function resolveTemplate(repoRoot, templateId) {
  const registryPath = path.resolve(repoRoot, TEMPLATE_REGISTRY_PATH);

  if (!existsSync(registryPath)) {
    throw new Error(`Template registry not found: ${TEMPLATE_REGISTRY_PATH}`);
  }

  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const entry = registry[templateId];

  if (!entry) {
    const supported = Object.keys(registry).sort().join(", ");
    throw new Error(
      `Unknown resume_template "${templateId}". Supported templates: ${supported || "none"}.`,
    );
  }

  const templatePath = resolveWorkspacePath(repoRoot, entry.template);
  const stylesheetPath = resolveWorkspacePath(repoRoot, entry.stylesheet);

  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found for ${templateId}: ${entry.template}`);
  }

  if (!existsSync(stylesheetPath)) {
    throw new Error(`Stylesheet not found for ${templateId}: ${entry.stylesheet}`);
  }

  return {
    id: templateId,
    label: entry.label || templateId,
    templatePath,
    stylesheetPath,
  };
}

function parseFrontmatter(source, sourcePath) {
  const normalized = source.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    throw new Error(`${sourcePath} must start with YAML frontmatter.`);
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);

  if (closingIndex === -1) {
    throw new Error(`${sourcePath} has unterminated YAML frontmatter.`);
  }

  const values = {};
  const frontmatter = normalized.slice(4, closingIndex);

  for (const [index, line] of frontmatter.split("\n").entries()) {
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const match = line.match(/^([a-z][a-z0-9_]*)\s*:\s*(.*)$/);

    if (!match) {
      throw new Error(
        `${sourcePath} frontmatter line ${index + 2} must use a flat key: value pair.`,
      );
    }

    const [, key, rawValue] = match;
    const value = unquote(rawValue.trim());

    if (Object.hasOwn(values, key)) {
      throw new Error(`${sourcePath} contains duplicate frontmatter key: ${key}`);
    }

    values[key] = value;
  }

  return values;
}

function requireValue(values, key, sourcePath) {
  if (!values[key]) {
    throw new Error(`${sourcePath} is missing required frontmatter key: ${key}`);
  }
}

function unquote(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value.at(-1);

    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}
