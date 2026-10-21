# Changelog

Notable changes to Next Job Kit are documented here. Release notes describe user-visible behavior; executable migration logic lives in the package.

## [Unreleased]

### Added

- Claude Code guardrails in new workspaces: `.claude/settings.json` pre-approves diagnostics and export, denies reading `.env` files, and asks before `git push`; hooks ask before edits to locked built-in templates, `.next-job-kit/`, or archived artifacts, re-validate after `profile/candidate.md` changes, and report setup problems at session start.
- A read-only `claim-auditor` Claude Code subagent for independent evidence checks during audits.
- `npm run render:pdf` renders every PDF page to an image for visual QA.
- `npm run doctor` now checks prerequisites (Node.js, a Chrome-family browser, Poppler) and gives platform-specific install guidance; missing PDF tools are warnings.
- A synthetic example package (job-fit analysis, tailored resume, cover letter) under `docs/examples/`, and a prompt library in `docs/prompts.md`.
- CI runs on Linux, macOS, and Windows with the minimum supported Node.js and current LTS.

### Changed

- The README is shorter and leads with an example and an updated Quick Start; the full prompt catalog moved to `docs/prompts.md`.
- User-created skills may use Claude Code frontmatter keys and no longer require `agents/openai.yaml`. First-party skills stay within the open Agent Skills standard.
- PDF export finds Playwright's headless shell in `PLAYWRIGHT_BROWSERS_PATH` and under its older `headless_shell` name.
- Newly created workspaces receive a post-install README focused on personalization, career workflows, safe updates, and optional private backup; the public package README retains installation and contributor guidance.
- Windows setup guidance now distinguishes workspace initialization from cloning the source repository.

### Fixed

- `npm run doctor` and agent-compatibility checks no longer reject a correct `.claude/skills` symlink on Windows, where link targets use backslashes.
- Skill validation accepts files checked out with CRLF line endings, and `.gitattributes` keeps clones on LF so locked template hashes match on Windows.
- Workspace manifests store symlink targets with forward slashes, so updates and state validation agree across platforms.
- Legacy-clone adoption accepts Windows paths reported in 8.3 short form.

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
