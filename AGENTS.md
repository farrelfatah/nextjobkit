# Next Job Kit Agent Contract

## Mission

Help a candidate build defensible, role-specific application packages from evidence. Optimize for truth, relevance, and usable artifacts—not résumé theater.

The workflow must remain portable to a newly initialized workspace even when the current workspace contains real candidate data.

## Read First

1. `profile/candidate.md` — the only user-facing configuration and decision interface.
2. The configured evidence file.
3. The configured master resume.
4. The relevant job source and existing application artifacts.

Resolve canonical paths and the selected template from the profile. Do not hardcode a person's name, slug, role, or filenames in workflow logic.

## Source Hierarchy

When facts conflict, use this order:

1. Direct user confirmation and primary evidence.
2. The configured resume evidence file.
3. The configured master resume.
4. Tailored and application artifacts.
5. Generated HTML and PDF.

Markdown is canonical. HTML, PDF, DOCX, and form entries are delivery artifacts unless the user explicitly says otherwise.

## Skill Router

Use the smallest skill that owns the current stage:

| Need | Skill |
| --- | --- |
| Personalize or repair a workspace | `setup-resume-workspace` |
| Missing facts, outcomes, or direction | `discover-resume-evidence` |
| Requirements, eligibility, and fit | `analyze-job-fit` |
| Targeted resume version | `tailor-resume` |
| Cover letter or hiring-manager note | `write-cover-letter` |
| Content, ATS, and PDF QA | `audit-resume` |
| Interview brief and story bank | `prepare-interview` |

Do not invoke the entire chain for a narrow task. Evidence discovery is conditional, not ritual. Cover letters are part of the core package when the application benefits from one.

## Default Workflow

```text
profile/candidate.md
        ↓
confirmed evidence
        ↓
master resume
        ↓
job-fit analysis
        ↓
tailored resume → cover letter → audit/export
        ↓
application tracker
        ↓
interview preparation
```

Rules:

- Update evidence before promoting a new claim into the master resume.
- Tailor from the master, never from another tailored version.
- Record prepared artifacts only after they exist.
- Mark an application submitted only after explicit candidate confirmation.
- Prepare interviews from the actual submitted package when known.

## Evidence Standard

Every kept claim must be defensible in a live interview.

Evidence may be a measured result, user-confirmed conservative estimate, concrete qualitative outcome, artifact, source link, screenshot, testimonial, or interview answer.

Use this order:

```text
Measured fact > confirmed estimate > concrete qualitative evidence > omission
```

Never invent metrics, dates, titles, tools, responsibilities, company knowledge, product usage, work authorization, salary, or submission state. Never turn team impact into personal ownership without proof.

Unlisted experience is a candidate entry, not an error. Record its type, organization, dates, confidence, possible placement, and unresolved questions in the evidence file before deciding where it belongs.

## Job Analysis

Inspect the complete current listing when available. Separate hard requirements, preferences, responsibilities, outcomes, logistics, and legal eligibility.

Map important requirements to specific evidence and visible gaps. Do not generate a fake match percentage. Use one decision: `Pursue`, `Pursue with caveats`, `Low priority`, or `Do not pursue`.

When authorized to prepare an application, inspect the real form—including optional, later-screening, consent, validation, and shadow-DOM fields where accessible. Do not submit without explicit authorization.

## Artifact Contract

Default naming uses lowercase kebab-case and `candidate_slug` from the profile.

```text
tailored/[role-type]/[candidate-slug]-[role-type]-[company]-[yyyymmdd].md
cover-letters/[candidate-slug]-[company]-[role-type]-cover-letter-[yyyymmdd].md
applications/[candidate-slug]-[company]-[role-type]-application-prep-[yyyymmdd].md
applications/[candidate-slug]-[company]-[role-type]-interview-prep-[yyyymmdd].md
```

Keep exported HTML and PDF next to their matching Markdown source. Archive submitted artifacts instead of overwriting or deleting them.

The application tracker records opportunity state and sent artifacts. Do not add a skill-usage log to the candidate workflow or public starter. Automated synthetic regression fixtures belong under `tests/fixtures/`.

## Resume Content

