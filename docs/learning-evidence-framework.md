# Learning evidence and study measures

Updated 6 November 2026. This defines how the current system's records should be interpreted. It does not claim that learning effectiveness has been demonstrated.

## Purpose

LakbayPanahon supports independent history practice and teacher-guided follow-up. The instructional goal is for a student to explain a historical idea using a relevant clue and apply that idea to another example. Participation, navigation and rewards support this goal but are not themselves evidence of understanding.

| Signal | Existing source | What it supports | What it does not establish |
| --- | --- | --- | --- |
| Participation/rewards | XP, levels and earned items | Recorded game participation/achievement | Understanding, retention, ability or official grade |
| Completion | studentProgress matching a current chapter/mission | Saved mission completion | Mastery percentage or ability across the curriculum |
| Practice performance | Dated studentQuizAttempts | Performance on the saved attempt and topics to revisit | Verified exam result, equivalent difficulty across attempts, causal learning gain |
| Explanation | classReviewReflections body and revision | A student explanation is available to inspect | Correct reasoning simply because it was submitted |
| Guidance | Current reflection response / private feedback | Support was sent | Student understanding or intervention success |
| Later understanding/application | Planned supervised evaluation | Performance on a later check and a new example | Not collected or inferred from existing immediate retries |

A missing record is unknown, not a zero. A tied, future or undated attempt should not become an asserted latest score. Reports use the current loaded membership/catalog scope and disclose coverage. Explanations and private guidance are not silently included in quiz-only exports.

## Teacher interpretation of an explanation

Use three questions during review:

1. Claim: does the student accurately explain the historical idea addressed by the lesson?
2. Evidence: does the student identify a relevant clue or example from the material?
3. Connection: does the student explain how that clue supports the claim, rather than merely naming it?

For each question record one of: clear, developing, or not enough evidence. Give a concrete next step, such as asking the student to connect a named clue to the claim. These are review criteria, not a newly implemented automatic rubric or stored score. A teacher content reviewer must check the criteria against each lesson before formal use. Do not infer an assessment decision from guidance text being nonempty.

## Proposed evaluation materials

- Select the lesson concepts and explicit objectives before collecting results.
- Ask a qualified Grade 5 teacher to review historical accuracy, age suitability, curriculum references, practice items and explanation criteria.
- Prepare an initial concept check, a comparable post-learning check, and a later retention/application check. State the actual interval and conditions in the study protocol rather than inventing them in the application.
- Include a new historical example to distinguish application from recalling a repeated question.
- Keep usability observations (navigation, task completion, confusion) separate from learning results (accuracy and reasoning).
- Report participant count, missing results, assistance received, instrument differences and assessment conditions. Immediate retry score changes are descriptive practice results, not proof that the system caused improvement.
- Treat browser-graded scores as practice evidence. Trusted backend grading remains a separate technical priority before using them as dependable formal assessments.

No students or teacher review group have yet been confirmed for this evaluation. The actual learning evaluation remains outstanding.

## Implemented first step

Individual Student Progress reports provide an optional interpretation guide for the six signals. Individual/class exports state their limits explicitly. No extra database requests, new assessment fields, reward changes, or automatic mastery judgments are added.

Validation: teacher-report-export.test.cjs and responsive teacher-student-progress-design.cjs passed locally. This is interpretation and study-design preparation; it does not substitute for external content review or participant evaluation.
