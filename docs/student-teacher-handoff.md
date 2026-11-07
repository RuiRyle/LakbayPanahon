# Student workflow handoff — 31 October 2026

**Current release update:** The [cross-role release handoff](website-release-current.md) supersedes older package references below. The approved seven-day Hosting preview is published and verified, including recoverable teacher registration, all three real role routes, required security headers and selected assets. Main-channel rollout and human/device/content criteria remain separate.

**Administrator update:** The [administrator workspace](admin-workflow.md) now implements teacher verification and student/teacher account-status management. Its narrow permission changes are published and verified, with immutable paired audit records. No existing account was changed; website Hosting and human/release gates remain open.

**Teacher implementation update:** The [teacher workspace](teacher-workflow.md) now implements owned classes/codes, paged named rosters, mission/quiz reporting, announcements and mission assignments. Local emulator and browser checks pass. The reviewed teacher permission rules are published and verified following user approval. No student progression, grading or rewards were changed.

**Current content update:** The [four structural editorial findings are fixed and published](validation/content-quality-fixes-2026-10-31.md). Current generic-stem/repeated-feedback/long-paragraph counts are zero. The old 46-mission batch label does not mean 46 mandatory whole-mission rewrites remain; further work should follow specific teacher/content and learner findings. The 13 curriculum depth findings and human/device/AI/release gates remain open.

**Chapter 7 update:** All four lesson/question revisions and obsolete completion notices are [published and verified](validation/chapter7-learning-clarity-2026-10-31.md). Forty-six deeper mission reviews and the human/device/release gates remain open.

**Content follow-up:** [Published repairs and Chapter 6 evidence](validation/student-content-completion-2026-10-31.md) supersede earlier counts: 381 checks across 62 suites and all 17 browser fixtures pass. Fifty deeper mission reviews, the 13 curriculum depth findings and human/device/release gates remain open.

This is the current engineering handoff for teacher development. It preserves the serious web-system scope in [project scope](project-scope.md). It is not a declaration of public-release readiness, complete curriculum review or measured learning effectiveness.

Final local acceptance: **371 checks across 60 suites and all 17 browser fixtures pass**. The [local report](validation/student-handoff-local-2026-10-31.json) and [finalization summary](validation/student-handoff-summary-2026-10-31.json) preserve the current evidence. The reviewed local package is `build/student-web-FPEA5d/public` (26 pages, 541 files), verified against current public sources. Run `node tools/serve-student-web.cjs build/student-web-FPEA5d` from the project root to preview it. Nothing was deployed.

## Student behavior to preserve

The independent route is registration/sign-in → Home → eligible chapter/mission → ordered lesson activities → five-question quiz → explanation/review/practice/retry when needed → saved completion and configured rewards → chapter challenge → next chapter → journey finale. A class is optional. Teacher approval, a school subscription and class membership must not become prerequisites for students to learn independently.

The user explicitly retired exploration/testing mode on 31 October. Every student page now uses the original saved-progression flow on localhost and hosted pages. Old `on` settings are cleared, and no exploration bar or toggle is available. Real learner progress and unrelated preferences are preserved. Historical preview tests remain evidence of earlier behavior, not an available product mode.

The offline [catalog and route audit](validation/student-handoff-audit-2026-10-31.json) checks all 66 missions, 388 scenes and 330 quiz topics against the dated catalog plus hash-verified publication overlays. It selects initial and unused equivalent retries, checks practice difficulty coverage, and simulates the actual Home/Journey policies through all 66 mission completions and 16 chapter challenges to the ending. That is synthetic navigation evidence, not 66 real-account mission walkthroughs or a fresh full-database read.

The new [real-account acceptance](validation/student-handoff-live-2026-10-31.json) verifies registration, the normal-mode default without an override, lesson reload, failed quiz without XP, mapped lesson review, acknowledged practice, passing retry with equivalent questions and one-time reward, next destination, and actual offline/reconnect saving. Exact 390px/1440px checks pass for lesson recap and result. Its temporary account and nine owned records were removed. Existing [full prologue evidence](validation/student-full-chapter-2026-10-31.md), [Chapter 5 continuation evidence](validation/chapter5-normal-progression-2026-10-29.md) and [finale evidence](validation/journey-finale-2026-10-31.md) retain their narrower dated scope.

