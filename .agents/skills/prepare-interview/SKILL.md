---
name: prepare-interview
description: Build concise, speakable interview preparation from the candidate profile, confirmed evidence, job analysis, and the actual application package. Use for interview briefs, STAR story selection, likely questions, portfolio walkthroughs, recruiter screens, hiring-manager interviews, or live short-keyword answer support.
---

# Prepare Interview

Prepare the candidate to defend the application they actually submitted.

## Source Order

1. Read `profile/candidate.md`.
2. Read the configured evidence file.
3. Read the job listing and job-fit analysis.
4. Read the exact submitted resume, cover letter, and application answers when known.
5. Mark prepared-but-unconfirmed artifacts as unverified rather than treating them as submitted.

If the analysis or submitted artifacts do not exist, produce a clearly labeled draft from the available sources, list what is missing, and never imply the master resume was submitted.

Prefer artifact paths supplied by the user. Otherwise search `applications/`, `tailored/`, and `cover-letters/` using the candidate slug, company, role family, and date; if multiple plausible submitted packages remain, ask which one was sent rather than guessing.

## Build the Brief

Produce:

- A 30–60 second introduction.
- The role's likely evaluation themes.
- Five to eight likely questions.
- A compact story bank mapped to those questions.
- Portfolio or project talking points.
- Credible answers for gaps, transitions, or adjacent experience.
- Questions the candidate should ask.
- Claims and details that must not be overstated.

Reference the evidence entry or application artifact behind every recommended story using `[Source: relative/path.md — Section]`. For an unsupported evaluation theme, add a discovery question or an honest gap response instead of manufacturing a bridge story.

## Story Standard

Use evidence-backed STAR or decision narratives:

- Situation: only the context needed.
- Task: the candidate's actual responsibility.
- Action: decisions, artifacts, collaboration, and trade-offs.
- Result: measured or concrete qualitative outcome.
- Reflection: what changed in the candidate's approach when useful.

Do not force every story into a theatrical STAR script. Preserve natural speech.

## Speakability

- Prefer short sentences and concrete nouns.
- Default answers to 45–90 seconds.
- Include a shorter recruiter-screen version where useful.
- Avoid memorization-heavy prose and unexplained jargon.
- Keep quantitative details to numbers the candidate is comfortable defending.
- Do not invent company or product familiarity. Location does not establish work authorization.

For live interview support, treat a short keyword as a request for the most relevant concise answer. Answer from the prep artifact first and clearly label any external addition.

## File Contract

Store a durable brief in `applications/` using:

```text
[candidate-slug]-[company]-[role-type]-interview-prep-[yyyymmdd].md
```

Link claims back to the evidence or application artifact when practical.

## Completion Standard

Finish only when every recommended story is defensible, the candidate can identify which project to discuss for each evaluation theme, and unresolved submission facts are visibly marked.
