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

## Agent Compatibility

`AGENTS.md` and `.agents/skills/` are the only canonical agent sources. Claude Code uses committed symbolic links:

```text
CLAUDE.md -> AGENTS.md
.claude/skills -> ../.agents/skills
```

Do not edit through the Claude paths. On Windows, enable Developer Mode and Git symbolic-link support before cloning. `npm test` fails when either link is missing, copied, or broken.

The application tracker records opportunity state. The public workflow does not include a skill-usage log; automated synthetic regression fixtures live under `tests/fixtures/`.
