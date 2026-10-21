import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Node resolves this module's own path through symlinks (for example macOS
// /var -> /private/var), so compare against real paths on both sides.
export const workspaceRoot = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
);

// Returns the workspace-relative path with forward slashes, or null when the
// file lies outside the workspace. The file itself may not exist yet.
export function workspaceRelativePath(filePath, cwd) {
  const absolute = path.resolve(cwd || workspaceRoot, filePath);
  let existing = absolute;
  while (!existsSync(existing) && path.dirname(existing) !== existing) {
    existing = path.dirname(existing);
  }
  const real = path.join(realpathSync(existing), path.relative(existing, absolute));
  const relative = path.relative(workspaceRoot, real);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return relative.split(path.sep).join("/");
}
