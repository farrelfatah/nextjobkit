#!/usr/bin/env node
import { constants, accessSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputArg = process.argv[2];

if (!inputArg) {
  console.error("Usage: npm run validate:pdf -- <resume.pdf>");
  process.exit(1);
}

const pdfPath = path.resolve(repoRoot, inputArg);
if (!existsSync(pdfPath)) {
  console.error(`PDF not found: ${pdfPath}`);
  process.exit(1);
}

const pdfinfoPath = findExecutable("pdfinfo");
const pdftotextPath = findExecutable("pdftotext") || findBundledSibling(pdfinfoPath, "pdftotext");

if (!pdfinfoPath || !pdftotextPath) {
  console.error("Poppler pdfinfo and pdftotext are required for PDF validation");
  process.exit(1);
}

const info = run(pdfinfoPath, [pdfPath]);
const text = run(pdftotextPath, ["-layout", pdfPath, "-"]);
const failures = [];

const producer = info.match(/^Producer:\s+(.+)$/m)?.[1]?.trim() || "";
const pages = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1] || 0);
const pageSize = info.match(/^Page size:\s+(.+)$/m)?.[1]?.trim() || "";

if (!producer.includes("Skia/PDF")) {
  failures.push(`expected Chrome/Skia producer, found ${producer || "unknown"}`);
}
if (pages < 1) {
  failures.push("PDF contains no pages");
}
if (!/A4/i.test(pageSize)) {
  failures.push(`expected A4 pages, found ${pageSize || "unknown"}`);
}
if (pages > 2) {
  failures.push(`expected no more than 2 pages for a final resume, found ${pages}`);
}
for (const heading of ["Experience", "Skills", "Education"]) {
  if (!text.includes(heading)) {
    failures.push(`extracted text is missing expected section: ${heading}`);
  }
}

if (failures.length > 0) {
  console.error(`PDF validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`PDF valid: ${pages} page(s), ${pageSize}, producer ${producer}`);

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    console.error(`${command} is required for PDF validation`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(result.stderr || `${command} failed`);
    process.exit(result.status || 1);
  }
  return result.stdout;
}

function findExecutable(command) {
  const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];

  for (const directory of (process.env.PATH || "").split(path.delimiter)) {
    for (const extension of extensions) {
      const candidate = path.join(directory, `${command}${extension}`);
      try {
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {
        // Keep searching.
      }
    }
  }

  return null;
}

function findBundledSibling(pdfinfoExecutable, command) {
  if (!pdfinfoExecutable) {
    return null;
  }

  const candidates = [
    path.resolve(path.dirname(pdfinfoExecutable), "../../native/poppler/bin", command),
    path.resolve(path.dirname(pdfinfoExecutable), "../../native/poppler/poppler/bin", command),
  ];

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Keep searching.
    }
  }

  return null;
}
