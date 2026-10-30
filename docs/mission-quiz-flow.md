# Mission quiz flow - implemented 26 October 2026

The student flow uses the original `lakbaypanahon-1797e` database on the existing free plan. No emulator or Cloud Function is needed. The frontend changes are in this workspace; Firebase Hosting was not deployed.

## Student behavior

Era availability is now checked consistently for dashboard journey recommendations, dashboard review links and direct learning entry points. Chapters referencing an inactive or missing era do not become recommended activities, and direct access returns an unavailable-era message. Legacy chapters without an era reference retain their existing behavior. This is a navigation consistency check; Firestore rules remain the independent data-permission layer. Fifteen focused journey/access checks, the review-session check and dashboard Chrome check pass. No live catalog status was changed.

Mission path controls now expose `aria-pressed` for the selected mission. Selecting a mission focuses its introduction heading after the path re-renders, preserving keyboard context. Loading chapters for an era focuses the selected-era heading once the current request completes. Existing request/session checks prevent an older load moving focus. Both expanded mission/chapter-map Chrome checks pass alongside unlocking and recovery scenarios.

Quiz selection restores focus to the rebuilt selected option, locking an answer focuses the continuation control, and previous/next navigation focuses the new question heading without forcing extra scroll. Lesson scene navigation likewise focuses the new scene heading. Result focus is deferred until its heading is updated. Expanded quiz/story Chrome checks verify selected-option and question/scene focus while exercising the learning flows. Physical keyboard/screen-reader acceptance remains deferred.

Passing results now explicitly separate mission completion from remaining review topics. When a passing attempt still misses topics, Optional Topic Practice links back to the mission's adaptive practice while Continue Journey remains primary. Perfect attempts describe correctness for that attempt rather than permanent mastery. Failure results retain the recommended-practice flow and do not show the passing-only reinforcement link. The expanded quiz Chrome check verifies the link's visibility and route alongside completion/reward behavior.

The quiz introduction now derives its displayed question count, required correct answers and passing percentage from the issued questions and active quiz policy. Mission instructions no longer promise a fixed count, and dashboard progression uses loading text instead of a fixed 100-XP threshold before Firestore settings arrive. The expanded quiz Chrome check changes the mock pass policy from 60% to 80% and verifies the text changes from three to four correct answers; the dashboard Chrome check also passes. The live policy was not changed.

Lesson, main quiz and adaptive practice now share a learning-path navigation row. Chapters opens the map; Mission Journey preserves the chapter parameter; the current activity is labeled with `aria-current="page"`. It remains outside loading/error panels, wraps on narrow screens, and provides visible keyboard focus. Missing chapter parameters omit the mission link rather than creating an invalid destination. All three expanded Chrome checks verify current-page labeling and preserved chapter context alongside their learning flows.

The chapter map now provides Retry Loading Eras and Retry Loading Chapters after failed reads. Retrying chapters preserves the selected era, and retry buttons block overlapping clicks. Requests do not start without an authenticated student. The expanded chapter-map Chrome check verifies failed era/chapter reads and successful in-page recovery alongside prerequisites, era switching and sign-out handling.

After a chapter challenge passes, the result reads current chapters, owned chapter completions and missions. It offers direct continuation to the next ready incomplete chapter in that era only when earlier ready chapters are completed and the destination has active missions. Otherwise, or if the lookup fails, Explore Chapters remains available. Back to Missions preserves the current chapter. A failed continuation lookup cannot erase acknowledged completion or rewards. The chapter Chrome test and focused continuation unit test cover this handoff.

