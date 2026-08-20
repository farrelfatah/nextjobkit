---
name: setup-resume-workspace
description: Initialize or reconfigure a Next Job Kit workspace from the single profile/candidate.md interface. Use when a user has cloned the repository, needs to personalize canonical paths and career preferences, or wants to repair missing workspace files without overwriting existing resume content.
---

# Set Up Resume Workspace

Create a usable evidence-first resume workspace while preserving anything the user already wrote.

## Workflow

1. Read `profile/candidate.md`, `README.md`, and `AGENTS.md`.
2. Inspect the configured master resume, evidence file, and application tracker paths.
3. Identify blank profile fields, placeholder content such as `Your Name` or `example.com`, missing paths, and conflicting files.
4. Ask only for information needed to make the workspace usable. Prefer one focused round of five to seven questions.
5. Update `profile/candidate.md` as the sole user-facing configuration file.
6. Create a missing canonical file from the matching top-level `templates/` file when available, then personalize its identity, headline, paths, and contact fields before calling setup complete.
7. Never replace a non-placeholder master resume, evidence file, tracker, or submitted artifact.
8. Run `npm run validate` and report any remaining setup gaps.

## Candidate Profile Contract

Keep machine-readable scalar settings in YAML frontmatter and human decisions in the Markdown body.

Require these frontmatter keys:

- `schema_version`
- `candidate_name`
- `candidate_slug`
- `resume_template`
- `master_resume_path`
- `resume_evidence_path`
- `application_tracker_path`

Treat contact links, location, positioning, work preferences, and claim boundaries as optional until the user needs them. Do not invent missing values.

Only accept a `resume_template` registered in `export/templates.json`. Do not silently substitute a template.

## Safety Rules

- Treat existing Markdown as user data.
- Do not delete or rename submitted artifacts during setup.
- Do not put secrets, government identifiers, private phone numbers, or unconfirmed compensation into tracked files.
- Do not create multiple master resumes.
- Preserve the configured paths during a compatibility migration.
- Do not edit or regenerate `.next-job-kit/` update metadata during setup; use the update CLI for version changes.

## Completion Standard

Finish when the profile parses, configured paths stay inside the repository, canonical files exist, identity placeholders are removed from the profile and newly copied master, the selected template resolves, and validation passes. List any optional facts the user still needs to supply.
