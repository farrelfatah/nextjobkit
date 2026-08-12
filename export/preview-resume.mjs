#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync, watchFile } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceConfig } from "./workspace-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportScriptPath = path.resolve(repoRoot, "export/export-resume.mjs");
const workspace = loadWorkspaceConfig(repoRoot);
const liveReloadScript = `
<script>
  new EventSource("/__resume_live_reload").onmessage = function (event) {
    if (event.data === "reload") window.location.reload();
  };
</script>`;

const { inputArg, port, host } = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(repoRoot, inputArg);

if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${path.relative(repoRoot, inputPath)}`);
  process.exit(1);
}

const parsed = path.parse(inputPath);
const htmlPath = path.join(parsed.dir, `${parsed.name}.html`);
const startPath = `/${path.relative(repoRoot, htmlPath).split(path.sep).join("/")}`;
const clients = new Set();

generateHtml();

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);

  if (url.pathname === "/") {
    response.writeHead(302, { Location: startPath });
    response.end();
    return;
  }

  if (url.pathname === "/__resume_live_reload") {
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
    });
    response.write("\n");
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  const filePath = resolveRequestPath(url.pathname);

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  if (filePath === htmlPath) {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(transformHtml(readFileSync(filePath, "utf8")));
    return;
  }

  response.writeHead(200, { "Content-Type": contentType(filePath) });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Resume preview: http://${host}:${port}${startPath}`);
  console.log("Watching export/resume.css, export/resume-template.html, and the Markdown source.");
});

watchForChange(path.resolve(repoRoot, "export/resume.css"), notifyReload);
watchForChange(path.resolve(repoRoot, "export/resume-template.html"), () => {
  generateHtml();
  notifyReload();
});
watchForChange(inputPath, () => {
  generateHtml();
  notifyReload();
});

function parseArgs(args) {
  let portValue = 4174;
  let hostValue = "127.0.0.1";
  let inputValue = path.relative(repoRoot, workspace.masterResumePath);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--port") {
      portValue = Number(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--host") {
      hostValue = args[index + 1];
      index += 1;
      continue;
    }

    if (!arg.startsWith("--")) {
      inputValue = arg;
    }
  }

  if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
    console.error("Port must be an integer between 1 and 65535.");
    process.exit(1);
  }

  return { inputArg: inputValue, port: portValue, host: hostValue };
}

function generateHtml() {
  execFileSync(process.execPath, [exportScriptPath, path.relative(repoRoot, inputPath)], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function resolveRequestPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.replace(/^\/+/, "");
  const filePath = path.resolve(repoRoot, relativePath);

  if (!filePath.startsWith(`${repoRoot}${path.sep}`) && filePath !== repoRoot) {
    return null;
  }

  return filePath;
}

function transformHtml(html) {
  return html
    .replace(/(<link\s+rel="stylesheet"\s+href=")[^"]+("\s*>)/, "$1/export/resume.css$2")
    .replace("</body>", `${liveReloadScript}\n  </body>`);
}

function watchForChange(filePath, onChange) {
  watchFile(filePath, { interval: 250 }, (current, previous) => {
    if (current.mtimeMs === previous.mtimeMs) {
      return;
    }

    clearTimeout(watchForChange.timers.get(filePath));
    watchForChange.timers.set(filePath, setTimeout(onChange, 80));
  });
}

watchForChange.timers = new Map();

function notifyReload() {
  for (const client of clients) {
    client.write("data: reload\n\n");
  }
}

function contentType(filePath) {
  const extension = path.extname(filePath);

  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js" || extension === ".mjs") return "text/javascript; charset=utf-8";
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".md") return "text/markdown; charset=utf-8";

  return "application/octet-stream";
}
