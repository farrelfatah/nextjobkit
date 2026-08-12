# Next Job Kit

An evidence-first agentic workflow for tailored resumes, cover letters, application records, and interview preparation.

## Start Here

1. Edit `profile/candidate.md`—the only workflow configuration interface.
2. Replace the placeholder master resume and evidence content.
3. Run validation.

```sh
npm test
npm run preview:resume
npm run export:resume -- --pdf
```

The current release supports the included `classic-timeline` template only. PDF export uses Chrome/Skia and prefers Playwright Chrome Headless Shell when installed.

## Workflow

```text
candidate profile → evidence → master resume → job analysis
                                              ↓
                          tailored resume → cover letter → audit/export
                                              ↓
                                  tracker → interview prep
```

Seven first-party skills live under `.agents/skills/`:

- `setup-resume-workspace`
- `discover-resume-evidence`
- `analyze-job-fit`
- `tailor-resume`
- `write-cover-letter`
- `audit-resume`
- `prepare-interview`

Read `AGENTS.md` for the evidence, artifact, safety, export, and validation contract.

The application tracker records opportunity state. Optional skill-quality evaluation belongs under `evals/`; the two logs serve different purposes and should not be combined.
