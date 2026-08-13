# Next Job Kit

An evidence-first agentic workflow for tailored resumes, cover letters, application records, and interview preparation.

## Start Here

1. Edit `profile/candidate.md`—the only workflow configuration interface.
2. Replace the placeholder master resume and evidence content.
3. Ask your agent to analyze a job, tailor the resume, or prepare an application package.

When you are ready for a PDF, ask your agent:

> Export my configured resume as a PDF, validate it, and show me the final result.

The agent handles the export command, validates the PDF, inspects every rendered page, and gives you the finished file. You do not need to use the terminal. The current release supports the included `classic-timeline` template only.

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

Do not edit through the Claude paths. On Windows, enable Developer Mode and Git symbolic-link support before cloning.

## Troubleshooting

Most users never need to run repository checks. After cloning or updating, if configuration paths or agent discovery appear broken, ask your agent:

> Check my Next Job Kit setup and fix any workspace configuration or agent compatibility problems.

The agent can run the optional diagnostics and explain anything that needs attention. Contributors—not regular users—should run `npm test` before publishing repository changes.

The application tracker records opportunity state. The public workflow does not include a skill-usage log; automated synthetic regression fixtures live under `tests/fixtures/`.
