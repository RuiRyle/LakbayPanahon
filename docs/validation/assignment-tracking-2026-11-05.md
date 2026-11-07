# Assignment tracking — November 5, 2026

Implemented locally. Hosting and revised Firestore rules are not deployed.

Teachers can set, edit or remove an optional date deadline. It means 11:59:59.999 PM Philippine time. The stored field is `classAssignments.dueAt`; omitted or null means no deadline. Undated writes continue omitting this field for compatibility. Publishing or withdrawing an existing assignment preserves its date.

Saved assignments filter by all, published, draft or published with due date passed. Loaded mission progress filters by all students, completed, not yet completed or unavailable. Filters apply to the loaded group of up to 20 students and say so. Deadline timing is distinct from completion; missing completion dates are not treated as on-time or late. Prerequisite readiness is not asserted from these records; student My Class remains the authoritative interface for the student's available learning path.

Validation passed: five policy tests; teacher desktop/mobile workflow checks including deadline round-trip, visibility changes and filters; student My Class browser regression; separate-page navigation; and 78 local Firestore emulator permission/integration checks. Rules reject a non-timestamp deadline and unauthorized student/other-teacher edits, and allow the owner to add or clear the deadline. Data-dictionary audit passed.

Commands: `node --test --test-isolation=none tests/teacher-class-policy.test.cjs`, `node tests/teacher-workspace-browser.cjs`, `node tests/my-class-browser.cjs`, `node tests/teacher-pages-browser.cjs`, and `node tests/teacher-workflow-emulator.cjs --refinement` with the local demo emulator at port 8190.