## Fixed teacher/student data contract

Use [student-class-flow.md](student-class-flow.md), `js/student-class-client.js`, `js/my-class.js`, `js/class-announcements.js` and `firestore.rules` as the existing implementation contract.

| Document | Teacher integration requirement |
| --- | --- |
| `classes/{id}` | Preserve `name`, owning `teacherId`, `teacherName`, optional `description`, and `status` (`active` or `archived`). A teacher must only manage their own classes. |
| `classJoinCodes/{code}` | Use a random 12-character uppercase alphanumeric ID, `classId`, `status: active` and optional timestamp `expiresAt`. Exact lookup only; rotate/revoke without exposing other class codes. |
| `classMembers/{studentUid}_{classId}` | Existing student join creates `userId`, `classId`, `joinCode`, `status: active`, timestamp `joinedAt`. Duplicate join is idempotent; leaving removes membership without deleting progress. |
| `classAssignments/{id}` | Preserve `classId`, `chapterId`, `missionId`, `title`, `status: published`, optional `instructions`, timestamp `dueAt`. Drafts stay hidden. Assignments respect prerequisites, count earlier independent completion and award no extra XP. |
| `classAnnouncements/{id}` | Preserve `classId`, nonempty `title`, nonempty `body`, `status: published`, timestamp `publishedAt`. Students read published messages for their joined classes; timestamps display in Philippine time. |
| Student progress/results | Read only the records needed for an owned class and its active members. Existing student-owner rules do not automatically grant teacher roster/result access. Add explicit teacher ownership/membership checks and cross-class denial tests. |

Do not change the curriculum, quiz keys, pass policy, adaptive evidence thresholds or reward rules to implement teacher monitoring. Current quizzes are browser-graded; do not label teacher-visible scores as tamper-proof or server-verified. Server grading remains a separate coordinated migration.

## Teacher implementation order

1. Approved teacher authentication and role guards. Unapproved/inactive accounts receive honest status and cannot access student records.
2. Owned class creation/edit/archive, invitation generation/rotation/revocation and safe roster display.
3. Owned-class progress/results views with cross-teacher and nonmember access denied. Handle unavailable data distinctly from zero progress.
4. Published announcements, then existing mission-assignment publishing without bypassing student locks or adding a submission/grade system.
5. Integration acceptance: owning teacher creates/publishes; student joins by code; drafts and other rosters stay hidden; earlier completion is recognized; a locked assignment remains locked; a newly completed mission appears; revoke/expire/archive/leave preserve progress.

Start admin account/teacher-verification work around the same role contract after teacher requirements are reviewed. Do not invent a school/operator, billing feature, new curriculum authoring system or required class membership.

## Work still open

These are explicit unfinished items, not passed criteria:

- Content: 12 Chapter 3–5 missions have the deeper scene/question rewrite. The remaining 46 retain existing banks and all-66 guides/application activities. The 49 missing practice-feedback maps and 13 missing scene-reference lists are now repaired and published. The audit retains 450 generic stems, 1,054 repeated-wrong-feedback flags and 162 long paragraphs. These flags overlap and locate editorial work; they are not counts of factual errors. The 13 curriculum depth findings remain open. Continue targeted content review; teachers are monitors, not replacement curriculum authors.
- Human acceptance: independent history/Grade 5 review, supervised intended-learner comprehension, actual-phone output and human listening are not completed by automated tests. Use the [prepared learner playtest](validation/grade5-student-playtest-plan.md).
- Optional services: partial recorded narration falls back to device speech; optional AI tutoring still needs provider/audience and actual-response acceptance. Neither is evidence of full voice coverage or AI suitability.
- Release: website Hosting is not deployed. Hosted Auth/assets/security-header acceptance, real operator/support/data-handling arrangements and the account-assistance process remain rollout gates. Undecided buyer details do not prevent teacher implementation.

Engineering handoff must not be reported as closing every row of the [student acceptance checklist](student-acceptance-checklist.md). Reopen student implementation for confirmed defects or an explicitly reviewed contract change; keep remaining content, human and release work visible while teacher integration is built.
