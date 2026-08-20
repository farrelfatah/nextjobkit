#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { forkTemplate } from "../lib/template-customization.mjs";
import { applyUpdate, planUpdate, rollbackUpdate } from "../lib/update.mjs";
import { createStarter } from "./create-starter.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "next-job-kit-update-"));

try {
  testCleanMergeAndRollback();
  testConflictAndExplicitResolution();
  testTemplateForkSurvives();
  testModifiedUpstreamRemovalIsPreserved();
  testStalePlanIsRejected();
  testPlanRejectsNewerInstalledState();
  testUnknownResolutionIsRejected();
  testValidationFailureRollsBack();
  testRollbackRejectsLaterEdits();
  testOlderRollbackIsRejected();
  testStaleLockRecovery();
  testLegacyCloneAdoption();
  console.log("Update contract valid: merge, conflict, customization, preservation, adoption, and rollback scenarios pass");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function testCleanMergeAndRollback() {
  const source = makeSource("clean-merge-source", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming release instruction.\n\n");
  });
  const workspace = makeWorkspace("clean-merge-workspace");
  appendFileSync(path.join(workspace, "AGENTS.md"), "\nLocal workflow instruction.\n");
  writeFileSync(path.join(workspace, "personal-note.md"), "user owned\n");
  mkdirSync(path.join(workspace, ".agents/skills/my-skill/agents"), { recursive: true });
  writeFileSync(
    path.join(workspace, ".agents/skills/my-skill/SKILL.md"),
    "---\nname: my-skill\ndescription: A user-created test skill.\n---\n\n# My Skill\n",
  );
  writeFileSync(
    path.join(workspace, ".agents/skills/my-skill/agents/openai.yaml"),
    'interface:\n  display_name: "My Skill"\n  short_description: "Test a user-created skill"\n  default_prompt: "Use $my-skill for this test."\n',
  );

  const plan = planUpdate(workspace, { sourceRoot: source });
  assert(plan.conflicts.length === 0, "non-overlapping text changes should merge cleanly");
  const applied = applyUpdate(workspace, plan.plan_id);
  const agents = readFileSync(path.join(workspace, "AGENTS.md"), "utf8");
  assert(agents.includes("Incoming release instruction."), "incoming instruction was lost");
  assert(agents.includes("Local workflow instruction."), "local instruction was lost");
  assert(existsSync(path.join(workspace, "personal-note.md")), "unknown user file was removed");
  assert(existsSync(path.join(workspace, ".agents/skills/my-skill/SKILL.md")), "custom skill was removed");
  assert(installedVersion(workspace) === "0.2.0", "manifest version did not advance");

  rollbackUpdate(workspace, applied.backup_id);
  const rolledBack = readFileSync(path.join(workspace, "AGENTS.md"), "utf8");
  assert(!rolledBack.includes("Incoming release instruction."), "rollback retained incoming content");
  assert(rolledBack.includes("Local workflow instruction."), "rollback lost pre-update local content");
  assert(installedVersion(workspace) === "0.1.0", "rollback did not restore manifest version");
}

function testConflictAndExplicitResolution() {
  const baseLine = "Help a candidate build defensible, role-specific application packages from evidence.";
  const source = makeSource("conflict-source", "0.2.0", (root) => {
    replace(root, "AGENTS.md", baseLine, "Help every candidate build defensible application packages from evidence.");
  });
  const workspace = makeWorkspace("conflict-workspace");
  replace(workspace, "AGENTS.md", baseLine, "Help this candidate build defensible application packages from evidence.");

  const before = readFileSync(path.join(workspace, "AGENTS.md"), "utf8");
  const plan = planUpdate(workspace, { sourceRoot: source });
  assert(plan.conflicts.some((entry) => entry.path === "AGENTS.md"), "overlap should be reported");
  expectFailure(() => applyUpdate(workspace, plan.plan_id), "unresolved conflict");
  assert(readFileSync(path.join(workspace, "AGENTS.md"), "utf8") === before, "blocked apply changed live files");

  applyUpdate(workspace, plan.plan_id, { "AGENTS.md": "keep-local" });
  assert(readFileSync(path.join(workspace, "AGENTS.md"), "utf8") === before, "keep-local was ignored");
}

function testTemplateForkSurvives() {
  const source = makeSource("template-source", "0.2.0", (root) => {
    appendFileSync(path.join(root, "export/resume.css"), "\n/* incoming built-in */\n");
    updateTemplateBaseline(root, "stylesheet", "export/resume.css");
  });
  const workspace = makeWorkspace("template-workspace");
  appendFileSync(path.join(workspace, "export/resume.css"), "\n/* local customization */\n");
  forkTemplate(workspace, "classic-timeline", "my-classic");

  const plan = planUpdate(workspace, { sourceRoot: source });
  const conflict = plan.conflicts.find((entry) => entry.path === "export/resume.css");
  assert(conflict?.recommendation === "fork-template-then-accept-incoming", "built-in edit needs fork guidance");
  applyUpdate(workspace, plan.plan_id, { "export/resume.css": "accept-incoming" });

  assert(
    readFileSync(path.join(workspace, "export/custom-templates/my-classic/resume.css"), "utf8").includes(
      "local customization",
    ),
    "custom template lost the local design",
  );
  assert(readFileSync(path.join(workspace, "export/resume.css"), "utf8").includes("incoming built-in"), "built-in did not update");
  assert(readFileSync(path.join(workspace, "profile/candidate.md"), "utf8").includes("resume_template: my-classic"), "custom selection was lost");
}

