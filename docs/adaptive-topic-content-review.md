# All-topic adaptive coverage review

Updated 6 November 2026.

The offline catalog assembled by audit-student-handoff.cjs contains 66 active missions and 330 blueprint topics. audit-adaptive-topic-coverage-local.cjs checked all 330 topic paths. It found zero structural issues and zero missing/repeated-choice-feedback flags in this snapshot.

For each topic the audit checks mapped active story text, matching quiz questions, targeted practice, consistent evidence policies, enough distinct questions and the required difficulty. It also checks answer/options, shared explanations, choice-specific explanations and identical distractor feedback. These checks do not evaluate whether the historical explanation or wrong-choice reasoning is accurate or pedagogically sufficient.

## Review materials

- validation/adaptive-topic-coverage-2026-11-06.json: complete topic-to-scene/question inventory with policies and audit limits.
- validation/adaptive-topic-teacher-review-2026-11-06.csv: 330 topic rows with teacher review columns. All start Not reviewed; none are presented as teacher-approved.

For a topic, use the listed mission, scene and question IDs to locate the lesson and targeted practice. Evaluate historical accuracy and appropriate qualifications, child-friendly wording, whether each wrong-choice explanation addresses its particular error, and whether students are shown how a clue supports a claim. Record a specific correction and supporting source where needed. Use the source references already attached to the lesson, and verify new factual changes against authoritative sources before editing.

Do not rewrite content merely because structural checks have passed, or mark every topic approved automatically. This is a dated repository-derived catalog with verified overlays, not a fresh online database audit. Teacher review and supervised student comprehension checks remain outstanding.

## Re-run

Run node functions/audit-adaptive-topic-coverage-local.cjs for the JSON inventory. Run node tests/adaptive-topic-coverage.test.cjs to verify that injected missing mappings/text, unreachable goals, inconsistent policies and incomplete/repeated feedback are detected. Four regression tests passed.