- Lead with the target role's actual hiring thesis.
- Use active verbs and concrete artifacts.
- Keep bullets focused on action, scope or artifact, method, and outcome.
- Prefer relevant evidence over keyword density.
- Remove irrelevant content before changing typography.
- Keep headings, bullets, and links simple and extractable.
- Put unsupported claims in evidence notes, not final artifacts.

## Single Configuration Interface

`profile/candidate.md` is the only file users edit to configure workflow decisions. Keep scalar machine settings in its flat YAML frontmatter and career preferences or boundaries in its Markdown body.

Required keys:

- `schema_version`
- `candidate_name`
- `candidate_slug`
- `resume_template`
- `master_resume_path`
- `resume_evidence_path`
- `application_tracker_path`

Do not add a second config file for template selection or career decisions.

## Export Contract

The current release supports one built-in template: `classic-timeline`. Users may fork it into a user-owned custom template through the Next Job Kit CLI; keep built-in and custom template IDs distinct.

Its approved files are:

- `export/resume-template.html`
- `export/resume.css`

Do not replace, restyle, or reinterpret the built-in files. `export/template-baseline.json` locks their approved hashes. Built-in additions must be additive and registered in `export/templates.json`. Custom templates live under `export/custom-templates/`, use `origin: user`, and are never baseline-locked or overwritten by updates.

Export with:

```sh
npm run export:resume -- <resume-markdown-path> --pdf
```

The exporter prefers Playwright Chrome Headless Shell, uses an isolated temporary browser profile, and falls back to installed Chrome-family browsers. If the execution sandbox blocks Chrome, request browser permission; do not switch to LibreOffice or another renderer.

Before calling a PDF final:

1. Run `npm run doctor` and the relevant PDF validation.
2. Confirm Chrome/Skia, A4 sizing, no more than two pages, extractable text, and expected sections.
3. Render every page to an image and inspect it.
4. Reject clipping, overlap, unreadable glyphs, orphaned headings, awkward block splits, and accidental blank pages.
5. Fix recurring pagination in shared template CSS only when a deliberate template change has been approved. Fix role-specific length in the Markdown.

## Runtime Diagnostics

```sh
npm run doctor
npm run export:resume -- <resume-markdown-path> --pdf
npm run validate:pdf -- <resume-pdf-path>
```

Users are not expected to run repository tests routinely. `npm run doctor` is an optional initialization, update, and troubleshooting check for workspace configuration and agent compatibility.

## Distribution and Updates

The public npm package is the versioned distribution artifact; generated workspaces remain private and must not inherit publishing metadata.

The agent-facing CLI surface is:

```sh
next-job-kit init <directory>
next-job-kit template fork <built-in-id> <custom-id> --workspace <directory>
next-job-kit update <directory>
next-job-kit update <directory> --apply --plan <plan-id>
next-job-kit update <directory> --rollback <backup-id>
```

Human documentation leads with natural-language prompts. CLI commands are implementation details the agent normally operates.

Updates use Base/Local/Incoming comparison. Preserve unknown files and user-owned paths, merge only non-overlapping text or semantic JSON changes, and block unresolved overlap. Never write conflict markers into live files. Recheck dry-run preconditions, create a backup, validate after application, and restore automatically on failure.

`.next-job-kit/manifest.json` and `.next-job-kit/history.jsonl` are internal operational metadata, not user configuration. History may record versions, relative paths, decisions, validation, and backup IDs; it must not record prompts, résumé contents, diffs, secrets, or absolute paths. Base caches, pending plans, and backups remain ignored by Git.

## Maintainer Validation

```sh
npm test
```

`npm test` is a contributor and CI gate. It validates runtime diagnostics, seven required first-party skills plus valid user-created skills, locked template files, package privacy, update safety, and synthetic regression fixtures without external packages.

## Agent Compatibility

`AGENTS.md` and `.agents/skills/` are canonical. `CLAUDE.md` must remain a symbolic link to `AGENTS.md`, and `.claude/skills` must remain a symbolic link to `../.agents/skills`. Never maintain copied Claude-specific versions of these sources.

## Privacy and Safety

- Treat resumes, evidence, trackers, and submitted artifacts as user data.
- Keep secrets, government identifiers, private compensation, and unnecessary form answers out of tracked files.
- Preserve unrelated edits and existing artifacts.
- Do not create multiple master resumes.
- Do not delete submitted versions.
- Do not expand from preparation into submission, messaging, or publishing without authorization.
