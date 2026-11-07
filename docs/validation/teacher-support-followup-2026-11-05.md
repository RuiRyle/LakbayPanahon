# Private teacher follow-up validation

The private follow-up feature is implemented locally. Hosting and revised Firestore rules have not been deployed.

## Behavior

- Student report → Private teacher follow-up: choose mission, status (planned/discussed), and a private note of 1–1500 characters.
- One current note per class/student/mission; revisions prevent stale concurrent edits. A status change updates statusAt; editing text alone preserves it.
- Notes are separate from student-visible feedback. Students and other teachers have no read/query/write access. Archive or leaving revokes teacher access.
- Later dated quiz attempts appear alongside the follow-up when the report is reopened. Missing, tied and future timestamps are treated as uncertain. Discussion status is not mastery or a resolved-review flag.
- Draft protection, retry, safe text rendering and session/class/mounted-element guards apply.

## Evidence

- Three tests pass in `tests/teacher-support-policy.test.cjs`, covering date boundaries, mission scoping and uncertain timestamps.
- `tests/teacher-workspace-browser.cjs` passes at 390px and 1280px, including planned/discussed saves, preserved status time, cross-session conflict handling, private text separation, safe rendering, unsaved drafts, unchanged score/feedback and later quiz evidence.
- `tests/teacher-pages-browser.cjs` verifies separate teacher-page navigation and report/progress deep links with mocked Firebase records.
- `tests/my-class-browser.cjs` passes the student feedback, membership, lesson-prerequisite, read-recovery and session regression checks.
- The local Firestore suite passes 114 integration checks including private-note access denial for students/other teachers, scoped owner query, invalid status/score-field rejection, revision checks, timestamps, archive and leave behavior. Evidence is in `teacher-student-loop-emulator-2026-11-03.json`; verifiedAt identifies the current run.
- Data dictionary audit passes: 66 tables, 37 collection references. The technical dictionary, academic generator/output and ERD document teacherSupportNotes.

The final browser regression run was previously interrupted by automatic approval review hitting a usage limit. It was rerun successfully after the user requested continuation. Browser tests use synthetic mocked records; emulator tests use local synthetic identities. No live learner data was changed.
