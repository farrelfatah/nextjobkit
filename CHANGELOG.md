# Changelog

Notable changes to Next Job Kit are documented here. Release notes describe user-visible behavior; executable migration logic lives in the package.

## [0.1.0-beta.2] - 2026-08-20

### Changed

- Update agents now require a dry-run explanation and explicit approval before applying the exact plan.
- Workspace setup now preserves installed update metadata instead of treating it as setup configuration.

### Fixed

- GitHub releases smoke-test the registry-installed CLI outside the maintainer package so npm resolves the published executable correctly.

## [0.1.0-beta.1] - 2026-08-20

### Added

- Public `next-job-kit` npm CLI with prompt-first workspace initialization.
- Separate private package manifest for generated career workspaces.
- One-time built-in-to-custom template forking with user-owned template IDs.
- Installed-version manifest, base cache, privacy-safe operational history, backups, and legacy-clone adoption.
- Dry-run-first Base/Local/Incoming updates with text and semantic JSON merging.
- Explicit conflict decisions, stale-plan detection, atomic file replacement, validation, automatic recovery, and manual rollback.
- Package, template, update, privacy, and synthetic workspace regression coverage.
- GitHub CI, npm trusted-publishing preparation, and synchronized release documentation.

### Migration notes

- Existing Git clones are adopted only when their original framework baseline can be recovered from Git history.
- Directly modified built-in templates should be forked under a custom template ID before accepting incoming built-in files.
- The beta registry rehearsal occurs after merge because the publishing workflow must exist on `main`.
