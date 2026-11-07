# Adaptive support audit - dated evidence

Updated 6 November 2026. Local implementation review; no production records were read or changed.

## Existing targeted path

student-review.js derives recommendations from saved quiz/practice evidence and currently available question banks. practice-review.js links the topic to story.html reviewTopic and practice.html topic. story.js selects matching reviewTopics scenes; when no mapping exists it retains the full lesson and displays the fallback notice. Practice already exposes the evidence policy and allows lesson return or quiz retry without a compulsory teacher gate.

This confirms routing behavior, not the educational sufficiency of every authored topic or explanation. A mission-by-mission mapping/content review and teacher validation remain necessary.

## Corrected evidence defects

mission-review.js previously chose between same-time quiz attempts by document ID. Conflicting same-time diagnostics could hide a topic. Future practice sessions and lesson-review events could count toward review progress.

The current logic:

- Uses only finite, positive quiz dates no later than the supplied current time as chronological anchors.
- Retains the union of same-time diagnostic topics rather than arbitrarily choosing one record.
- Keeps recommendations affected by invalid/ambiguous quiz dates visible and marks their evidence uncertain; it does not infer that the learner lacks ability.
- Excludes future/invalid practice sessions and lesson events from progress.
- Prevents uncertain quiz chronology from clearing a practice recommendation, even when clean practice counts are present.
- Preserves the existing distinct-question/session/difficulty policy, independent quiz retry and reward/unlock behavior.

Student review cards and practice-goal details explain ambiguous dates. No new database fields or writes are added. Invalid dates remain a record issue to investigate; this pass does not repair or delete records automatically. Immediate practice success remains practice evidence, not retention or mastery.

## Validation

Six new deterministic adaptive-review-evidence-dates.test.cjs checks cover normal progress, future sessions/events, conflicting tied diagnostics, invalid dates and the public helper. Existing student-review.test.cjs (six checks), student-review-session.test.cjs (two checks) and student-review-browser.cjs passed.

## Next audit

Check each current topic's scene mapping and question/explanation coverage using a reproducible catalog snapshot. Review whether distractor explanations address the specific wrong idea, rather than supplying only the right answer. Do not claim all-mission semantic validation based solely on routing tests. Trusted backend grading and teacher/participant evaluation remain separate outstanding work.
