#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createStarter } from "../scripts/create-starter.mjs";
import { forkTemplate } from "../lib/template-customization.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h" || command === "help") {
  printHelp();
} else if (command === "--version" || command === "-v" || command === "version") {
  console.log(packageJson.version);
} else if (command === "init") {
  const destination = args[1];

  if (!destination) {
    fail("Usage: next-job-kit init <empty-output-directory>");
  } else {
    try {
      const outputRoot = createStarter(destination, { sourceRoot: packageRoot });
      console.log(`Next Job Kit workspace created: ${outputRoot}`);
      console.log("Open that folder in your AI coding agent and ask it to initialize the workspace.");
    } catch (error) {
      fail(error.message);
    }
  }
} else if (command === "template" && args[1] === "fork") {
  const sourceId = args[2];
  const customId = args[3];
  const workspaceIndex = args.indexOf("--workspace");
  const workspaceRoot = workspaceIndex === -1 ? process.cwd() : args[workspaceIndex + 1];

  if (!sourceId || !customId || !workspaceRoot) {
    fail(
      "Usage: next-job-kit template fork <built-in-template-id> <custom-template-id> [--workspace <directory>]",
    );
  } else {
    try {
      const result = forkTemplate(workspaceRoot, sourceId, customId);
      console.log(`Custom template created: ${result.customId}`);
      console.log(`Template directory: ${result.relativeDirectory}`);
      console.log("profile/candidate.md now selects the custom template.");
    } catch (error) {
      fail(error.message);
    }
  }
} else {
  fail(`Unknown command: ${command}\n\nRun next-job-kit --help for usage.`);
}

function printHelp() {
  console.log(`Next Job Kit ${packageJson.version}

Usage:
  next-job-kit init <directory>
  next-job-kit template fork <built-in-id> <custom-id> [--workspace <directory>]
  next-job-kit --help
  next-job-kit --version

Next Job Kit creates a local, prompt-first career workspace for Codex or Claude Code.`);
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}