1. Complete/read the mission lesson, then open the main quiz.
2. Answer five questions, one for each configured learning objective. Three correct answers pass (60%).
3. A pass records mission completion, grants the catalog XP once, grants the mission artifact when applicable, and unlocks the next mission through the existing saved-progress checks.
4. A failure saves the attempt and diagnoses missed topics, without granting XP, artifacts or completion.
5. The result offers recommended practice, lesson review, or an immediate retry. Practice is optional and grants no mission XP.
6. Practice reads the latest quiz diagnosis and saved practice evidence. It covers weak topics before repeating them, selects the nearest available difficulty, provides explanations, and adjusts difficulty after first-try successes or mistakes.
7. A retry prefers never-seen questions, preserves the same topic/difficulty coverage, and avoids the immediately preceding set when alternatives exist. A notice explains when the finite bank requires repeated questions.

## Firestore data

Entry-page catalog reads now use equality filters: chapter map by `eraId`, mission list by `chapterId`, quiz lookup by `missionId`. Existing readiness/prerequisite checks and client-side ordering remain. These queries use the current Firestore catalog and require no content migration. The three expanded Chrome checks reject unscoped reads while exercising existing unlock, recovery and assessment flows. Actual read savings depend on catalog size.

Each active `quizzes` document now contains:

- `questionCount`: 5.
- `passingScore`: 60.
- `questionBlueprint`: topic/difficulty slots with counts totaling questionCount.
- `practicePolicy`: ordered difficulty levels, starting/review difficulty, question limit, and historical performance thresholds.

Main questions in `questions` have topic, topic label and difficulty tags. `practiceQuestions` contains separate question text and explanations, with at least two available difficulties for each assessed topic in the current five quizzes. These are authored variants of existing instructional content, not live AI-generated questions.

`studentQuizAttempts/{uid}_{attemptId}` stores the selected IDs, answers, score, weak topics and acknowledged response. Failed attempts and passing attempts are saved. The response and reward transaction are atomic. Retrying the same submission returns the saved response; changing its answers is rejected. A newly submitted replay of an already completed mission grants no further XP.

Question-set IDs are cached in session storage to keep an in-progress selection stable. Saved attempt history is in Firestore and drives later question selection and review. Missing or invalid Firestore policy produces an explicit unavailable state, without invented fallback content.

## Applied live changes

- Configured all five active quizzes.
- Tagged 25 existing main questions and added 25 alternate main questions, yielding ten per quiz.
- Added 29 practice questions, including coverage for spiritual leadership, nature beliefs, ritual purposes and Islamic teachings.
- Applied the 84 catalog changes atomically, followed by a punctuation correction.
- Deployed Firestore rules for owner-only attempt access and append-only attempt writes. Existing reward amount and paired first-completion checks remain in place.
- Backed up the original catalog and deployed rules under `backups/`. No existing learner records were migrated or reset.

The reviewed migration is `data/mission-quiz-flow-migration.json`. Runtime pages never read that file; their source of learning data is Firestore. `functions/apply-mission-flow.cjs` defaults to a read-only dry run; `--apply` commits with update-time preconditions and writes a backup. `--revise` explicitly allows revising already-created migration content. These maintenance scripts use the existing Firebase CLI login without printing credentials.

## Validation

Student styles now make the `hidden` attribute authoritative even for flex/grid components. The quiz browser check now includes the actual shared/quiz styles and checks computed visibility before submission, after failure and after passing. Practice checks also verify completion/save controls are actually hidden at the correct time. Lesson, quiz and practice Chrome checks pass. This is not a substitute for the deferred full live UI or physical-phone walkthrough.

- 32 local unit tests passed, covering all six possible main quiz scores, retry coverage, repeated-question disclosure, adaptive topic coverage, difficulty changes, review resolution, saved attempts and reward replay behavior.
- Actual quiz-page Chrome test passed: five questions, 2/5 fail, weak-topic feedback, fresh retry, 3/5 pass, XP and artifact display.
- Actual practice-page Chrome test passed: targeted questions, labels, saved history, resolved topics, review links and failed-history messaging.
- Firebase compiled and deployed the security rules successfully.
- A live smoke test exercised the actual browser reward service against the original Firestore database: failure save, fresh retry, 3/5 pass and duplicate submission. Its temporary Firebase Authentication account and all its learning records were deleted afterward.

