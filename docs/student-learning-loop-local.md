# Student learning loop — local verification

Checked 2026-10-28 using mocked data, without live Firestore requests.

Six browser suites passed: student-dashboard, my-journey, mission-journey,
story, student-review, and mission-quiz.

Home's browser test still expected direct practice after a failed quiz. Updated
it to assert the intended lesson-first flow and added checks for:

- Failed quiz → exact missed topic in the story lesson.
- Revisited lesson → targeted practice with the original chapter and mission.
- Review evidence cleared → main quiz retry.
- Failed mission remains current; completed mission advances to the next lesson.

The other suites cover saved drafts, lesson interactions, practice recovery,
equivalent retry questions, passing/failing results, mission unlocks, and replay
without duplicate XP. All 374 local unit checks also passed.

These are separate browser fixtures checking page behavior and route handoffs,
not one authenticated cross-page session against a shared live database.
Live persistence, deployed Firestore rules, and actual published content still
need verification. No runtime code or database content changed in this pass.
