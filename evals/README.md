# Skill Evaluation

This folder is for Next Job Kit maintainers, not ordinary application tracking.

The application tracker answers: “What did the candidate apply to, with which artifacts, and what happened?”

A skill evaluation log answers: “Did the agent choose the right skill, produce useful output, preserve evidence, and require avoidable corrections?”

Use a log only during workflow testing, dogfooding, or contributed skill changes. Do not enable it by default and do not put private application answers in it.

## Minimal Log Schema

```text
Date | Scenario | Skill | Invocation reason | Output accepted? | Corrections | Unsupported claims | Turns/time
```

Evaluate quality with synthetic fixtures before using real candidate data. Useful signals include correct skill routing, evidence fidelity, artifact correctness, correction count, unsupported-claim count, and unnecessary turns. “Applied” or “hired” is not a clean skill metric because the outcome depends on far more than the workflow.
