# Teacher–student workflow acceptance — 2026-11-06

Outcome: local emulator checks passed using the current staged website, real Firebase web SDK, Auth emulator and Firestore emulator. Production Firebase was not contacted by the workflow tests. Temporary browser fixtures were cleaned up.

## Verified

- 129 teacher/student integration and permission checks: ownership, approval gates, unique invitations, enrollment, draft/publication access, reporting authorization, private guidance, archiving, restoration and immediate access revocation after leaving. Source: teacher-student-loop-emulator-2026-11-03.json (verifiedAt refreshed by this run).
- Invitation-specific class-code ownership and correct enrollment checks passed.
- 16 private help lifecycle/understanding checks, 18 review/explanation/guidance checks, and 8 classmates lifecycle checks passed.
- 22 actual browser checks passed: teacher readiness, class goals, targeted mapped reviews, student visibility, old versus fresh evidence, help follow-up, reflection, private guidance, report evidence, account settings and 390px layout containment. Evidence: class-teaching-browser-2026-11-06.json.

The browser test selector now uses the report button's stable data attribute instead of its previous text label. The actual workflow did not require a production logic change.

## Limits and remaining checks

Quiz evidence in this walkthrough is deliberately synthetic; it validates teacher/student interaction, not quiz grading or content quality. Announcements, enrollment and access boundaries are covered by emulator integration checks; this browser walkthrough does not claim every possible UI path. Chrome emitted native cross-document ViewTransition abort diagnostics during scripted navigation; navigation and all assertions completed successfully.

Before production sign-off, perform a small authorized check against real Firebase for published rules/indexes, email delivery, deployed URL routing and the actual account setup. Local passing tests do not establish those external conditions. No deployment was performed.

## Local walkthrough

Open http://127.0.0.1:4173/pages/login.html while the emulator launcher is running. Use teacher@lakbay.local or student@lakbay.local with password LakbayLocal123!. These credentials exist only in the isolated emulator. Use separate browser profiles for teacher and student if comparing both simultaneously. Local data resets when the emulator restarts.
