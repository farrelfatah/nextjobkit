---
name: write-cover-letter
description: Write a concise, role-specific cover letter from the candidate profile, confirmed evidence, job analysis, and stable tailored resume. Use when an application requests or benefits from a cover letter, application letter, motivation note, or short hiring-manager message.
---

# Write Cover Letter

Add useful context that the resume cannot carry; do not narrate the resume back to the reader.

## Inputs

Read:

1. `profile/candidate.md`.
2. The configured evidence file.
3. The complete job listing and analysis.
4. The stable tailored resume for the same opportunity.

If the tailored resume is still changing materially, finish it first.

## Drafting Workflow

1. Identify why this role, product, problem space, or company is specifically relevant.
2. Select two or three evidence-backed connections.
3. Explain how the candidate works or makes decisions where that adds signal.
4. Address a material career transition or adjacent-experience gap only when it helps the reader interpret the candidacy.
5. Close directly and professionally.

Default to 200–350 words. Use 100–180 words for a form note or explicitly short message.

When the listing is the only company source, connect to the role's problem space instead of inventing company or product affinity.

## Quality Rules

- Open with a role-specific reason, not enthusiasm boilerplate.
- Use the company's language only when the candidate can support it.
- Do not repeat the resume bullet by bullet.
- Do not invent personal affinity, product usage, customer status, or company knowledge.
- Do not add salary, work authorization, relocation, or notice-period claims unless the prompt requires them and the user confirmed them.
- Do not treat location as proof of work authorization. An unresolved eligibility gate may coexist with a draft, but must block any claim that the package is submission-ready.
- Keep the tone natural enough to read aloud.
- Avoid empty claims such as “perfect fit,” “dream company,” or “passionate professional.”

## File Contract

Write the editable source under `cover-letters/`:

```text
[candidate-slug]-[company]-[role-type]-cover-letter-[yyyymmdd].md
```

Link it from the application prep file and tracker when those artifacts exist. Do not record it as submitted before confirmation.

## Handoff

Return the path, central argument, evidence used, any sentence that still depends on user confirmation, and unresolved application gates such as work authorization or sponsorship as a separate list.