## Practice session recovery

The chapter map invalidates earlier chapter requests when students select another era. Session changes also discard pending era/chapter responses; sign-out clears the cards and selected chapter section. Repeated same-user auth notifications preserve the current selection. `tests/chapters-browser.cjs` verifies prerequisite locking, saved-completion unlocking, rapid era switching and sign-out during loading with mocked Firestore.

Successful chapter results now provide distinct navigation: Continue Your Journey opens the chapter map, while Back to Missions returns to the current chapter. The result invites students to explore available chapters rather than claiming a next chapter always exists. Chapter availability continues to come from Firestore and the existing prerequisite checks. The chapter Chrome test verifies both destinations and the absence of the unconditional unlock claim.

Quiz-based practice recommendations now require active matching practice content in the current Firestore catalog. Removed/inactive topics and malformed topic lists do not produce unusable review links. A regression test covers catalog removal, current topic labels and mission scoping; all 47 local unit tests and the practice Chrome check pass.

Chapter catalog loading failures offer Try Loading Again. Begin stays disabled during loading or errors, and overlapping loads are ignored. The chapter Chrome test covers a failed read and successful recovery before exercising its assessment and save-retry flow. All ten student Chrome scripts passed together, alongside the 46 local unit tests. These browser checks use mocked Firebase and do not replace the pending live UI walkthrough or physical phone acceptance.

If a passing chapter challenge cannot save, Retry Saving Completion resubmits the existing answers rather than restarting the challenge. Only one result/save operation runs at a time. The chapter Chrome test simulates a failed transaction, verifies that completion was not created, retries successfully with unchanged answers, and checks that repeated clicks produce only one save. Answers remain in memory; refreshing the page still restarts unfinished work.

Chapter challenges preserve unfinished attempts on repeated notifications for the same authenticated student. Session changes invalidate pending catalog loads and completion/badge responses, and sign-out clears answers and displayed rewards. The expanded chapter Chrome test verifies delayed loads and committed saves after sign-out, fresh sign-in and existing interaction/badge/replay behavior using mocked Firebase.

Main quiz load failures also offer Try Loading Again. Loading retries cannot overlap and reuse the session's attempt selection where available. The Chrome quiz test verifies recovery from a failed catalog read before completing the fail/retry/pass flow. This does not persist unfinished answers across a full page reload.

Practice keeps Review Lesson and Retry Mission Quiz available outside its question panel, including when content fails to load or a topic has no active questions. Try Loading Again retries Firestore reads without a page reload. Overlapping load retries are ignored, and sign-out hides recovery controls. The practice Chrome test covers content failure, an empty bank, recovery and preserved chapter/mission parameters. No fallback questions or curriculum data are embedded in the runtime code.

The mission journey refreshes its Firestore progress when restored from the browser Back/Forward cache. Failed loads offer Try Loading Again. Locked chapter challenges use the locked visual state and are not keyboard-selectable. Signing out clears the path and invalidates pending loads; repeated auth notifications preserve the current selection. `tests/mission-journey-browser.cjs` checks saved-progress unlocking, Back restoration, completed-mission review, challenge gating, safe titles, retry and session recovery using the actual page/module with mocked Firebase. Full live application acceptance remains pending.

The main quiz also ignores pending load, profile and submission responses after a session change. Routine authentication notifications for the same student preserve the unfinished attempt. Signing out clears questions, answers and results before redirecting to login. Retry loading hides the previous quiz until the new set is ready. The expanded Chrome test verifies these cases, including a committed submission whose response arrives after sign-out and replay without duplicate XP. The test suppresses only the login navigation so it can inspect the cleared page; Firebase remains mocked.

Pending practice content, history and save responses are ignored after the authenticated session changes. Signing out clears in-memory questions/results; a fresh sign-in loads practice again with a new session record. Repeated authentication notifications for the same student preserve the current activity. Save retries cannot overlap, and an in-flight save retains its original account and document reference.

