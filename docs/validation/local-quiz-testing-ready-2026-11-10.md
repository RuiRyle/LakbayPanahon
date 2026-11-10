# Secured local quiz testing ready

10 November 2026. No emulator session was running. Started the dedicated secured local launcher from backup `build/local-backups/2026-11-09T03-50-37-108Z`, preserving its accounts and catalog rather than reseeding. Current website: http://127.0.0.1:4173/pages/login.html. Emulator UI: http://127.0.0.1:4000. The website's environment module was read back and confirms `demo-lakbay-local`, with Auth 9099, Firestore 8180 and assessment Functions 5001.

`node tests/local-secured-catalog-smoke.cjs --fresh` passed using a new synthetic student: sign-in, five real catalog questions, saved answers, resume, follow-up, server grading, receipt replay, first completion XP 40 and next-mission unlock. Score 100, XP 40. This is actual loopback backend execution, not mocked Firebase.

Before browser testing, exported the current Auth/Firestore session. The emulator completed its export but Windows blocked its final rename. Verified the completed export and moved it within the workspace to `build/local-backups/2026-11-10T05-00-46-256Z`, retaining Auth and Firestore metadata and adding the local restore marker.

`node tests/local-study-browser.cjs` passed seven actual-browser/SDK/emulator checks: dedicated demo routing, authenticated prologue lesson loading, lesson reload, five answers using actual quiz controls, expected server-graded result, saved result after reload and preservation of one 40-XP award. Browser test used the restored synthetic student; its local learning activity changed. Original backup remains available. Raw browser report: `local-study-browser-2026-11-09.json` (legacy filename, current verification timestamp).

The local suite is left running for user testing. Use `student@lakbay.local`, `teacher@lakbay.local` or `admin@lakbay.local` with the existing shared synthetic password. These are separate from main Firebase identities. Session data must be exported before stopping; launchers do not persist automatically.

No production database, hosted endpoints, App Check settings, billing or deployment changed. No grading/reward code changes. This proves the bounded local quiz flow; it is not all-project acceptance or hosted readiness. AI assistance is not running in this local suite.
