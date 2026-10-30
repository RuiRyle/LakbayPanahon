# Question feedback content

Practice feedback now has a polite status announcement. After a mistake, focus moves to the feedback heading; Choose Another Answer returns keyboard focus to an available choice without submitting an empty retry or increasing attempt counts. Moving to a new question focuses its heading, and completion focuses its title. The expanded practice Chrome check verifies error feedback, retry-choice focus and completion focus while retaining accuracy/save behavior.

Practice completion now includes mission-wide next steps after the saved history refresh: unresolved topics appear with targeted practice links, while an empty review list suggests another main-quiz attempt without claiming mastery. The card distinguishes session saving from unconfirmed review evidence and retains quiz retry as a choice. Chrome checks verify that an unpracticed topic stays visible, a resolved topic disappears, and history failures do not claim readiness. Seven focused access/save checks also pass.

Automatic practice selection now loads saved history before narrowing the question pool. It uses the same combined quiz/practice review calculation as dashboard recommendations. Newer resolved topics do not remain selected merely because an old quiz missed them; unresolved practice topics can still be targeted. If no topics remain unresolved, the full active bank is available for optional general practice. Explicit topic links retain their selected focus. The expanded practice Chrome check covers a stale quiz diagnosis, a different outstanding practice topic and general practice after resolution.

Practice completion now summarizes the session's first-try count and lists practiced topics using current catalog labels. Topics requiring a retry are explicitly identified as needing more review. The summary says practice does not complete the mission and leaves Retry Mission Quiz available. It describes session evidence rather than claiming overall mastery, and remains separate from the save status. The expanded practice Chrome check verifies the summary.

Dashboard review requests now belong to an authenticated session. Signing out clears the panel and disables its refresh button. A new sign-in starts its own request even while an older read is pending; old success/error/finally handlers cannot change the new panel. Same-user auth notifications preserve the current review. `tests/student-review-session.test.cjs` verifies same-account sign-out/sign-in, late failure isolation and retry availability after a current read failure. The empty message now describes both quiz and practice evidence.

Review cards distinguish evidence sources. Quiz-only recommendations explain that the latest quiz identified a topic; they no longer display a synthesized “0 of 1” practice score. Real practice summaries retain their recorded first-try counts. Dashboard guidance explains that mission completion and opportunities to strengthen particular topics can coexist. Focused review/mission unit checks and the expanded practice Chrome check pass. No Firestore migration was needed for this display change.

Practice hints and learning points are now applied to all 54 active `practiceQuestions` across 28 topics. Read [the authored content](practice-feedback-review.md). The migration is `data/practice-feedback-migration.json`; use `node functions/apply-mission-flow.cjs --practice-feedback` for a read-only comparison. Existing explanations, choices, correct answers, difficulty and student records were preserved. Backup: `backups/mission-flow-write-backup-1793021513398.json`. Independent curriculum review remains pending.

## Practice feedback behavior

Practice questions can now use `answerHints` (a map keyed by selected option), `hint`, `answerExplanations` and `learningPoint`. After a mistake, the page prefers the selected option's hint, then a general hint, historical clue and existing explanation. After success, it prefers the correct option's explanation and shows the learning point when present. All authored content renders as plain text. A successful retry still records `firstTryCorrect: false`.

The practice Chrome check verifies hint selection, safe rendering, successful-answer explanations, learning points and retry accuracy tracking. The subsequent practice migration populated general hints and learning points; option-specific hints/explanations remain optional. Existing full explanations remain available. The 50 applied main-quiz feedback entries are separate from `practiceQuestions`.

All 50 main/retry questions now have four answer explanations and a learning point in the original Firestore catalog. The remaining 30 cover trade/Islamic connections, barangay organization and livelihoods; read [their feedback](remaining-missions-feedback-review.md). They were applied atomically with backup `backups/mission-flow-write-backup-1793015503290.json`. A read-only comparison of the full migration reports zero changes. No student records, grading settings, question wording or answer keys were modified. Independent curriculum review remains pending; Hosting was not deployed.

Main quiz `questions` documents may contain optional fields:

- `answerExplanations`: a map keyed by option letter (`A`, `B`, `C`, `D`), with authored explanations for each choice.
- `learningPoint`: a short authored statement connecting the question to its lesson concept.

Review prefers the selected answer's nonblank explanation, then the existing `explanation`. Missing fields preserve existing feedback. Content renders as plain text. Missed questions link to the mission lesson and topic-filtered practice, preserving chapter and mission parameters. If topic content becomes unavailable, the practice page offers its existing lesson/quiz recovery choices.

The quiz Chrome regression check verifies selected-answer explanations, key points, HTML-safe rendering and route parameters while retaining fail/retry/pass and reward checks. The first 20 feedback entries are now applied to live Firestore. Curriculum review and authoring for remaining missions remain pending.

## First content batch

The second draft covers beliefs and cultural traditions: babaylan, respect for natural places, ritual purposes, oral traditions and interpreting artifacts. Read [the beliefs feedback review](beliefs-feedback-review.md). It includes five main questions and five retry variants, preserving the existing cautions about community diversity and the Manunggul Jar's earlier period. The combined migration now contains 20 entries; a read-only check validated all 20 against the original Firestore questions. Both batches were applied on 26 October 2026.

The community roles mission now has a reviewable draft for five main questions and five retry variants, with four explanations and one learning point per question. Read [the content review](community-roles-feedback-review.md). The draft is stored in `data/question-feedback-migration.json`; runtime pages continue to read Firestore only.

`node functions/apply-mission-flow.cjs --feedback` performs a read-only comparison. It validated all ten questions against the original database. Expected source fields prevent applying feedback to questions whose wording, options, correct answer or explanation changed. The existing explicit `--apply` option commits atomically with update-time preconditions and a backup. The combined 20-entry batch was committed atomically. A follow-up comparison reported zero remaining changes. Backup: `backups/mission-flow-write-backup-1793015219905.json`. Student records, question wording, options, answers and grading settings were unchanged. Curriculum review and remaining mission batches are pending.
