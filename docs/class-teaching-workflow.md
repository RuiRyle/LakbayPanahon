# Class learning goals and targeted review

Implemented locally on 5 November 2026. The online website and rules have not been published by this change.

Activity lifecycle update (6 November 2026): class goals and personal reviews now also support Closed/Withdrawn with `endedAt`. Ended work remains read-only in student history; [full semantics and release requirements](activity-lifecycle.md).

## Class learning goal

On Assigned Missions, choose a class, select **Class learning goal**, choose a mission, and explain what the class should investigate or prepare for discussion. Check student readiness before setting a deadline. The readiness check loads saved evidence in groups of 20 and distinguishes completed, ready, locked, unavailable content, and unverified results. It is not a live class-wide monitor. Students retain their chronological prerequisites, and prior mission completion counts toward this shared goal.

Existing `classAssignments` records are treated as class goals. No migration or new completion document is required.

## Targeted review

Choose **Targeted review**, select up to 10 current members per publication, choose the mission and provide review guidance. Student selection is paged in groups of 20; selections persist across groups. The operation atomically creates one private review document per selected student. Teachers decide who needs support from the learning evidence; the system does not automatically label a low score as a diagnosis.

Only the intended student sees their review. The student revisits the lesson and takes the mission quiz again. Completion requires a passing saved result for that student, mission and chapter with `completedAt` strictly later than the review's first publication timestamp (`assignedAt`). It is derived from existing attempts, never from an old mission-completion flag or a student-written submission checkbox. The time boundary measures when the result was saved, not when the quiz was first opened.

The latest dated pre-publication score is the comparison baseline. The latest post-publication score and percentage-point change are displayed when unambiguous. A missing baseline does not imply zero, and tied timestamps do not invent an ordering. A passing fresh attempt completes the review even if the student later retries with a lower score; latest score and completion therefore remain distinct. These comparisons do not establish that teacher intervention caused improvement.

Editing guidance, deadlines, or draft visibility preserves `assignedAt`, the student and mission. Create a new review for a new round of work. Drafts have a null anchor until first publication. Existing mission XP/reward rules still apply; reviews do not add duplicate completion rewards.

## Teacher progress and student support

View Student Progress on a class goal reports normal mission completion. On a personal review it reports only that recipient's fresh review evidence, with baseline, latest score, score change and deadline status. Dashboard summaries use the same evidence boundary.

Private mission-help requests also support reviews using `assignmentKind: targeted-review`. Students can ask for explanation without exposing their question or results to classmates. Leaving a class removes student access; teacher response still requires current membership.

## Storage

Focused-review metadata, the optional explanation workflow, activity filters, follow-up views and private encouragement are described in [classroom learning follow-ups](classroom-learning-followups.md). The private-review schema below now also permits reviewTopic, reviewSceneId and reflectionQuestion.

`classReviewAssignments/{id}`: `classId`, `userId`, `assignmentType` (`targeted-review`), `title` (1–120), `instructions` (up to 1500), `missionId`, `chapterId`, `status` (`draft`/`published`/`closed`/`withdrawn`), `publishedAt`, `updatedAt`, optional `dueAt`, terminal-state server timestamp `endedAt`, and `assignedAt` (timestamp or null for an unpublished draft). Document IDs are auto-generated strings. No review-grade copy or separate reward record is created.

The review form requires guidance. Rules validate target membership, class ownership, published catalog relationships, target privacy, allowed fields, server timestamps and anchor preservation. Teacher readiness additionally needs read access to active `eras` metadata and chapter-progress records covered by their existing teacher–student reporting link.

## Validation

- `node --test --test-isolation=none tests/review-evidence.test.cjs tests/assignment-readiness.test.cjs tests/teacher-class-policy.test.cjs tests/student-class-client.test.cjs`
- `node tests/class-review-emulator.cjs`
- `node tests/class-help-emulator.cjs`
- `node tests/class-teaching-browser.cjs`

The browser check uses the actual local pages, SDK, teacher/student logins and forms. It creates and deletes a temporary class, goal, review and synthetic score records. Synthetic score fixtures verify evidence display; they do not test quiz grading or a real student's improvement. Current quiz grading uses the existing browser-based assessment client and its Firestore rules, independently of the inactive cloud assessment proposal. Firebase Functions are not running in the current emulator setup. Desktop and 390px screenshots are saved in `docs/validation/class-teaching-*.png`.
