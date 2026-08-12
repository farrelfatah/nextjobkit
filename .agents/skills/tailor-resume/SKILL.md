---
name: tailor-resume
description: Create a truthful company- or role-specific resume from the configured master resume, confirmed evidence, candidate preferences, and a concrete job analysis. Use when the user asks to tailor, customize, or prepare a resume for a specific opportunity while preserving versioning, traceability, and the selected Next Job Kit template contract.
---

# Tailor Resume

Create a focused application artifact without changing the candidate's history.

## Preconditions

Read:

1. `profile/candidate.md`.
2. The configured evidence file.
3. The configured master resume.
4. The complete job listing and job-fit analysis. If no analysis exists, run `analyze-job-fit` first or produce its required map before tailoring.

If a claim needed for the intended positioning is unsupported, invoke evidence discovery or ask a focused question. Do not fill the gap with generic confidence.

## Tailoring Workflow

1. Identify the role's hiring thesis and top requirements.
2. Select confirmed evidence that directly supports those requirements.
3. Copy from the master resume, never from another tailored version.
4. Reorder, compress, and rephrase true content for relevance.
5. Keep official titles, employers, dates, metrics, and project maturity accurate.
6. Preserve material metric qualifiers such as sample size, pilot or test status, attribution, confidence, and scope.
7. Preserve export-compatible Markdown headings and simple bullet structure.
8. Create the version under `tailored/[role-type]/` using:

```text
[candidate-slug]-[role-type]-[company]-[yyyymmdd].md
```

9. Record the prepared version in the application tracker only after the artifact exists.
10. Never mark an application submitted without explicit confirmation.

Use an established role-type folder when the repository has one. Otherwise choose a stable occupational family such as `product-designer`; do not create separate folders for every seniority level.

## Content Standard

- Lead with the capability the role is actually hiring.
- Use implementation or AI evidence as support unless it is central to the role.
- Keep each bullet focused on one action, artifact, method, and outcome.
- Prefer specific artifacts and decisions over adjectives.
- Remove irrelevant details before shrinking typography or breaking the template.
- Keep claims defensible in a live interview.

Acceptable tailoring includes reordering facts, selecting relevant projects, matching supported terminology, and clarifying context. It never includes changing titles, fabricating tools, promoting team outcomes to personal ownership, or inventing experience duration.

## Handoff

Report:

- The created Markdown path.
- The role-specific positioning.
- Important differences from the master.
- Gaps deliberately left unclaimed.
- Whether cover-letter, application-answer, audit, or export work remains.

Do not call the resume final until the audit and PDF verification pass.

Location never proves work authorization. An unresolved eligibility gate does not prevent a user-authorized draft, but it must remain visible in the handoff and be confirmed before submission.
