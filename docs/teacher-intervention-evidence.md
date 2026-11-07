# Teacher intervention evidence view

Updated 6 November 2026. Implemented locally in Student Progress > Review outcomes to acknowledge > Check review outcomes.

Each active personal review now presents its topic and a Before, support and follow-up view:

- Before: latest unambiguous saved quiz score before assignment, or an explicit missing baseline.
- Support: whether guidance was sent for the currently saved student explanation.
- Follow-up: saved quiz performance strictly after the current guidance timestamp. A passing result before guidance does not count as follow-up.
- Suggested next step: check evidence, invite another explanation, or discuss the misconception. Suggestions do not send messages or create assignments automatically.

Post-guidance comparisons use the same student, chapter and mission and the existing date/cutoff safeguards. The comparison baseline is the latest attempt at or before guidance, distinct from the pre-assignment baseline. Higher, same and lower practice scores are described as observations. No claim of mastery, retention or causation is generated. A post-guidance result with an ambiguous/missing baseline stays a needs-check outcome.

Missing guidance timestamps or unavailable reflection reads do not create a false success. Revising an explanation clears its current response under the existing contract, so the view returns to needing guidance. It does not claim to archive earlier interventions. Legacy reviews without prompts do not gain a new compulsory requirement.

The summary is derived from attempt/reflection records already read on demand. It adds no database fields, requests, grades, XP or progression restrictions. It does not assess the quality of the explanation automatically. Current outcomes continue to cover published reviews for current active members, ten reviews per requested group.

## Validation

- teacher-class-policy.test.cjs: 11 checks, including follow-up chronology, unavailable evidence and higher/same/lower observations.
- teacher-review-learning-stages.cjs: 14 assertions at each of 390px and 1440px, including timeline fit, pre-guidance passing evidence exclusion and later-attempt comparison through the actual loader with mocked Firestore.

No production deployment. The existing lifecycle and publication-state frontend/rules changes still require coordinated publication. Human review of reasoning and later retention/application checks remain separate work.
