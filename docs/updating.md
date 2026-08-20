# Updating Next Job Kit

Ask your agent:

> Check my Next Job Kit for updates. Run a dry-run first, explain clean changes, preserved customizations, and conflicts. Do not apply anything until I approve the exact plan. After approval, apply it, validate the workspace, and show me the backup ID.

The agent runs the latest CLI against your workspace. A dry-run writes only an ignored pending plan under `.next-job-kit/pending/`; it does not change managed workspace files.

## How comparison works

Every managed path is compared across three versions:

- **Base:** the framework content originally installed.
- **Local:** your current workspace.
- **Incoming:** the release you are updating to.

| Situation | Result |
| --- | --- |
| Only Incoming changed | Update automatically |
| Only Local changed | Preserve Local |
| Both changed different sections | Merge automatically |
| Both changed the same section | Require a decision |
| User created a new file | Preserve it |
| Upstream removed an unchanged file | Remove it |
| Upstream removed a customized file | Preserve it as a local orphan |

JSON registries merge by keys. Markdown and skill instructions use three-way text merging. Symlinks and executable framework files update only when their original versions were not locally modified.

## Built-in template conflicts

If you edited `classic-timeline` directly, the dry-run recommends preserving that design as a custom template before accepting the new built-in:

> Preserve my modified built-in template as a custom template called `[template-id]`, then rerun the update and accept the incoming built-in files. Keep the custom template selected.

The agent forks the current HTML and CSS, registers the user-owned ID, updates `profile/candidate.md`, reruns the dry-run, and asks before replacing the built-in.

## Applying and rolling back

An update plan has a unique ID. Before applying it, the CLI verifies that none of the compared files changed after the dry-run. It then backs up every affected path, applies the result, and runs workspace, compatibility, state, skill, template, and fixture validation.

If validation fails, the CLI restores the backup automatically. After a successful update, you can still request:

> Roll back my last Next Job Kit update using backup `[backup-id]`, validate the restored workspace, and explain the resulting version.

Backups contain only paths touched by the update plus the previous manifest and base cache. They are ignored by Git.

## Legacy Git clones

Workspaces created before npm distribution do not have an installed manifest. The updater can adopt one only when it can recover the original framework baseline from the clone's Git history and `origin/main` reference. If that baseline is unavailable, it stops instead of treating customized files as pristine framework content.
