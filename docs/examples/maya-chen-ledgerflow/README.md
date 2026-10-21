# Example: Maya Chen → Senior Product Designer, Ledgerflow

A complete, synthetic application package produced by the Next Job Kit workflow. Maya Chen and Ledgerflow are fictional. The inputs are the regression fixture in [`tests/fixtures/product-designer/`](../../../tests/fixtures/product-designer/).

## Inputs

| Input | File |
| --- | --- |
| Candidate profile and claim boundaries | [`profile.md`](../../../tests/fixtures/product-designer/profile.md) |
| Confirmed evidence and open questions | [`evidence.md`](../../../tests/fixtures/product-designer/evidence.md) |
| Master resume | [`master-resume.md`](../../../tests/fixtures/product-designer/master-resume.md) |
| Job listing | [`job.md`](../../../tests/fixtures/product-designer/job.md) |

## Outputs

| Stage | Skill | Output |
| --- | --- | --- |
| Decide whether to apply | `analyze-job-fit` | [`job-fit-analysis.md`](job-fit-analysis.md): **Pursue with caveats** |
| Tailor the resume | `tailor-resume` | [`maya-chen-product-designer-ledgerflow-20261021.md`](maya-chen-product-designer-ledgerflow-20261021.md) |
| Write the cover letter | `write-cover-letter` | [`maya-chen-ledgerflow-product-designer-cover-letter-20261021.md`](maya-chen-ledgerflow-product-designer-cover-letter-20261021.md) |

## What the Workflow Refused to Do

- Claim the “hundreds of hours” saved that a teammate remembers. It has no calculation or source.
- Present the React prototype as production engineering. Engineering rebuilt it.
- Turn billing-settings work into fintech experience.
- Assume Singapore work authorization from a Singapore address. It stays a visible, potentially application-blocking question.
- Give a match percentage.

These are the checks in [`expected-behavior.md`](../../../tests/fixtures/product-designer/expected-behavior.md).

## How These Were Checked

The first drafts went through the read-only `claim-auditor` subagent. It found real problems: a cover-letter sentence that relied on the unconfirmed billing-settings note, “permissions and approvals” described as years of focus when the evidence shows one project, “12 interviews” turned into “12 people”, and a dropped “test” qualifier on the pilot result. The files here are the corrected versions. That is the point of an independent check: the agent that writes a claim is the worst judge of it.
