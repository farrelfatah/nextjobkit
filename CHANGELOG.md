# Changelog

Notable changes to Next Job Kit are documented here. Release notes describe user-visible behavior; executable migration logic lives in the package.

## [0.1.0] - 2026-08-20

### Added

- Prompt-first npm initialization for local, user-owned Next Job Kit workspaces.
- Seven evidence-first skills covering setup, discovery, job analysis, tailoring, cover letters, resume audits, and interview preparation.
- A locked built-in resume template with one-time, user-owned template forking for safe customization.
- Dry-run-first updates with Base/Local/Incoming comparison, conflict decisions, backups, privacy-safe history, validation, and rollback.
- Cross-platform package installation tests, workspace diagnostics, PDF export validation, and synthetic regression fixtures.
- Tag-driven GitHub Releases and npm Trusted Publishing with signed provenance.

### Changed

- Interactive updates require an explained dry-run and explicit approval before applying the exact plan.
- Setup treats `.next-job-kit/` as internal operational state and leaves version changes to the updater.

### Fixed

- Installed npm command shims run correctly on Windows and Unix.
- Release smoke tests resolve the registry CLI from a clean directory.
- Release automation distinguishes missing npm versions from existing commits and tolerates bounded registry propagation delays without retrying publication.

### Migration notes

- Beta workspaces can update in place; local instruction, skill, and custom-template changes are preserved unless a genuine overlapping conflict requires a decision.
- Stable `0.1.0` becomes npm's default `latest` release while prerelease history remains available by exact version.

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
