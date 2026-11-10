# No-billing local secured launch

9 November 2026. Local backend smoke passed on `build/student-web-1HBfxy` with the prepared Stage 0 Node 22 backend, Auth 9099, Firestore 8180 and Functions 5001 under `demo-lakbay-local`. No billing activation or deployment occurred.

Fixed Firebase CLI Functions source resolution on Windows by using a path relative to the generated emulator configuration. Added explicit endpoint authentication checks before seeding, so a registered emulator port alone cannot establish readiness. Improved build spawn-error reporting. The newly added readiness guard has syntax coverage and its individual endpoint checks passed manually; a fresh launcher run with that guard remains to be verified.

All four callable endpoints returned HTTP 401 / UNAUTHENTICATED without credentials. The seeded student signed in. `node tests/local-secured-catalog-smoke.cjs` passed against the actual offline prologue catalog: five adaptive checkpoint answers, saved-answer resume, three follow-up answers, server score 100, first completion awarding 40 XP, and receipt replay. The test uses trusted repository answers as an automated fixture; it is not a usability or learning-effectiveness test. It writes synthetic student progress into the local session.

The first smoke harness iteration retained the initial adaptive question array and failed with `assessment/unissued-question`. Reading each next question from the latest returned state fixed the harness; grading logic was unchanged. An earlier attempt to enter Chapter 1 before the prologue was correctly denied as locked.

Remaining ordered work: full browser lesson/failure/feedback/practice/retry/reload/unlock journey on this build; all-role regression; local persistence and backup; content review and participant evaluation. Concurrent delivery and ambiguous commit behavior were not independently tested in this smoke. Local App Check exceptions do not establish hosted attestation. Public free deployment remains unverified. The historical Workers NO-GO remains in force.
