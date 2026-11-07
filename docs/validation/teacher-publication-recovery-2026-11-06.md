# Teacher publication save recovery

Verified: 2026-11-06. Scope: announcements, class goals, and personal-review publication.

- A successful write and a failed list refresh have separate outcomes. The teacher sees a confirmed save and a read-only Refresh saved list action.
- New publication attempts retain allocated record IDs for explicit retries, including each recipient of a personal review.
- An uncertain response preserves the form and requires Check save status before another submission. Cancelling or switching classrooms cannot silently forget that pending save.
- Verification compares saved content with the attempted content, including an edited record, assignment deadline, and review teaching fields. Finding an existing record ID alone does not confirm an edit.
- No automatic write retry is sent. Once a server read finds no matching saved changes, an explicit retry is available.

Validation: teacher-publication-recovery.cjs (30 mobile/desktop assertions), teacher-announcements-design.cjs, and teacher-assignments-design.cjs passed. JavaScript syntax checks passed. Release packaging verified 571 files, 32 pages, and zero missing or rejected references in build/student-web-HMmWHr.

Tests use actual modules with mocked Firestore in Chrome. They do not establish live Firebase acceptance. No live records were modified and nothing was deployed.

Pending work: teacher account/settings destination, class-wide reporting/export, and final teacher/student acceptance against the configured backend. Pending-save state is retained within the current page session; a browser reload still relies on the unsaved-changes prompt rather than durable recovery across sessions.
