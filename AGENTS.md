# Next Job Kit Agent Contract

## Mission

Help a candidate build defensible, role-specific application packages from evidence. Optimize for truth, relevance, and usable artifacts—not résumé theater.

The workflow must remain portable to a clean clone even when the current workspace contains real candidate data.

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
| Personalize or repair a clone | `setup-resume-workspace` |
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

The current release supports one template: `classic-timeline`.

Its approved files are:

- `export/resume-template.html`
- `export/resume.css`

Do not replace, restyle, or reinterpret this template. `export/template-baseline.json` locks its approved hashes. Future templates must be additive and registered in `export/templates.json`.

Export with:

```sh
npm run export:resume -- <resume-markdown-path> --pdf
```

The exporter prefers Playwright Chrome Headless Shell, uses an isolated temporary browser profile, and falls back to installed Chrome-family browsers. If the execution sandbox blocks Chrome, request browser permission; do not switch to LibreOffice or another renderer.

Before calling a PDF final:

1. Run repository validation.
2. Confirm Chrome/Skia, A4 sizing, no more than two pages, extractable text, and expected sections.
3. Render every page to an image and inspect it.
4. Reject clipping, overlap, unreadable glyphs, orphaned headings, awkward block splits, and accidental blank pages.
5. Fix recurring pagination in shared template CSS only when a deliberate template change has been approved. Fix role-specific length in the Markdown.

## Validation

```sh
npm test
npm run export:resume -- <resume-markdown-path> --pdf
npm run validate:pdf -- <resume-pdf-path>
```

`npm test` validates the workspace contract, seven first-party skills, and the locked template files without external packages.

## Privacy and Safety

- Treat resumes, evidence, trackers, and submitted artifacts as user data.
- Keep secrets, government identifiers, private compensation, and unnecessary form answers out of tracked files.
- Preserve unrelated edits and existing artifacts.
- Do not create multiple master resumes.
- Do not delete submitted versions.
- Do not expand from preparation into submission, messaging, or publishing without authorization.
