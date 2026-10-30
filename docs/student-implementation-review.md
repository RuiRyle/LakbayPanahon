> Update: the mission quiz, saved-attempt, targeted-practice and retry flow has since been implemented on the free plan. See [mission-quiz-flow.md](mission-quiz-flow.md) for current behavior and live validation. The findings below describe the earlier audit.

# Student implementation review — 26 October 2026

Compared with the supplied Complete Revised Study Summary. This is a local source review, not a verification of live Firestore documents, deployed rules, or deployed functions. Existing uncommitted work was present before this review.

## Current position

The project has a working web foundation for independent student learning. It does not yet implement the complete revised study. Student code is vanilla HTML/JavaScript, not the proposed Flutter Android/web client. A framework migration is a separate decision; the immediate logic and data issues can be fixed in this codebase first.

| Study requirement | Source evidence and current state | Remaining work |
| --- | --- | --- |
| Independent learning | `learning-access.js` checks active accounts, chapter/mission availability and prerequisites without requiring a classroom. Journey tests cover direct links and saved unlocks. | Preserve this invariant in every new backend operation. |
| Accounts/profile/avatar | Authentication, profile editing and saved avatar IDs exist. | Avatar choices are hardcoded in `student-profile.js` and duplicated in security rules. No dedicated first-login setup stage was established by this review. |
| Interactive lessons and story missions | `chapters.js`, `mission.js`, and `story.js` load catalogs and scenes from Firestore. | Verify real Grade 5 curriculum coverage, topic references, scene order, asset availability and interaction completeness against actual documents. |
| Quizzes and feedback | Firestore quizzes/questions, explanations, matching and trade interactions exist. | Use one authoritative submission path and record failures as well as passes. |
| Adaptive practice | `practice.js` selects from Firestore practice questions using difficulty/topic metadata and saved practice history. | Difficulty ladder and initial target are hardcoded. This is rule-based practice, not AI question generation. |
| Personalized review | `student-review.js` reads practice history and recommends topics. | Backend mission quiz attempts are not consumed by this dashboard review path. Connect quiz failures to review as well as practice failures. |
| XP/artifacts/badges | Firestore reward amounts and catalogs, completion records, replay handling and ownership records exist. | XP per level is hardcoded to 100 across browser, backend and rules. Chapter rewards currently grant badges without XP; make the intended reward policy explicit. |
| Bayani AI and generated review | The assistance client is local-test-only. `functions/index.js` validates context and then throws unavailable. | Real server-side model integration, secrets, request controls, grounded lesson context and validated review generation are still missing. |
| Historical timeline | Era/chapter sequencing exists. | A dedicated historical event timeline was not found among student pages; era selection alone does not establish the timeline requirement. |
| Optional classroom | Current independent access does not depend on membership. | Student join-by-code and announcements flow were not found in the reviewed student pages. Implement separately from learning access. |
| Android + web | Web pages exist. | No Flutter student implementation is established by these files. |

## Highest-priority flow and logic problems

1. **Two reward implementations have diverged.** `quiz.js` calls `student-rewards-client.js`, which grades and writes transactions in the browser. `functions/student-rewards.js` contains newer server grading, attempt IDs, fingerprints and weak-topic recording, but this UI path bypasses it. Failed browser submissions return without persisting attempt history. Choose the callable function as the authoritative production submission path, preserve a stable attempt ID across retries, and keep browser results provisional until acknowledgement.
2. **Current browser writes do not prove learning completion.** Firestore rules validate record shape, catalog amounts and paired rewards, but a submitted score is still supplied by the client. The browser access guard is not an authorization boundary. Move grading and prerequisites to the server, then deny client writes to XP, completion and reward ownership. Deploy the callable and coordinated rules before switching traffic; do not disable writes before the replacement works.
3. **Review is fragmented.** Dashboard recommendations use `studentPracticeProgress`; newer backend quiz diagnostics use `studentQuizAttempts`. Introduce an owner-readable attempt contract and combine quiz and practice evidence by mission/topic. Otherwise a failed mission quiz may produce no dashboard review recommendation.
4. **Configurable rules remain embedded.** Level spacing, avatar catalog, difficulty progression and daily scheduling policy need explicit Firestore contracts. Do not simply replace all constants: percentage arithmetic, validation bounds, activity types and transaction/idempotency behavior belong in code.
5. **Missing data needs a visible state.** Unconfigured activities should show unavailable with a useful explanation, not silently invent passing scores, reward amounts or lesson text. Validate content before publishing it as active.