function testModifiedUpstreamRemovalIsPreserved() {
  const source = makeSource("removal-source", "0.2.0", (root) => {
    rmSync(path.join(root, "export/README.md"));
  });
  const workspace = makeWorkspace("removal-workspace");
  appendFileSync(path.join(workspace, "export/README.md"), "\nLocal export note.\n");

  const plan = planUpdate(workspace, { sourceRoot: source });
  assert(plan.preserved.some((entry) => entry.path === "export/README.md"), "modified removal was not preserved");
  applyUpdate(workspace, plan.plan_id);
  assert(readFileSync(path.join(workspace, "export/README.md"), "utf8").includes("Local export note."), "preserved file was deleted");
}

function testStalePlanIsRejected() {
  const source = makeSource("stale-source", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming change.\n");
  });
  const workspace = makeWorkspace("stale-workspace");
  const plan = planUpdate(workspace, { sourceRoot: source });
  appendFileSync(path.join(workspace, "AGENTS.md"), "\nChanged after plan.\n");
  expectFailure(() => applyUpdate(workspace, plan.plan_id), "stale update plan");
  assert(installedVersion(workspace) === "0.1.0", "stale plan advanced the manifest");
}

function testPlanRejectsNewerInstalledState() {
  const sourceA = makeSource("installed-state-source-a", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming update A.\n");
  });
  const sourceB = makeSource("installed-state-source-b", "0.3.0", (root) => {
    writeFileSync(path.join(root, "templates/new-managed-file.md"), "Managed by update B.\n");
  });
  const workspace = makeWorkspace("installed-state-workspace");
  const oldPlan = planUpdate(workspace, { sourceRoot: sourceA });
  const newPlan = planUpdate(workspace, { sourceRoot: sourceB });
  applyUpdate(workspace, newPlan.plan_id);

  expectFailure(() => applyUpdate(workspace, oldPlan.plan_id), "plan from older installed state");
  assert(installedVersion(workspace) === "0.3.0", "old plan downgraded the manifest");
  assert(
    existsSync(path.join(workspace, "templates/new-managed-file.md")),
    "old plan removed a newer managed file",
  );
}

function testUnknownResolutionIsRejected() {
  const baseLine = "Help a candidate build defensible, role-specific application packages from evidence.";
  const source = makeSource("unknown-resolution-source", "0.2.0", (root) => {
    replace(root, "AGENTS.md", baseLine, "Help every candidate build defensible application packages from evidence.");
  });
  const workspace = makeWorkspace("unknown-resolution-workspace");
  replace(workspace, "AGENTS.md", baseLine, "Help this candidate build defensible application packages from evidence.");
  const plan = planUpdate(workspace, { sourceRoot: source });

  expectFailure(
    () =>
      applyUpdate(workspace, plan.plan_id, {
        "AGENTS.md": "keep-local",
        "/private/path": "keep-local",
      }),
    "resolution outside the plan",
  );
  const history = readFileSync(path.join(workspace, ".next-job-kit/history.jsonl"), "utf8");
  assert(!history.includes("/private/path"), "unknown resolution leaked into update history");
}

function testValidationFailureRollsBack() {
  const source = makeSource("invalid-source", "0.2.0", (root) => {
    prepend(root, "scripts/validate-workspace.mjs", "process.exit(1);\n");
  });
  const workspace = makeWorkspace("invalid-workspace");
  const original = readFileSync(path.join(workspace, "scripts/validate-workspace.mjs"), "utf8");
  const plan = planUpdate(workspace, { sourceRoot: source });
  expectFailure(() => applyUpdate(workspace, plan.plan_id), "failed post-update validation");
  assert(readFileSync(path.join(workspace, "scripts/validate-workspace.mjs"), "utf8") === original, "failed update was not restored");
  assert(installedVersion(workspace) === "0.1.0", "failed update advanced the manifest");
}

function testRollbackRejectsLaterEdits() {
  const source = makeSource("rollback-safety-source", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming rollback safety change.\n");
  });
  const workspace = makeWorkspace("rollback-safety-workspace");
  const plan = planUpdate(workspace, { sourceRoot: source });
  const applied = applyUpdate(workspace, plan.plan_id);
  appendFileSync(path.join(workspace, "AGENTS.md"), "\nEdited after update.\n");
  expectFailure(() => rollbackUpdate(workspace, applied.backup_id), "rollback over later edits");
  assert(
    readFileSync(path.join(workspace, "AGENTS.md"), "utf8").includes("Edited after update."),
    "blocked rollback changed the later edit",
  );
}

