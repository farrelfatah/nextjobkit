# Prompt Library

Copy-ready prompts for every Next Job Kit stage. You can speak naturally instead; skill names are optional, and the agent picks the smallest skill that owns the request.

## Writing Your Own Prompt

A strong prompt names five things:

1. **Outcome:** the decision or artifact you want.
2. **Source:** a listing URL, pasted description, resume, portfolio, or application package.
3. **Scope:** one stage or the complete package.
4. **Boundaries:** facts to preserve, claims to avoid, and actions not authorized.
5. **Finish line:** the files, audit, export, or recommendation you expect.

“Prepare” authorizes artifact creation. It does not authorize submission, external messaging, account creation, or publishing.

## Initialize or repair a workspace

> Use `setup-resume-workspace` to personalize this workspace. Interview me for required information, use my existing resume where it is supported, preserve non-placeholder content, create missing canonical files from the templates, and validate the result.

Use this for a first setup, changed identity or paths, or a workspace that no longer validates.

## Discover stronger evidence

> Use `discover-resume-evidence` to interview me about [role/project]. Ask about my contribution, the artifact, users or stakeholders, constraints, outcomes, dates, and proof. Update the configured evidence file with confirmed facts and unresolved questions. Do not rewrite the resume until the evidence is ready.

Use this when bullets feel generic, a project is missing, a metric is questionable, or your real contribution is unclear.

## Decide whether to apply

> Use `analyze-job-fit` on this listing: [URL or pasted text]. Check the full current listing and application logistics when accessible. Map every important requirement to confirmed evidence or a visible gap, identify hard eligibility risks, and give one pursue decision. Do not use a fake match percentage and do not create application artifacts yet.

Use this before investing in tailoring. If the live listing cannot be verified, the agent should label its currency unverified.

## Tailor a resume

> Use `tailor-resume` for [role] at [company] using the completed job analysis. Start from my configured master resume, lead with the role’s hiring thesis, keep only evidence-backed claims, preserve titles/dates/ownership, save a new version under `tailored/`, and record it as prepared in the tracker.

Use this after fit analysis. Never ask the agent to tailor from another company’s version.

## Write a cover letter or short note

> Use `write-cover-letter` for this opportunity using the stable tailored resume and confirmed evidence. Add context the resume cannot carry, make two or three specific evidence-backed connections, avoid invented product affinity, and keep it to 200–350 words.

For an application text field, ask for a 100–180 word note instead. A cover letter is useful when it explains motivation, a transition, or an adjacent-experience gap; it should not narrate the resume.

## Prepare a complete application package

> Analyze [listing], then prepare the evidence-backed resume and any useful cover letter for [company/role]. Audit the content and final rendering, export the PDF, inspect every page, and record exactly which artifacts are prepared. Stop before submission and show me unresolved eligibility questions or form answers I must confirm.

Use this when you want the agent to run the connected stages. It should pause for facts that would otherwise require guessing.

## Audit an existing resume or final PDF

> Use `audit-resume` on [path] for [job listing]. Check evidence support, relevance, ATS-readable structure, configuration compliance, and the final PDF layout. Separate failures, warnings, and improvements; cite the evidence behind claims; do not rewrite unsupported claims into stronger-sounding language.

If you only want one layer, say so: “content audit only,” “ATS structure only,” or “PDF rendering only.”

## Export and validate a PDF

> Export my configured resume as a PDF, run the required validation, render every page to an image, inspect it for clipping, overlap, awkward breaks, or blank pages, and show me the final result.

The current release supports the included `classic-timeline` A4 template only. The agent handles the command and browser-based rendering; regular users do not need to operate the terminal.

## Record application progress

> Update the application tracker for [company/role] with the current opportunity state and the exact artifacts that exist. Mark them prepared, not submitted. Do not infer any form answers or submission state.

After you personally submit:

> I submitted [company/role] on [date] using [exact artifact paths]. Update the tracker to submitted and preserve those versions as the sent record.

## Prepare for an interview

> Use `prepare-interview` for my [stage] interview with [company]. Use the actual submitted resume, cover letter, application answers, job analysis, and confirmed evidence. Build a concise introduction, likely questions, a source-linked story bank, honest gap responses, and questions I should ask. Keep every answer speakable and defensible.

If the submitted package is unknown, provide its paths. The agent should not guess which prepared version was sent.

## Troubleshoot the workspace

> Check my Next Job Kit setup and repair workspace configuration or agent compatibility problems. Preserve my resume data and submitted artifacts, run the appropriate diagnostics, and explain any gaps that still need my input.

`npm run doctor` checks prerequisites (Node.js, a Chrome-family browser, Poppler), workspace configuration, and agent compatibility, and explains how to fix what is missing.

## Update Next Job Kit safely

> Check my Next Job Kit for updates. Run a dry-run first, explain what will update cleanly, what local customizations will be preserved, and any conflicts that need my decision. Do not apply the update until I approve the plan. After approval, apply that exact plan, validate the workspace, and show me the backup ID.

Updates compare the originally installed framework, your current workspace, and the incoming release. Unknown files and user-owned career data are preserved. Overlapping changes to framework instructions or skills require an explicit decision; they are never silently overwritten. See [`updating.md`](updating.md) for conflict and rollback behavior.

## Customize the resume template

> Customize my current resume template with [describe the changes]. If it is a built-in template, fork it once under a clear custom template ID, select that custom template in my candidate profile, preserve the built-in version for future updates, then export and visually inspect the result.

The included `classic-timeline` remains a locked built-in. The agent creates one user-owned copy for customization and keeps editing that copy; it does not generate another template on every change.

## Back up privately to GitHub

> Back up my Next Job Kit workspace to a new private GitHub repository. Check authentication first, explain exactly which files will be committed, exclude ignored caches and backups, and do not make the repository public.

GitHub is optional. You can use Next Job Kit without an account.
