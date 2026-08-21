# Next Job Kit

Next Job Kit is an evidence-first workflow for working with an AI agent on job applications. It turns one trusted career record into role-specific resumes, cover letters, application records, and interview preparation without inventing experience or letting versions drift.

Most resume tools start with wording. Next Job Kit starts with proof:

```text
candidate profile → confirmed evidence → master resume → job analysis
                                                        ↓
                                    tailored resume → cover letter → audit/PDF
                                                        ↓
                                            application record → interview prep
```

The result is not merely a polished resume. It is an application package you can defend in an interview.

## What It Does

Next Job Kit helps you:

- Set up a reusable candidate workspace through a guided agent conversation.
- Turn projects, outcomes, artifacts, and interview answers into confirmed resume evidence.
- Decide whether an opportunity is worth pursuing before spending time tailoring.
- Create a targeted resume from the master resume—not from another tailored version.
- Write a concise cover letter or hiring-manager note when it adds useful context.
- Audit claims, relevance, ATS-readable structure, and final PDF rendering.
- Track prepared and submitted application artifacts without confusing the two.
- Prepare interview answers from the package you actually submitted.

It is not a job board, an automatic application bot, or a license to manufacture impressive-sounding claims. The agent must not submit an application, message someone, or mark an application submitted without your explicit authorization or confirmation.

## Quick Start

### 1. Create and open a local workspace

Open Codex or Claude Code in the folder where you want to keep your career files, then paste:

> Set up Next Job Kit for me locally. Use the latest published `next-job-kit` npm package to create a new workspace in `./next-job-kit`; handle the required npm or npx commands yourself. After creating it, use that folder as the working directory and confirm that `README.md`, `AGENTS.md`, and `.agents/skills/` are available. Do not create accounts, publish anything, or push anything to GitHub unless I explicitly ask.

The agent runs the implementation command for you. Terminal users can run it directly:

```sh
npx next-job-kit@latest init ./next-job-kit
```

Open the generated folder in Codex or Claude Code. It includes the agent instructions and seven first-party workflow skills; you do not need to install a separate resume skill or keep the npm package installed globally.

### 2. Ask the agent to initialize it

Copy this prompt:

> Use `setup-resume-workspace` to initialize my Next Job Kit. Read `README.md`, `AGENTS.md`, and `profile/candidate.md`; inspect the existing placeholders; then interview me for the minimum information needed. Preserve any real content I provide, configure the canonical files and paths, and validate the workspace when setup is complete.

The agent should ask one focused round of roughly five to seven questions, then:

1. Personalize `profile/candidate.md`, the single configuration and career-direction interface.
2. Create or repair the configured master resume, evidence file, and application tracker.
3. Remove identity placeholders from newly initialized files.
4. Preserve existing non-placeholder resume content and submitted artifacts.
5. Confirm the selected resume template resolves and the workspace validates.

You can initialize from an existing resume, LinkedIn export, portfolio, or a blank history. Existing material is a starting source, not automatically confirmed evidence.

### 3. Choose the next useful outcome

If your experience is incomplete or full of vague claims, start with evidence discovery. If your sources are already solid and you have a job listing, start with job-fit analysis.

> Interview me to turn my existing resume and project history into defensible evidence. Focus first on ownership, artifacts, outcomes, dates, and anything that would materially change my positioning. Update the evidence file, but do not invent missing details.

Or:

> Analyze this complete job listing against my configured profile, evidence, and master resume: [paste the listing or URL]. Separate hard requirements from preferences, show the evidence and gaps, and recommend `Pursue`, `Pursue with caveats`, `Low priority`, or `Do not pursue`. Do not tailor my resume yet.

## How the Workspace Thinks

Next Job Kit keeps different kinds of truth in different places:

| Source | Purpose | Rule |
| --- | --- | --- |
| `profile/candidate.md` | Identity, canonical paths, career direction, preferences, and claim boundaries | The only user-facing configuration interface |
| Configured evidence file | Confirmed facts, estimates, artifacts, sources, and unresolved questions | New claims belong here before entering the master resume |
| Configured master resume | The canonical general resume | Tailored resumes always start here |
| Job analysis | Requirements, eligibility, evidence map, gaps, and pursue decision | Inspect the complete current listing when possible |
| `tailored/` and `cover-letters/` | Opportunity-specific artifacts | Version them; never use one tailored resume as the next source |
| `applications/application-tracker.md` | Opportunity state and prepared or sent artifacts | “Prepared” is not “submitted” |
| Interview prep | Speakable stories and answers | Prefer the actual submitted package when known |

When sources conflict, direct confirmation and primary evidence win, followed by the evidence file, master resume, tailored artifacts, and generated delivery files. Markdown is canonical; HTML and PDF are outputs.

The evidence standard is deliberately strict:

```text
measured fact > confirmed conservative estimate > concrete qualitative evidence > omission
```