## Fix applied in this review

Mission and chapter passing scores now require an explicit numeric `passingScore` from 0 through 100 in the activity document. Removed silent 60/70 defaults from browser submission, relevant displays, server grading and local security rules. Zero remains a valid configured value. Activity loading validates this before the student answers. Daily challenges still require the one question to be correct; 100 there represents correctness, not an invented content policy.

Before deployment, inspect every active `quizzes` and `chapterChallenges` document and supply an intentionally chosen numeric passingScore. Missing values and numeric strings now block the activity. No content values were invented or written to production during this review.

## Proposed Firestore ownership of data

Existing collections should continue to own lesson/story/question text, options, explanations, difficulty/topic tags, ordering, status, reward amounts, artifact/badge metadata and learner records.

Add these contracts deliberately, with validation and owner/admin permissions:

| Proposed location | Data it owns |
| --- | --- |
| `learningSettings/progression` | Validated positive integer `xpPerLevel`, or an ordered level-threshold table if unequal levels are needed; choose one representation. |
| `learningSettings/practice` | Ordered difficulty IDs, starting difficulty and question selection policy values. Code performs the selection. |
| `avatars/{avatarId}` | Name, icon/asset path, order and availability. Profile writes validate against allowed catalog entries rather than a duplicated static list. |
| `timelineEvents/{eventId}` | Date/date range, chronological sort key, title, explanation, media and linked era/chapter IDs. |
| `studentQuizAttempts/{attemptId}` | Server-owned user/mission/quiz IDs, score, question results, topic diagnostics and timestamps. Owner-only reads; no client writes. |
| Classroom membership and announcements | Optional membership records and teacher-owned announcements; never a prerequisite for core content. Final schema should follow the classroom backend design. |

Version policy changes so existing progress remains interpretable. When changing level policy, derive display and rewards from the same configuration and plan how stored legacy levels are reconciled. Do not update just the dashboard formula: the backend and rules must agree.

## Recommended student journey

Register/login -> load active student profile -> offer profile setup -> dashboard -> available era/chapter -> story/interactive lesson -> mission quiz -> acknowledged server result -> feedback and rewards -> next unlocked mission.

On failure: persist attempt -> explain missed concepts using Firestore explanations -> focused practice using quiz and practice history -> retry. On connection failure: show that the result is not saved and retry the same attempt ID. Dashboard refreshes from acknowledged persisted progress. Timeline, Bayani AI and optional classroom access are additional entry points; a classroom must never gate learning.

## Implementation order

1. Inventory/validate actual Firestore content and reconcile local/deployed rules without overwriting production blindly.
2. Unify server submission, attempt history and authoritative prerequisite checks; test concurrency, retries and reward replays; lock down client reward writes.
3. Connect mission failures to adaptive review; define resolution of old mistakes by later successful attempts.
4. Migrate progression, avatar and adaptive policy data to Firestore with coordinated readers/rules and a data migration.
5. Complete profile onboarding, timeline and optional classroom UI.
6. Implement Bayani AI and generated review against verified lesson context.
7. Evaluate the resulting student journey on the intended web/mobile targets; address the Flutter/Android requirement separately.

## Verification and limits

26 local tests passed: passing-score validation, independent-learning prerequisites, profile validation, practice review and backend reward/attempt behavior. Tests were loaded in one Node process because the sandbox denied test-runner child process spawning. Live content was not accessed; no deployment or Firestore writes were performed. Updated Firestore rules still need emulator compilation/security testing before deployment. Existing browser integration scripts were not run during this review.
