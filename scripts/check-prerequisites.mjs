#!/usr/bin/env node
import { findChrome, findPopplerTool } from "../export/find-tools.mjs";

const MINIMUM_NODE = [22, 14, 0];
const failures = [];
const warnings = [];
const found = [];

const nodeVersion = process.versions.node.split(".").map(Number);
if (compareVersions(nodeVersion, MINIMUM_NODE) < 0) {
  failures.push(
    `Node.js ${process.versions.node} is too old; install Node.js ${MINIMUM_NODE.join(".")} or newer from https://nodejs.org/`,
  );
} else {
  found.push(`Node.js ${process.versions.node}`);
}

const browser = findChrome();
if (browser) {
  found.push(`PDF renderer: ${browser.kind}`);
} else {
  warnings.push(
    `No Chrome-family browser found, so PDF export will not work. Install Google Chrome, Chromium, or Microsoft Edge, or set NEXT_JOB_KIT_CHROME_PATH. ${platformHint("chrome")}`,
  );
}

const missingPoppler = ["pdfinfo", "pdftotext", "pdftoppm"].filter((tool) => !findPopplerTool(tool));
if (missingPoppler.length === 0) {
  found.push("Poppler: pdfinfo, pdftotext, pdftoppm");
} else {
  warnings.push(
    `Poppler is missing ${missingPoppler.join(", ")}, so PDF validation and page rendering will not work. ${platformHint("poppler")}`,
  );
}

if (failures.length > 0) {
  console.error(`Prerequisites failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Prerequisites found: ${found.join("; ")}`);
if (warnings.length > 0) {
  console.warn(`Prerequisite warnings (Markdown work still functions):\n- ${warnings.join("\n- ")}`);
}

function compareVersions(left, right) {
  for (let index = 0; index < right.length; index += 1) {
    const difference = (left[index] || 0) - right[index];
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function platformHint(tool) {
  const hints = {
    chrome: {
      darwin: "macOS: install Google Chrome from https://www.google.com/chrome/.",
      win32: "Windows: Microsoft Edge is usually preinstalled; otherwise install Google Chrome.",
      linux: "Linux: install chromium or google-chrome with your package manager.",
    },
    poppler: {
      darwin: "macOS: brew install poppler.",
      win32: "Windows: winget install oschwartz10612.Poppler, or download Poppler for Windows and add its bin folder to PATH.",
      linux: "Linux: install poppler-utils (for example, sudo apt install poppler-utils).",
    },
  };
  return hints[tool][process.platform] || hints[tool].linux;
}