Team impact must not become personal ownership without proof. Prototype work must not become production engineering. Adjacent experience must not become direct experience. A clean omission is better than a claim that falls apart in an interview.

## Prompting the Agent Well

You can speak naturally; skill names are optional. A strong prompt usually contains five things:

1. **Outcome:** what decision or artifact you want.
2. **Source:** a listing URL, pasted description, resume, portfolio, or application package.
3. **Scope:** one stage or the complete package.
4. **Boundaries:** facts to preserve, claims to avoid, and actions not authorized.
5. **Finish line:** the files, audit, export, or recommendation you expect.

For example:

> Prepare a truthful application package for [role] at [company] from this listing: [URL]. Analyze fit first. If the decision is `Pursue` or `Pursue with caveats`, tailor from my configured master resume, write a cover letter only if it adds context, audit the result, export and visually inspect the PDF, and record the prepared artifacts. Do not submit the application or mark it submitted.

Explicit boundaries matter. “Prepare” authorizes artifact creation; it does not authorize submission, external messaging, or publishing.

## Common Use Cases and Prompts

### Initialize or repair a workspace

> Use `setup-resume-workspace` to personalize this workspace. Interview me for required information, use my existing resume where it is supported, preserve non-placeholder content, create missing canonical files from the templates, and validate the result.

Use this for a first setup, changed identity or paths, or a workspace that no longer validates.

### Discover stronger evidence

> Use `discover-resume-evidence` to interview me about [role/project]. Ask about my contribution, the artifact, users or stakeholders, constraints, outcomes, dates, and proof. Update the configured evidence file with confirmed facts and unresolved questions. Do not rewrite the resume until the evidence is ready.

Use this when bullets feel generic, a project is missing, a metric is questionable, or your real contribution is unclear.

### Decide whether to apply

> Use `analyze-job-fit` on this listing: [URL or pasted text]. Check the full current listing and application logistics when accessible. Map every important requirement to confirmed evidence or a visible gap, identify hard eligibility risks, and give one pursue decision. Do not use a fake match percentage and do not create application artifacts yet.

Use this before investing in tailoring. If the live listing cannot be verified, the agent should label its currency unverified.

### Tailor a resume

> Use `tailor-resume` for [role] at [company] using the completed job analysis. Start from my configured master resume, lead with the role’s hiring thesis, keep only evidence-backed claims, preserve titles/dates/ownership, save a new version under `tailored/`, and record it as prepared in the tracker.

Use this after fit analysis. Never ask the agent to tailor from another company’s version.

### Write a cover letter or short note

> Use `write-cover-letter` for this opportunity using the stable tailored resume and confirmed evidence. Add context the resume cannot carry, make two or three specific evidence-backed connections, avoid invented product affinity, and keep it to 200–350 words.

For an application text field, ask for a 100–180 word note instead. A cover letter is useful when it explains motivation, a transition, or an adjacent-experience gap; it should not narrate the resume.

### Prepare a complete application package

> Analyze [listing], then prepare the evidence-backed resume and any useful cover letter for [company/role]. Audit the content and final rendering, export the PDF, inspect every page, and record exactly which artifacts are prepared. Stop before submission and show me unresolved eligibility questions or form answers I must confirm.

Use this when you want the agent to run the connected stages. It should pause for facts that would otherwise require guessing.

### Audit an existing resume or final PDF

> Use `audit-resume` on [path] for [job listing]. Check evidence support, relevance, ATS-readable structure, configuration compliance, and the final PDF layout. Separate failures, warnings, and improvements; cite the evidence behind claims; do not rewrite unsupported claims into stronger-sounding language.

If you only want one layer, say so: “content audit only,” “ATS structure only,” or “PDF rendering only.”

### Export and validate a PDF

> Export my configured resume as a PDF, run the required validation, render every page to an image, inspect it for clipping, overlap, awkward breaks, or blank pages, and show me the final result.

The current release supports the included `classic-timeline` A4 template only. The agent handles the command and browser-based rendering; regular users do not need to operate the terminal.

### Record application progress

> Update the application tracker for [company/role] with the current opportunity state and the exact artifacts that exist. Mark them prepared, not submitted. Do not infer any form answers or submission state.

After you personally submit:

> I submitted [company/role] on [date] using [exact artifact paths]. Update the tracker to submitted and preserve those versions as the sent record.

### Prepare for an interview

> Use `prepare-interview` for my [stage] interview with [company]. Use the actual submitted resume, cover letter, application answers, job analysis, and confirmed evidence. Build a concise introduction, likely questions, a source-linked story bank, honest gap responses, and questions I should ask. Keep every answer speakable and defensible.

If the submitted package is unknown, provide its paths. The agent should not guess which prepared version was sent.

### Troubleshoot the workspace

> Check my Next Job Kit setup and repair workspace configuration or agent compatibility problems. Preserve my resume data and submitted artifacts, run the appropriate diagnostics, and explain any gaps that still need my input.

