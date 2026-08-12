#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadWorkspaceConfig } from "./workspace-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = loadWorkspaceConfig(repoRoot);
const defaultInput = path.relative(repoRoot, workspace.masterResumePath);

const args = process.argv.slice(2);
const inputArg = args.find((arg) => !arg.startsWith("--")) ?? defaultInput;
const shouldPdf = args.includes("--pdf");

const inputPath = path.resolve(repoRoot, inputArg);

if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const parsed = path.parse(inputPath);
const outputDir = parsed.dir;
const htmlPath = path.join(outputDir, `${parsed.name}.html`);
const pdfPath = path.join(outputDir, `${parsed.name}.pdf`);
const cssPath = workspace.template.stylesheetPath;
const templatePath = workspace.template.templatePath;
const cssRelativePath = path.relative(outputDir, cssPath).split(path.sep).join("/");
const cssHref = `${encodeURI(cssRelativePath)}?v=${statSync(cssPath).mtimeMs}`;

const markdown = readFileSync(inputPath, "utf8");
const template = readFileSync(templatePath, "utf8");
const content = renderMarkdown(markdown);
const title = extractTitle(markdown) || parsed.name;

const html = template
  .replaceAll("{{title}}", escapeHtml(title))
  .replaceAll("{{cssPath}}", cssHref)
  .replace("{{content}}", indent(content, 8));

mkdirSync(outputDir, { recursive: true });
writeFileSync(htmlPath, html);

console.log(`HTML written: ${relative(htmlPath)}`);
console.log(`Template: ${workspace.template.id}`);

if (shouldPdf) {
  const browser = findChrome();

  if (!browser) {
    console.error(
      "Chrome Headless Shell, Chrome, Chromium, or Edge was not found. HTML export still succeeded.",
    );
    process.exit(1);
  }

  const profilePath = mkdtempSync(path.join(tmpdir(), "next-job-kit-chrome-"));

  try {
    console.log(`PDF renderer: ${browser.kind}`);
    const result = spawnSync(
      browser.path,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-breakpad",
        "--disable-crash-reporter",
        "--no-first-run",
        "--no-default-browser-check",
        "--no-pdf-header-footer",
        "--hide-scrollbars",
        "--allow-file-access-from-files",
        `--user-data-dir=${profilePath}`,
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href,
      ],
      { stdio: "inherit" },
    );

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      const detail = result.signal ? `signal ${result.signal}` : `exit code ${result.status}`;
      throw new Error(`Chrome PDF export failed with ${detail}`);
    }
  } finally {
    rmSync(profilePath, { recursive: true, force: true });
  }

  console.log(`PDF written: ${relative(pdfPath)}`);
}

function renderMarkdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  let currentSection = null;
  let isEntryBlockOpen = false;
  let isTimelineItemOpen = false;

  const closeTimelineItem = () => {
    if (!isTimelineItemOpen) {
      return;
    }

    blocks.push("</div>");
    isTimelineItemOpen = false;
  };

  const closeEntryBlock = () => {
    closeTimelineItem();

    if (!isEntryBlockOpen) {
      return;
    }

    blocks.push("</div>");
    isEntryBlockOpen = false;
  };

  const openEntryBlock = () => {
    closeEntryBlock();
    blocks.push('<div class="entry-block">');
    isEntryBlockOpen = true;
  };

  const openSection = (title) => {
    closeEntryBlock();

    if (currentSection) {
      blocks.push("</section>");
    }

    currentSection = slugify(title);
    blocks.push(`<section class="section-${currentSection}">`);
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = renderInline(heading[2]);

      if (level === 2) {
        openSection(plainText(heading[2]));
      } else if (level === 3 && currentSection) {
        openEntryBlock();
      } else if (currentSection === "experience" && level === 4) {
        closeTimelineItem();
        blocks.push('<div class="timeline-item">');
        isTimelineItemOpen = true;
      } else {
        closeTimelineItem();
      }

      blocks.push(`<h${level}>${text}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(`<li>${renderInline(lines[index].trim().slice(2))}</li>`);
        index += 1;
      }

      blocks.push(`<ul>\n${items.join("\n")}\n</ul>`);
      continue;
    }

    const paragraph = [trimmed];
    index += 1;

    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next.startsWith("#") || next.startsWith("- ")) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }

    blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  closeEntryBlock();

  if (currentSection) {
    blocks.push("</section>");
  }

  return blocks.join("\n");
}

function renderInline(value) {
  let output = escapeHtml(value);

  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const normalizedHref = href.replaceAll("&amp;", "&");
    return `<a href="${escapeAttribute(normalizedHref)}">${label}</a>`;
  });

  return output;
}

function extractTitle(source) {
  const match = source.match(/^#\s+(.+)$/m);
  return match ? plainText(match[1]) : "";
}

function plainText(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function indent(value, spaces) {
  const pad = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line ? `${pad}${line}` : line))
    .join("\n");
}

function relative(value) {
  return path.relative(repoRoot, value);
}

function findChrome() {
  const override = process.env.NEXT_JOB_KIT_CHROME_PATH;
  if (override && existsSync(override)) {
    return { path: override, kind: "NEXT_JOB_KIT_CHROME_PATH override" };
  }

  const headlessShell = findHeadlessShell();
  if (headlessShell) {
    return { path: headlessShell, kind: "Playwright Chrome Headless Shell" };
  }

  const candidates = process.platform === "darwin"
    ? [
        ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "Google Chrome"],
        ["/Applications/Chromium.app/Contents/MacOS/Chromium", "Chromium"],
        ["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "Microsoft Edge"],
      ]
    : process.platform === "win32"
      ? [
          [path.join(process.env.PROGRAMFILES || "", "Google/Chrome/Application/chrome.exe"), "Google Chrome"],
          [path.join(process.env.PROGRAMFILES || "", "Microsoft/Edge/Application/msedge.exe"), "Microsoft Edge"],
        ]
      : [
          ["/usr/bin/google-chrome", "Google Chrome"],
          ["/usr/bin/chromium", "Chromium"],
          ["/usr/bin/chromium-browser", "Chromium"],
          ["/usr/bin/microsoft-edge", "Microsoft Edge"],
        ];

  const installed = candidates.find(([candidate]) => candidate && existsSync(candidate));
  return installed ? { path: installed[0], kind: installed[1] } : null;
}

function findHeadlessShell() {
  const cacheRoot = process.platform === "darwin"
    ? path.join(homedir(), "Library/Caches/ms-playwright")
    : process.platform === "win32"
      ? path.join(process.env.LOCALAPPDATA || "", "ms-playwright")
      : path.join(homedir(), ".cache/ms-playwright");

  if (!cacheRoot || !existsSync(cacheRoot)) {
    return null;
  }

  const releases = readdirSync(cacheRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("chromium_headless_shell-"))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  const executableName = process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell";

  for (const release of releases) {
    const executable = findFile(path.join(cacheRoot, release), executableName, 3);
    if (executable) {
      return executable;
    }
  }

  return null;
}

function findFile(directory, filename, depth) {
  if (depth < 0 || !existsSync(directory)) {
    return null;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isFile() && entry.name === filename) {
      return candidate;
    }
    if (entry.isDirectory()) {
      const nested = findFile(candidate, filename, depth - 1);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}
