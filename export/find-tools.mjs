import { accessSync, constants, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export function findChrome() {
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
  const defaultCacheRoot = process.platform === "darwin"
    ? path.join(homedir(), "Library/Caches/ms-playwright")
    : process.platform === "win32"
      ? path.join(process.env.LOCALAPPDATA || "", "ms-playwright")
      : path.join(homedir(), ".cache/ms-playwright");
  // Playwright's own override for a shared browser cache takes precedence.
  const cacheRoots = [process.env.PLAYWRIGHT_BROWSERS_PATH, defaultCacheRoot].filter(
    (root) => root && root !== "0",
  );
  // Older Playwright releases name the binary headless_shell.
  const executableNames = process.platform === "win32"
    ? ["chrome-headless-shell.exe", "headless_shell.exe"]
    : ["chrome-headless-shell", "headless_shell"];

  for (const cacheRoot of cacheRoots) {
    if (!existsSync(cacheRoot)) {
      continue;
    }

    const releases = readdirSync(cacheRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("chromium_headless_shell-"))
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    for (const release of releases) {
      for (const executableName of executableNames) {
        const executable = findFile(path.join(cacheRoot, release), executableName, 3);
        if (executable) {
          return executable;
        }
      }
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

export function findPopplerTool(command) {
  const onPath = findExecutable(command);
  if (onPath) {
    return onPath;
  }

  // Some bundled agent runtimes ship pdftotext/pdftoppm beside a pdfinfo shim.
  const pdfinfo = command === "pdfinfo" ? null : findExecutable("pdfinfo");
  if (!pdfinfo) {
    return null;
  }

  const candidates = [
    path.resolve(path.dirname(pdfinfo), "../../native/poppler/bin", command),
    path.resolve(path.dirname(pdfinfo), "../../native/poppler/poppler/bin", command),
  ];

  return candidates.find(isExecutable) || null;
}

function findExecutable(command) {
  const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];

  for (const directory of (process.env.PATH || "").split(path.delimiter)) {
    for (const extension of extensions) {
      const candidate = path.join(directory, `${command}${extension}`);
      if (isExecutable(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function isExecutable(candidate) {
  try {
    accessSync(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
