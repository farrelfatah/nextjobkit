# Your Next Job Kit Workspace

This is your private, local workspace for building evidence-backed job applications with Codex or Claude Code. Next Job Kit is already installed here; you do not need to create another workspace.

Your AI agent handles the workflow and implementation commands. You provide the career facts, decisions, and approval for any external action.

## Start Here

Open this folder in Codex or Claude Code, then paste:

> Read `AGENTS.md` and `profile/candidate.md`, then use `setup-resume-workspace` to personalize this Next Job Kit workspace. Inspect the existing placeholders, interview me for the minimum information needed, preserve any real content I provide, configure the canonical files and paths, and validate the workspace when setup is complete.

The agent should ask one focused round of roughly five to seven questions, then:

1. Personalize `profile/candidate.md`, the single configuration and career-direction interface.
2. Create or repair the configured master resume, evidence file, and application tracker.
3. Remove identity placeholders from newly created files.
4. Preserve existing non-placeholder content and submitted artifacts.
5. Confirm the selected resume template resolves and the workspace validates.

You can start from an existing resume, LinkedIn export, portfolio, or a blank history. Existing material is a source to verify, not automatically confirmed evidence.

## What Lives Where

| Path | Purpose |
| --- | --- |
| `profile/candidate.md` | Your identity, canonical paths, career direction, preferences, and claim boundaries |
| Configured evidence file | Confirmed facts, estimates, artifacts, sources, and unresolved questions |
| Configured master resume | Your canonical general resume and the source for every tailored version |
| `tailored/` | Role-specific resume versions |
| `cover-letters/` | Opportunity-specific cover letters and short notes |
| `applications/application-tracker.md` | Opportunity status and prepared or submitted artifacts |
| `archive/` | Preserved submitted or superseded versions |

Markdown is canonical. HTML and PDF files are delivery artifacts. When facts conflict, your direct confirmation and primary evidence win, followed by the configured evidence file and master resume.

## How to Prompt the Agent

A useful prompt usually names:

1. The outcome you want.
2. The source to inspect.
3. The scope of the work.
4. Facts or boundaries to preserve.
5. The result you expect to receive.

You can speak naturally; skill names are optional. “Prepare” authorizes artifact creation, not application submission, external messaging, account creation, or publishing.

## Common Workflows

### Strengthen your evidence

> Interview me about [role/project] to turn my work into defensible evidence. Ask about my contribution, artifacts, users or stakeholders, constraints, outcomes, dates, and available proof. Update my configured evidence file with confirmed facts and unresolved questions. Do not rewrite the resume until the evidence is ready.

Use this when resume bullets feel generic, a project is missing, or ownership and outcomes are unclear.

### Decide whether to apply

> Analyze this complete job listing against my configured profile, evidence, and master resume: [URL or pasted listing]. Separate hard requirements from preferences, map important requirements to confirmed evidence or visible gaps, identify eligibility risks, and recommend `Pursue`, `Pursue with caveats`, `Low priority`, or `Do not pursue`. Do not tailor my resume yet.

If the live listing cannot be verified, the agent should label its currency unverified.

### Prepare an application package

> Prepare a truthful application package for [role] at [company] from this listing: [URL]. Analyze fit first. If the decision is `Pursue` or `Pursue with caveats`, tailor from my configured master resume, write a cover letter only if it adds useful context, audit the result, export and visually inspect the PDF, and record the prepared artifacts. Do not submit the application or mark it submitted.

The agent should stop for facts or form answers that would otherwise require guessing.

### Audit a resume or PDF

> Audit [path] for [job listing]. Check evidence support, relevance, ATS-readable structure, configuration compliance, and final PDF layout. Separate failures, warnings, and improvements; cite the evidence behind claims; do not strengthen unsupported claims.

For a narrower review, say “content audit only,” “ATS structure only,” or “PDF rendering only.”

### Export and validate a PDF

> Export my configured resume as a PDF, run the required validation, render every page to an image, inspect it for clipping, overlap, awkward breaks, or blank pages, and show me the final result.

The included `classic-timeline` template uses A4 sizing. The agent handles the browser-based rendering and visual inspection.

### Record application progress

Before submission:

> Update my application tracker for [company/role] with the current opportunity state and the exact artifacts that exist. Mark them prepared, not submitted. Do not infer form answers or submission state.

After you personally submit:

> I submitted [company/role] on [date] using [exact artifact paths]. Update the tracker to submitted and preserve those versions as the sent record.

### Prepare for an interview

> Prepare me for my [stage] interview with [company]. Use the actual submitted resume, cover letter, application answers, job analysis, and confirmed evidence. Build a concise introduction, likely questions, a source-linked story bank, honest gap responses, and useful questions to ask. Keep every answer speakable and defensible.

If the submitted package is unknown, provide its exact paths rather than asking the agent to guess.

## Evidence and Safety Rules

Every kept claim should survive a live interview:

```text
measured fact > confirmed conservative estimate > concrete qualitative evidence > omission
```

Do not invent metrics, dates, titles, tools, responsibilities, company knowledge, work authorization, salary, or submission state. Team impact must not become personal ownership without proof.

Resume and application files contain personal data. Keep government identifiers, secrets, private compensation, and unnecessary form answers out of tracked files. Never push this workspace to a public repository.

## Update Next Job Kit Safely

Ask:

> Check this Next Job Kit workspace for updates. Run a dry-run first, explain what will update cleanly, what local customizations will be preserved, and any conflicts that need my decision. Do not apply anything until I approve the exact plan. After approval, apply that plan, validate the workspace, and show me the backup ID.

Updates compare the originally installed framework, your current workspace, and the incoming release. Unknown files and user-owned career data are preserved. Overlapping changes to instructions, skills, or other framework files require your decision and are never silently overwritten.

See [`docs/updating.md`](docs/updating.md) for customization, conflict, backup, and rollback behavior.

### Customize the resume template

> Customize my current resume template with [describe the changes]. If it is a built-in template, fork it once under a clear custom template ID, select that custom template in my candidate profile, preserve the built-in version for future updates, then export and visually inspect the result.

The agent keeps editing the same user-owned custom template instead of creating a new copy for every change.

## Troubleshooting

Ask:

> Check this Next Job Kit workspace and repair configuration or agent compatibility problems. Preserve my career data and submitted artifacts, run the appropriate diagnostics, and explain anything that still needs my input.

The agent may use these implementation commands:

```sh
npx next-job-kit@latest update .
npm run doctor
npm run export:resume -- <resume-markdown-path> --pdf
npm run validate:pdf -- <resume-pdf-path>
```

Regular users are not expected to operate the terminal. `npm run doctor` is an optional initialization, update, and troubleshooting check; `npm test` is for contributors and CI.

## Optional Private Backup

Next Job Kit works without GitHub. If you want cloud backup later, ask:

> Back up this Next Job Kit workspace to a new private GitHub repository. Check authentication first, explain exactly which files will be committed, exclude ignored caches and backups, and do not make the repository public.

If you do not have a GitHub account, keep using the workspace locally or place the folder in a private cloud-storage service you already trust.

## Agent Compatibility

`AGENTS.md` and `.agents/skills/` are canonical. Claude Code accesses them through these symbolic links:

```text
CLAUDE.md -> AGENTS.md
.claude/skills -> ../.agents/skills
```

If these links are missing on Windows, enable Developer Mode, then ask the agent to repair and validate compatibility.
