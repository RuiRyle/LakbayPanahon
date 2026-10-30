# Mission 1 beginner-practice coaching

Published to the original project `lakbaypanahon-1797e` on 29 October 2026. Four easy practice questions were created and the existing easy leadership question received feedback updates. All five final records were read back successfully.

## Student behavior

- A wrong choice receives its own `answerHints` nudge. It points to the missing clue without naming the correct letter or quoting the correct option.
- After a correct answer, `answerExplanations` explains why it fits. The separate `learningPoint` reinforces a related idea without repeating the same sentence.
- The cooperation distractor about everyone having the same job is replaced with separate goals. Two neighbours cleaning together could reasonably have the same task, so the older distractor was ambiguous.
- The social-role question names a farmer and basket maker, and the customs question asks about the other community directly.
- The four new easy items cover community, cooperation, social organization and customs. Existing `practice2-1` supplies easy leadership practice. These items appear when the adaptive selector chooses easy practice for their topic.

The existing practice code already reads these fields, including when restoring incorrect-answer feedback. No frontend content fallback was added. Question topics, correct letters, evidence policy and difficulty remain the reviewed values. Beginner success is practice support; it does not replace the existing harder-question and multi-session evidence requirements.

## Scope and publication

Authoring input: `data/chapter1-mission1-practice-polish-migration.json`.

| Document | Publication action |
| --- | --- |
| `practiceQuestions/easy-review-mission-1-barangay-community` | Created |
| `practiceQuestions/easy-review-mission-1-community-cooperation` | Created |
| `practiceQuestions/easy-review-mission-1-social-organization` | Created |
| `practiceQuestions/easy-review-mission-1-community-customs` | Created |
| `practiceQuestions/practice2-1` | Updated feedback only |

The apply script first compared these five documents with the exact original drafts/snapshot. It then wrote the five changes atomically using creation or update-time preconditions and read back the final guarded fields. Backup: `backups/chapter1-mission1-practice-polish-1793276057291.json`.

This scoped plan supersedes the four Mission 1 entries in `data/easy-review-gaps-migration.json`. That old six-item plan still includes two Mission 2 drafts which were not published by this task. Do not rerun it as a six-item creation batch over the revised Mission 1 documents; its collision guard should stop it. Review the two remaining Mission 2 items separately.

Adding questions/changing choices changes the practice pool version. Existing unfinished Mission 1 practice drafts may start a fresh session on reload under the existing draft policy. Saved practice records and completed mission rewards use separate records.

## Verification

Nine focused local checks passed: scoped publication safeguards, exact-original/applied comparisons, stale-content rejection, topic coverage, choice-specific feedback through the real practice handlers, resume feedback without extra attempts, and existing quiz-recovery behavior. The candidate-content audit and local publication-queue comparison also passed.

```powershell
node --test --test-isolation=none tests/chapter1-mission1-practice-polish.test.cjs tests/easy-review-recovery.test.cjs
node functions/apply-chapter1-mission1-practice-polish.cjs --check-local
```

The live comparison confirmed Firestore availability and the five target states. This task did not create a learner account or claim an authenticated browser walkthrough. Independent teacher review and Grade 5 comprehension remain pending. Follow-up: the separate six-scene/ten-quiz Mission 1 learning-clarity update is now also published; see [publication evidence](student-publication-2026-10-29.md).

Before publication, the existing owner-checked recovery procedure removed 19 leftover temporary test documents and its temporary recovery file. No new test account was created.
