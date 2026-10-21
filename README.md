# Next Job Kit

[![npm](https://img.shields.io/npm/v/next-job-kit)](https://www.npmjs.com/package/next-job-kit) [![CI](https://github.com/farrelfatah/nextjobkit/actions/workflows/ci.yml/badge.svg)](https://github.com/farrelfatah/nextjobkit/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

An evidence-first job application workspace for Claude Code and Codex. You keep one trusted record of what you have actually done. Your AI agent turns it into role-specific resumes, cover letters, and interview preparation, without inventing experience.

```text
profile → confirmed evidence → master resume → job-fit analysis
                                                     ↓
                               tailored resume → cover letter → audit + PDF
                                                     ↓
                                     application tracker → interview prep
```

It is not a job board or an auto-apply bot. The agent never submits an application, messages anyone, or marks something submitted without your explicit go-ahead.

## See It in Action

A synthetic candidate, Maya Chen, applies for a Senior Product Designer role at the fictional Ledgerflow. The [full example package](docs/examples/maya-chen-ledgerflow/) shows every input and output.

**Decision:** `Pursue with caveats`. Her permissions-redesign work is a direct match. Fintech experience is a gap, and Singapore work authorization must be confirmed before she submits.

**Master bullet vs. tailored bullet:**

| Master resume | Tailored for Ledgerflow |
| --- | --- |
| Led research and interaction design for an access-permissions redesign across three pilot customers. | Led discovery and interaction design for a permissions redesign used by 18 operations managers across three pilot customers. |
| Built Figma and React prototypes to test complex role-management concepts before engineering implementation. | Designed a role-comparison prototype in Figma and React for usability testing; in a 9-participant pilot, median permission-setup errors fell from 4 to 1 per test scenario. Engineering rebuilt the production implementation. |

Every added detail comes from her confirmed evidence file, and an independent `claim-auditor` pass checked each claim before the package was final. What the agent left out matters just as much:

- The “hundreds of hours saved” that a teammate remembers has no source.
- The React prototype is never called production engineering.
- Billing-settings work is never presented as fintech experience.

## Quick Start

### Requirements

| You need | Why |
| --- | --- |
| [Claude Code](https://claude.com/claude-code) (terminal, desktop app, or IDE extension) or Codex | Runs the workflow |
| Node.js 22.14 or newer | Runs the workspace tools |
| Google Chrome, Chromium, or Microsoft Edge | PDF export |
| Poppler (`brew install poppler`, `apt install poppler-utils`, or `winget install oschwartz10612.Poppler`) | PDF checks and page previews |
| Windows only: [Developer Mode](https://learn.microsoft.com/windows/apps/get-started/enable-your-device-for-development) | Lets Claude Code read the shared agent files |

You don't need to use a terminal yourself. The agent runs every command, and `npm run doctor` tells it what is missing.

### 1. Create your workspace

Open Claude Code (or Codex) in the folder where you want to keep your career files and paste:

> Set up Next Job Kit for me locally. Use the latest published `next-job-kit` npm package to create a new workspace in `./next-job-kit`, then switch to that folder and run `npm run doctor`. Do not create accounts, publish anything, or push to GitHub unless I ask.

If you prefer the terminal: `npx next-job-kit@latest init ./next-job-kit`, then open that folder in your agent.

### 2. Personalize it

> Use `setup-resume-workspace` to personalize my Next Job Kit. Interview me for the minimum information needed, start from my existing resume if I share one, and validate the workspace when you are done.

Expect one short round of questions. You can start from a resume, a LinkedIn export, a portfolio, or nothing at all. Existing material is treated as a source to verify, not as confirmed evidence.

### 3. Do your first real task

If your resume is vague or incomplete, build evidence first:

> Interview me to turn my resume and project history into defensible evidence. Focus on ownership, artifacts, outcomes, and dates. Do not invent missing details.

If you already have a listing in mind:

> Analyze this job listing against my profile, evidence, and master resume: [URL or pasted text]. Show the evidence and gaps, and recommend Pursue, Pursue with caveats, Low priority, or Do not pursue. Don't tailor yet.

## Everyday Prompts

You can speak naturally. In Claude Code, you can also type a skill as a slash command, such as `/analyze-job-fit`.

| Goal | Say something like |
| --- | --- |
| Full application package | “Prepare a truthful application package for [role] at [company] from [URL]. Analyze fit first, tailor, add a cover letter only if it helps, audit, export the PDF, and stop before submission.” |
| Tailored resume | “Tailor my resume for [role] at [company] using the job analysis.” |
| Cover letter | “Write a 200–350 word cover letter for this opportunity from my tailored resume and evidence.” |
| Audit | “Audit [path] against [listing]: evidence, ATS structure, and final PDF layout.” |
| Track progress | “I submitted [company/role] on [date] using [paths]. Mark it submitted in the tracker.” |
| Interview prep | “Prepare me for my [stage] interview with [company] from the package I actually submitted.” |
| Update the kit | “Check Next Job Kit for updates. Dry-run first and wait for my approval.” |

More copy-ready prompts are in the [prompt library](docs/prompts.md).

## How It Works

### One source of truth per kind of fact

| Source | Holds | Rule |
| --- | --- | --- |
| `profile/candidate.md` | Identity, file paths, career direction, claim boundaries | The only file you configure |
| Evidence file | Confirmed facts, estimates, artifacts, open questions | New claims land here first |
| Master resume | Your canonical general resume | Every tailored version starts here |
| `tailored/`, `cover-letters/` | Versioned, opportunity-specific artifacts | Never tailor from another tailored version |
| Application tracker | Opportunity state and the exact files sent | “Prepared” is not “submitted” |

Markdown is canonical; HTML and PDF are outputs. When facts conflict, your direct confirmation wins, then the evidence file, then the master resume.

### The evidence standard

```text
measured fact > confirmed estimate > concrete qualitative evidence > omission
```

Team impact never becomes personal ownership, a prototype never becomes production, and adjacent experience never becomes direct experience. Leaving a claim out is better than one that falls apart in an interview.

### Seven skills, one per stage

| Skill | Owns |
| --- | --- |
| `setup-resume-workspace` | Setup, personalization, and safe repair |
| `discover-resume-evidence` | Interviews that turn experience into defensible evidence |
| `analyze-job-fit` | Requirements, eligibility, gaps, and the pursue decision |
| `tailor-resume` | Truthful role-specific resume versions |
| `write-cover-letter` | Cover letters and short hiring-manager notes |
| `audit-resume` | Evidence, ATS structure, and PDF quality checks |
| `prepare-interview` | Introductions, story banks, and honest gap answers |

The agent uses the smallest skill that fits the request. A narrow audit does not set off the whole chain.

## Claude Code and Codex

Both agents read the same `AGENTS.md` and `.agents/skills/`. Claude Code reaches them through committed symlinks (`CLAUDE.md` and `.claude/skills`). Claude Code also picks up extra guardrails in every new workspace:

- **Slash commands:** every skill is available as `/skill-name`.
- **Pre-approved commands:** diagnostics, export, and PDF checks run without repeated permission prompts. `.env` files are never read, and `git push` always asks first.
- **Hooks:** Claude asks before editing the locked template, update metadata, or archived submissions. It re-checks your profile after every edit and flags setup problems when a session starts.
- **`claim-auditor` subagent:** an independent, read-only reviewer that checks each claim against your evidence during audits.

Put personal Claude Code permissions in `.claude/settings.local.json`. That file is ignored by Git and never touched by updates.

## Files and Versions

```text
tailored/[role-type]/[slug]-[role-type]-[company]-[yyyymmdd].md
cover-letters/[slug]-[company]-[role-type]-cover-letter-[yyyymmdd].md
applications/[slug]-[company]-[role-type]-application-prep-[yyyymmdd].md
applications/[slug]-[company]-[role-type]-interview-prep-[yyyymmdd].md
```

PDF and HTML exports sit next to their Markdown source. Submitted versions are archived, never overwritten. The current release ships one A4 template, `classic-timeline`, which you can fork into your own custom template.

## Updates

Ask your agent to check for updates. It runs a dry run, explains what will change and what local customizations it will preserve, and waits for your approval. Every update makes a backup and can be rolled back. See [docs/updating.md](docs/updating.md).

## Privacy

- Your resume and application data stay in your local workspace. Never push it to a public repository.
- Private GitHub backup is optional and only happens when you ask for it ([prompt](docs/prompts.md#back-up-privately-to-github)).
- Salary, work authorization, legal eligibility, and form answers always need your explicit confirmation. These are exactly the details an AI should not guess.

## Contributing

Clone the source repository instead of creating a workspace:

```sh
git clone https://github.com/farrelfatah/nextjobkit.git
cd nextjobkit
npm test
```

`AGENTS.md` holds the full contract for evidence, artifacts, export, and safety. [export/README.md](export/README.md) covers rendering, and [docs/releasing.md](docs/releasing.md) covers releases. On Windows, enable Git symlink support before cloning.

## License

[MIT](LICENSE)
