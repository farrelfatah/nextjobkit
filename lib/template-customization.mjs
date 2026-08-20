import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { loadTemplateRegistry, resolveWorkspacePath } from "../export/workspace-config.mjs";

const TEMPLATE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROFILE_PATH = "profile/candidate.md";
const CUSTOM_TEMPLATE_ROOT = "export/custom-templates";

export function forkTemplate(workspaceDirectory, sourceId, customId) {
  const workspaceRoot = path.resolve(workspaceDirectory);

  if (!TEMPLATE_ID_PATTERN.test(customId)) {
    throw new Error("Custom template ID must use lowercase kebab-case");
  }

  const registry = loadTemplateRegistry(workspaceRoot);
  const source = registry.values.templates[sourceId];

  if (!source) {
    throw new Error(`Unknown source template: ${sourceId}`);
  }

  if (source.origin !== "built-in") {
    throw new Error(`Template ${sourceId} is already user-owned; customize it directly`);
  }

  if (registry.values.templates[customId]) {
    throw new Error(`Template ID already exists: ${customId}`);
  }

  const relativeDirectory = `${CUSTOM_TEMPLATE_ROOT}/${customId}`;
  const templateRelativePath = `${relativeDirectory}/resume-template.html`;
  const stylesheetRelativePath = `${relativeDirectory}/resume.css`;
  const targetDirectory = resolveWorkspacePath(workspaceRoot, relativeDirectory);

  if (existsSync(targetDirectory)) {
    throw new Error(`Custom template directory already exists: ${relativeDirectory}`);
  }

  const sourceTemplate = resolveWorkspacePath(workspaceRoot, source.template);
  const sourceStylesheet = resolveWorkspacePath(workspaceRoot, source.stylesheet);
  const originalRegistry = readFileSync(registry.path, "utf8");
  const profile = selectedProfile(workspaceRoot, customId);

  try {
    mkdirSync(targetDirectory, { recursive: true });
    cpSync(sourceTemplate, resolveWorkspacePath(workspaceRoot, templateRelativePath));
    cpSync(sourceStylesheet, resolveWorkspacePath(workspaceRoot, stylesheetRelativePath));

    registry.values.templates[customId] = {
      label: titleFromId(customId),
      origin: "user",
      template: templateRelativePath,
      stylesheet: stylesheetRelativePath,
      forked_from: sourceId,
    };

    writeFileSync(registry.path, `${JSON.stringify(registry.values, null, 2)}\n`);
    writeFileSync(profile.path, profile.updated);
  } catch (error) {
    writeFileSync(registry.path, originalRegistry);
    writeFileSync(profile.path, profile.original);
    rmSync(targetDirectory, { recursive: true, force: true });
    throw error;
  }

  return { customId, relativeDirectory };
}

function selectedProfile(workspaceRoot, templateId) {
  const profilePath = resolveWorkspacePath(workspaceRoot, PROFILE_PATH);
  const source = readFileSync(profilePath, "utf8");
  const pattern = /^resume_template\s*:\s*.*$/m;

  if (!pattern.test(source)) {
    throw new Error(`${PROFILE_PATH} is missing resume_template`);
  }

  return {
    path: profilePath,
    original: source,
    updated: source.replace(pattern, `resume_template: ${templateId}`),
  };
}

function titleFromId(templateId) {
  return templateId
    .split("-")
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
