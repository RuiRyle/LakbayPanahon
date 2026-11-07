# Practice evidence logic audit

6 November 2026. Local changes, not deployed.

## Fixed verified flaws

- Multiple practice documents sharing one completion timestamp previously counted as multiple clean sessions. Clean-session counts now use distinct completion times, not only different document IDs.
- firstTryCorrect=true previously counted even when the same result reported attempts greater than one. Such contradictory entries now count as needing another try. Legacy records without an attempts field retain their existing firstTryCorrect meaning.
- Duplicate rows for one question previously used the first row encountered. Aggregation now retains an unsuccessful/contradictory result rather than selecting the convenient success.
- Opposite outcomes for a question at the same timestamp previously depended on document-ID order. They now mark the evidence uncertain and cannot clear the recommendation.

These are conservative integrity checks on browser-saved evidence, not backend verification. The existing minimum distinct-question/session/difficulty policy is unchanged. Ordinary wrong-then-correct answers remain assisted retries; neither feedback exposure nor lesson-link visits clear a review. No grades, XP, unlocks, schema fields or record repair/deletion changed.

## Important limits and next work

A first-try answer is not necessarily unaided: hint viewing is not recorded per result. Do not present existing firstTryCorrect as a validated independent-success measure. Before introducing that measure, define and implement explicit hint-use evidence, draft/reload persistence, backward-compatible unknown handling and teacher report wording. Do not retroactively label historical results unassisted.

A different question can still test memorized wording rather than transfer. Distinct IDs and difficulty labels do not establish equivalent quality or novelty. Teacher review of authored examples and a supervised learner check remain necessary. Fixed clean-session thresholds are a configured practice goal, not a validated mastery threshold; changing them requires instructional justification, not arbitrary relaxation.

## Validation

adaptive-review-evidence-dates.test.cjs passes 11 checks, including the four new duplicate/contradiction cases. student-review-browser.cjs and practice-misconception-pilot-browser.cjs --first-mission passed actual local browser controller flows, saved drafts/recovery, assisted accuracy and later clean evidence. These fixtures do not prove learning effectiveness or enforce scores against a malicious client.
