# Mission-specific teacher feedback

Implemented locally on November 5, 2026. Website and revised Firestore rules are not deployed.

Teachers send student-visible guidance from Student Progress → View Learning Report → Give [student] a next step. The message belongs to one existing mission and one active class member. The latest message per class/student/mission is retained in `classFeedback`; updating it increments revision and resets its read acknowledgement. Previous revisions are replaced, not archived as conversation history.

Students see the feedback in My Class, including when the mission has not separately been assigned. Mark as Read uses a transaction and refuses to acknowledge an older displayed revision after a teacher update. My Journey remains responsible for normal lesson access and prerequisites. Feedback does not award XP or modify scores or completion records.

The teacher sees sent text and whether the latest revision was explicitly marked read. Read acknowledgement is not proof of understanding. Unsent guidance participates in discard confirmation. Feedback loading errors offer retry and do not block learning reports or student lessons/assignments. Asynchronous responses check session, class context and mounted UI before rendering.

## Validation

- `node tests/teacher-workspace-browser.cjs`: desktop and mobile checks pass, including send, update, safe text, read-state reset, unchanged score and unsent-draft protection.
- `node tests/my-class-browser.cjs`: pass, including student message display, mark-read persistence, stale-revision rejection, feedback outage isolation and existing class/mission/session regressions.
- `node tests/teacher-pages-browser.cjs`: separate-document navigation and report/progress links pass at 390px and 1280px.
- Local Firestore emulator: 98 integration/permission checks pass. Includes owner/recipient access, scoped queries, cross-account denial, acknowledgement-only student updates, revision rules, private-field rejection, archive restrictions, and access revocation on leaving.
- `node functions/audit-data-dictionary.cjs`: pass, 65 tables and 36 collection references. The technical dictionary, academic generator/output and ERD include the feedback entity.

Browser tests use actual modules with mocked Firebase records. Emulator tests use synthetic local identities. No live learner records were changed, and these checks do not verify hosted deployment. The updated `classFeedback` rules must be published before feedback can be sent or acknowledged against the hosted Firebase database.