The practice Chrome test covers sign-out during a delayed content load and a fresh sign-in. The save unit check covers overlapping retries and a late save response after sign-out. All 46 local unit tests pass. These checks use mocks; the complete live UI walkthrough and physical phone acceptance remain pending.

## Free-plan limitation

Grading and adaptive recommendations run in the browser. Firestore validates ownership, record shape, configured reward amounts and paired completion writes; it cannot prove that a modified browser submitted an honest quiz score. This is the accepted free-plan design. The pre-existing Cloud Function implementation is not deployed or used by this student flow; switching to server grading later requires a coordinated implementation and deployment.

New historical content and difficulty labels should be reviewed with the curriculum reviewer before research evaluation. The current bank has two main alternatives per objective, so continued retries eventually reuse questions with a visible notice.

## Configurable level progression

XP-to-level settings now live in `learningSettings/progression`. See [student-progression.md](student-progression.md) for the configuration, preserved XP, reconciliation command and live verification.

Retry transparency: the quiz now explains fresh retry sets and reports the count of previously seen questions when equivalent slot coverage requires reuse. Firestore topic/difficulty blueprints remain authoritative. Unseen questions are preferred, then older questions outside the last attempt, then immediate repeats only as needed. Refresh preserves the issued set. A partial-bank test verifies freshness never weakens coverage. Session changes during quiz issuance are rejected.

Guided topic review: Review & Practice links carry review=1. New sessions show recommendation provenance, the existing Firestore mission lessonRecap when present (otherwise a lesson link), and an explicit Start Targeted Practice action before revealing questions. The recap is mission-level, not a fabricated topic explanation. Existing saved sessions resume directly. Completion retains per-topic evidence and quiz retry, with Continue My Journey available. Practice does not award mission completion/XP. Guided entry, safe recap text and resume bypass are covered in the practice browser suite.

Expedition briefing: new quiz attempts show Firestore mission objectives, question count, configured passing threshold and available mission XP before revealing questions. Begin Expedition records started=true in the owned draft. Started attempts resume directly, including older drafts with saved answers. Browser coverage verifies briefing visibility, beginning, refresh resume and existing quiz/reward behavior. Review flags also persist in the owned draft and produce a review panel before submission when present.

Expedition results now show correct checkpoint counts and the configured passing requirement. Topic recovery cards link to mapped teaching scenes and targeted practice. Newly earned XP/artifact panels appear above answer review with a brief reduced-motion-aware reveal; no-reward replays hide and clear that effect. Browser coverage checks these result states and recovery links.

Quiz decision loop update: question markers are navigable after Begin Expedition. Students may revise any answer before submission, including answers marked locked by older drafts. Next Question advances once without a lock-in phase. Review My Answers opens the expedition journal with all choices and Review Later markers; Submit Answers remains disabled while answers are missing. All grading and correctness feedback still occur after submission. Browser checks cover editing an older locked answer, the journal flow, saved flags/resume and rewards. This supersedes earlier answer-locking descriptions.

First-mission scenario assessment: ten existing quiz-1 question documents now contain authored fictional situations or evidence-comparison tasks, with two variants per topic. The migration updates question/choice text and aligned post-submission feedback only; topic/difficulty tags, policy, rewards and student records remain unchanged. All ten documents were read back successfully after an update-time-guarded commit; backup retained. Independent teacher review of difficulty equivalence, distractors and Grade 5 reading load remains pending. Existing drafts for this quiz reset through content-version validation because question text changed; completed results remain saved.

Grade 5 wording pass: all 20 question variants for quizzes 1 and 2 now use shorter situations, simpler choices and plainer correct-answer explanations. Historical concepts and existing correct-answer keys, topics, difficulty tags and scoring were retained. The original project update was backed up and all fields were read back. This is an editorial simplification, not evidence of a validated Grade 5 reading level; teacher/student review remains pending. Content-version validation may restart unfinished attempts.
