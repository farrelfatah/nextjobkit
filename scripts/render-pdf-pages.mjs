#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findPopplerTool } from "../export/find-tools.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const inputArg = args.find((arg) => !arg.startsWith("--"));
const outArg = args.find((arg) => arg.startsWith("--out="))?.slice("--out=".length);
const resolution = Number(args.find((arg) => arg.startsWith("--dpi="))?.slice("--dpi=".length) || 110);

if (!inputArg) {
  console.error("Usage: npm run render:pdf -- <resume.pdf> [--out=<directory>] [--dpi=110]");
  process.exit(1);
}

const pdfPath = path.resolve(repoRoot, inputArg);
if (!existsSync(pdfPath)) {
  console.error(`PDF not found: ${pdfPath}`);
  process.exit(1);
}

const pdftoppm = findPopplerTool("pdftoppm");
if (!pdftoppm) {
  console.error("Poppler pdftoppm is required to render PDF pages. Run npm run doctor for install guidance.");
  process.exit(1);
}

// Page images are QA scratch output, so they default to a temporary directory
// instead of sitting beside the canonical Markdown and delivered PDF.
const name = path.parse(pdfPath).name;
const outputDirectory = outArg
  ? path.resolve(repoRoot, outArg)
  : mkdtempSync(path.join(tmpdir(), `next-job-kit-pages-${name}-`));
mkdirSync(outputDirectory, { recursive: true });

const result = spawnSync(
  pdftoppm,
  ["-png", "-r", String(resolution), pdfPath, path.join(outputDirectory, `${name}-page`)],
  { encoding: "utf8" },
);

if (result.error || result.status !== 0) {
  console.error(result.stderr || result.error?.message || "pdftoppm failed");
  process.exit(result.status || 1);
}

const pages = readdirSync(outputDirectory)
  .filter((entry) => entry.startsWith(`${name}-page`) && entry.endsWith(".png"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

console.log(`Rendered ${pages.length} page image(s) at ${resolution} DPI. Inspect every page:`);
for (const page of pages) {
  console.log(path.join(outputDirectory, page));
}
