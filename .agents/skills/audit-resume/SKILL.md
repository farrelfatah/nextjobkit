---
name: audit-resume
description: Audit a master or tailored resume for evidence support, relevance, structure, ATS-readable text, configuration compliance, and final PDF rendering. Use before an application artifact is called final, after major resume edits, when export behavior changes, or when diagnosing layout and pagination defects.
---

# Audit Resume

Verify truth, usefulness, and rendering as separate layers. Audit only the layers the user requested or the available artifact supports; mark every skipped layer `Not evaluated`.

## 1. Content Audit

Read the candidate profile, evidence file, target job source, and audited resume.

Check every claim for:

- Evidence support.
- Accurate ownership, title, dates, scope, and maturity.
- Relevance to the target role.
- Clear action, artifact, method, and outcome.
- Interview defensibility.

Flag unsupported claims; do not repair them by inventing evidence. Do not require a number in every bullet. Cite the supporting evidence entry or state exactly what evidence is missing.

Classify findings:

- `Failure`: invented or materially unsupported claim, wrong ownership, broken artifact, or unusable rendering.
- `Warning`: unresolved eligibility, ambiguous wording, weak relevance, or incomplete context.
- `Improvement`: supported content that could be more specific or effective.

## 2. Structure and Parsing Audit

Check:

- One-column semantic Markdown and HTML.
- Correct heading hierarchy.
- Extractable contact details and body text.
- Conventional section names where useful.
- Simple bullets and links.
- No unresolved placeholders.
- Natural, supported keyword coverage.

Do not assign a fake ATS or match score. Report concrete pass, warning, and failure conditions.

## 3. Workspace Validation

For a repository-backed final audit, run:

```text
npm run validate
```

Resolve the selected template from `profile/candidate.md`. For the current release, require `classic-timeline` and the registered existing HTML/CSS files.

## 4. PDF Export and Visual Audit

For a final PDF audit, export through:

```text
npm run export:resume -- <resume-markdown-path> --pdf
```

Then:

1. Confirm Chrome/Skia produced the PDF.
2. Extract text and verify expected sections.
3. Render every page to an image.
4. Inspect every page for clipping, overlap, illegible glyphs, orphaned headings, awkward block splits, and unintended blank space.
5. Confirm A4 sizing unless the configured template says otherwise.

Never switch to LibreOffice or another renderer that changes the template. Do not edit the locked shared stylesheet without explicit template-change approval. For one resume, fix excessive length or awkward pagination in the Markdown. If a defect is demonstrably shared across fixtures, report a proposed template change and wait for approval instead of using blank lines, manual page breaks, or resume-specific HTML hacks.

## Verdict

Return one verdict for each evaluated layer and one overall verdict when every required layer was evaluated:

- `Pass`: ready to use.
- `Pass with warnings`: usable, with named non-blocking risks.
- `Fail`: unsupported claim, missing required content, broken export, or visual defect blocks delivery.

List evidence failures, content improvements, export findings, and the exact next action.

Keep eligibility and submission readiness separate from resume truth. Label an unresolved hard gate `Potentially application-blocking`; it is an application warning unless the resume itself makes a false eligibility claim.