`npm run doctor` is the optional workspace/update troubleshooting check. `npm test` is for contributors and CI, not routine candidate use.

### Update Next Job Kit safely

> Check my Next Job Kit for updates. Run a dry-run first, explain what will update cleanly, what local customizations will be preserved, and any conflicts that need my decision. Do not apply the update until I approve the plan. After approval, apply that exact plan, validate the workspace, and show me the backup ID.

Updates compare the originally installed framework, your current workspace, and the incoming release. Unknown files and user-owned career data are preserved. Overlapping changes to framework instructions or skills require an explicit decision; they are never silently overwritten. See [`docs/updating.md`](docs/updating.md) for conflict and rollback behavior.

### Customize the resume template

> Customize my current resume template with [describe the changes]. If it is a built-in template, fork it once under a clear custom template ID, select that custom template in my candidate profile, preserve the built-in version for future updates, then export and visually inspect the result.

The included `classic-timeline` remains a locked built-in. The agent creates one user-owned copy for customization and keeps editing that copy; it does not generate another template on every change.

## The Seven First-Party Skills

| Skill | Owns |
| --- | --- |
| `setup-resume-workspace` | Initialization, personalization, canonical paths, and safe repair |
| `discover-resume-evidence` | Candidate interviews, proof, metrics, artifacts, and unresolved facts |
| `analyze-job-fit` | Requirements, eligibility, gaps, and the pursue decision |
| `tailor-resume` | Truthful role-specific resume versions |
| `write-cover-letter` | Cover letters and short hiring-manager notes |
| `audit-resume` | Evidence, relevance, ATS structure, configuration, and PDF QA |
| `prepare-interview` | Introductions, likely questions, story banks, and gap responses |

The agent should use the smallest skill that owns the requested stage. Evidence discovery is conditional, not ceremony; a narrow audit should not trigger an entire application workflow.

## Files and Versioning

Default generated names use the `candidate_slug` configured in `profile/candidate.md`:

```text
tailored/[role-type]/[candidate-slug]-[role-type]-[company]-[yyyymmdd].md
cover-letters/[candidate-slug]-[company]-[role-type]-cover-letter-[yyyymmdd].md
applications/[candidate-slug]-[company]-[role-type]-application-prep-[yyyymmdd].md
applications/[candidate-slug]-[company]-[role-type]-interview-prep-[yyyymmdd].md
```

Keep HTML and PDF exports beside their matching Markdown source. Archive submitted artifacts instead of overwriting or deleting them. The tracker records opportunities and sent artifacts; it is not a log of which agent skills ran.

Generated npm workspaces also contain internal update metadata:

```text
.next-job-kit/
├── manifest.json       installed version and framework ownership
├── history.jsonl       privacy-safe update and template decisions
├── base-cache/         ignored original framework snapshot
├── backups/            ignored rollback copies
└── pending/            ignored dry-run plans
```

`manifest.json` and `history.jsonl` are operational records, not another user configuration interface. They never store prompts, résumé contents, diffs, secrets, or absolute paths.

## Privacy and Safety

Resume and application data is personal data. Keep private compensation, government identifiers, secrets, and unnecessary form answers out of tracked files. Do not push personalized candidate data to a public repository.

Local-first does not mean local-only. If you want cloud backup later, ask:

> Back up my Next Job Kit workspace to a new private GitHub repository. Check authentication first, explain exactly which files will be committed, exclude ignored caches and backups, and do not make the repository public.

GitHub is optional. You can use Next Job Kit without an account and add private backup only when it is useful to you.

Next Job Kit intentionally requires explicit confirmation for submission state, legal eligibility, work authorization, salary, and application-specific answers. These are exactly the details an AI should not “helpfully” guess.

## Agent Compatibility

`AGENTS.md` and `.agents/skills/` are the canonical agent sources. Claude Code uses committed symbolic links:

```text
CLAUDE.md -> AGENTS.md
.claude/skills -> ../.agents/skills
```

Do not maintain copied Claude-specific versions. On Windows, enable Developer Mode before initializing a workspace. Contributors cloning the source should also enable Git symbolic-link support.

## Commands for Agents and Contributors

Most users should prompt the agent instead of running these directly:

```sh
npx next-job-kit@latest init ./next-job-kit
npx next-job-kit@latest update ./next-job-kit
npm run doctor
npm run export:resume -- <resume-markdown-path> --pdf
npm run validate:pdf -- <resume-pdf-path>
```

Contributors should run the complete validation suite before publishing changes:

```sh
npm test
```

The suite validates workspace configuration, agent compatibility, the seven required first-party skills plus any valid user-created skills, the locked template, package privacy, update safety, and synthetic regression fixtures. See `AGENTS.md` for the full evidence, artifact, safety, export, and validation contract, and `export/README.md` for renderer details.

Contributors working on Next Job Kit itself should clone the source repository rather than initialize a candidate workspace:

```sh
git clone https://github.com/farrelfatah/nextjobkit.git
cd nextjobkit
```