function testOlderRollbackIsRejected() {
  const sourceA = makeSource("older-rollback-source-a", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming update A.\n");
  });
  const sourceB = makeSource(
    "older-rollback-source-b",
    "0.3.0",
    (root) => {
      writeFileSync(path.join(root, "templates/later-update.md"), "Managed by update B.\n");
    },
    sourceA,
  );
  const workspace = makeWorkspace("older-rollback-workspace");
  const planA = planUpdate(workspace, { sourceRoot: sourceA });
  const updateA = applyUpdate(workspace, planA.plan_id);
  const planB = planUpdate(workspace, { sourceRoot: sourceB });
  applyUpdate(workspace, planB.plan_id);

  expectFailure(() => rollbackUpdate(workspace, updateA.backup_id), "rollback from an older update");
  assert(installedVersion(workspace) === "0.3.0", "older rollback downgraded the manifest");
  assert(
    existsSync(path.join(workspace, "templates/later-update.md")),
    "older rollback removed a later managed file",
  );
}

function testStaleLockRecovery() {
  const source = makeSource("stale-lock-source", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming stale lock change.\n");
  });
  const workspace = makeWorkspace("stale-lock-workspace");
  const plan = planUpdate(workspace, { sourceRoot: source });
  writeFileSync(
    path.join(workspace, ".next-job-kit/update.lock"),
    `${JSON.stringify({ pid: 2147483647, created_at: "2000-01-01T00:00:00.000Z" })}\n`,
  );
  applyUpdate(workspace, plan.plan_id);
  assert(!existsSync(path.join(workspace, ".next-job-kit/update.lock")), "stale lock was not cleared");
}

function testLegacyCloneAdoption() {
  const source = makeSource("legacy-source", "0.2.0", (root) => {
    prepend(root, "AGENTS.md", "Incoming legacy migration.\n\n");
  });
  const workspace = makeWorkspace("legacy-workspace");
  rmSync(path.join(workspace, ".next-job-kit"), { recursive: true, force: true });
  git(workspace, ["init", "-b", "main"]);
  git(workspace, ["config", "user.name", "Next Job Kit Test"]);
  git(workspace, ["config", "user.email", "test@nextjobkit.invalid"]);
  git(workspace, ["add", "--all"]);
  git(workspace, ["commit", "-m", "legacy baseline"]);
  git(workspace, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  appendFileSync(path.join(workspace, "AGENTS.md"), "\nLocal legacy instruction.\n");

  const plan = planUpdate(workspace, { sourceRoot: source });
  assert(plan.from_version.startsWith("legacy:"), "legacy baseline was not adopted");
  applyUpdate(workspace, plan.plan_id);
  const agents = readFileSync(path.join(workspace, "AGENTS.md"), "utf8");
  assert(agents.includes("Incoming legacy migration."), "legacy update lost incoming content");
  assert(agents.includes("Local legacy instruction."), "legacy update lost local content");
  const history = readFileSync(path.join(workspace, ".next-job-kit/history.jsonl"), "utf8");
  assert(history.includes('"action":"legacy-adoption"'), "legacy adoption was not logged");
}

function makeSource(name, version, mutate, sourceRoot = repoRoot) {
  const source = path.join(temporaryRoot, name);
  cpSync(sourceRoot, source, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (entry) => ![".git", "node_modules", ".next-job-kit"].includes(path.basename(entry)),
  });
  const packagePath = path.join(source, "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  packageJson.version = version;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  mutate(source);
  return source;
}

function makeWorkspace(name) {
  return createStarter(path.join(temporaryRoot, name), { sourceRoot: repoRoot });
}

function installedVersion(workspace) {
  return JSON.parse(readFileSync(path.join(workspace, ".next-job-kit/manifest.json"), "utf8"))
    .installed_version;
}

function prepend(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  writeFileSync(filePath, `${value}${readFileSync(filePath, "utf8")}`);
}

function replace(root, relativePath, before, after) {
  const filePath = path.join(root, relativePath);
  const source = readFileSync(filePath, "utf8");
  assert(source.includes(before), `fixture text missing in ${relativePath}`);
  writeFileSync(filePath, source.replace(before, after));
}

function git(workspace, args) {
  execFileSync("git", ["-C", workspace, ...args], { stdio: "pipe" });
}

function updateTemplateBaseline(root, kind, relativePath) {
  const baselinePath = path.join(root, "export/template-baseline.json");
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  baseline["classic-timeline"][kind].sha256 = createHash("sha256")
    .update(readFileSync(path.join(root, relativePath)))
    .digest("hex");
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
}

function expectFailure(callback, label) {
  let failed = false;
  try {
    callback();
  } catch {
    failed = true;
  }
  assert(failed, `${label} should fail`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
