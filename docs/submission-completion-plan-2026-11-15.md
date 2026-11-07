# November 15 submission completion plan

Approved direction on 7 November: local secure demonstration, synthetic accounts, accepted Stage 0 preserved, no hosting research or production activation. This is an integration candidate, not a production release.

## Startup

Use Node 22, Java 21 and the existing Firebase CLI. Run `node tools/start-submission-demo.cjs` from the workspace root. The separate launcher stages the latest allowlisted frontend, overlays the seven accepted secure assessment modules, uses accepted secured Rules and starts Auth/Firestore/Functions on loopback under `demo-lakbay-local`. It seeds only synthetic teacher/student accounts and offline educational data, disables Bayani live AI through the synthetic policy, and enables the local secured-assessment protocol. Stage 0 is never edited. Stop with Ctrl+C; local records reset on restart.

Website: http://127.0.0.1:4173/pages/login.html. Teacher `teacher@lakbay.local`; student `student@lakbay.local`; both passwords `LakbayLocal123!`. These are public synthetic fixtures, never production accounts. No emulator data export is assumed. Browser SDK downloads require internet. This is not an offline-ready package.

## Acceptance before presenting

1. Verify all network data endpoints are loopback and the project is `demo-lakbay-local`. Never use normal Live Server for the demonstration: ordinary frontend configuration uses production.
2. Student signs in, opens prologue story, uses narration and completes an issued assessment. Refresh after an acknowledged answer and confirm restoration.
3. Submit a passing assessment, inspect synthetic progress/XP, reload and replay without a second award. Demonstrate stale-session and forged-write rejection using the established Stage 0 acceptance harness.
4. Demonstrate daily completion and chapter badge with synthetic prerequisites only; never alter real learners to accelerate a presentation.
5. Teacher creates a classroom, student joins, and role-isolated assignment/monitoring flows work. This integrated frontend/secured-Rules combination still needs verification.
6. Live AI is unavailable; authored Bayani activities and device/recorded narration are separate features. Do not label scripted guidance as generated AI.
7. Verify all 16 chapters/66 missions/330 topic mappings and essential assets; document exact failures. Preserve content and IDs.
8. Rehearse twice from a stopped emulator state. Record a synthetic backup demonstration and disclose hosted limitations.

## November 9–15 schedule

| Date | Deliverable | Acceptance |
|---|---|---|
| Nov 9 | Scope/package freeze and isolated demo startup | Accepted hash intact; no production data requests; full inventory checked |
| Nov 10 | Student/assessment P0 fixes | Story-to-result flow; retry, refresh and one-time rewards pass |
| Nov 11 | Teacher/student integration | Classroom, membership and monitoring; unauthorized access denied |
| Nov 12 | Content and physical-device review | All routes/assets checked; audio/text fallback; critical factual issues resolved |
| Nov 13 | Regression/documentation cutoff | Zero P0; mission/daily/chapter and data-preservation acceptance |
| Nov 14 | Frozen package, rehearsal and recording | Clean startup twice; presentation completes without developer repair |
| Nov 15 | Final smoke and submission | Same verified artifact; limitations disclosed; no feature additions |

P0: data isolation, trusted grading/rewards, correct package, startup failures and misleading AI claims. P1: student/teacher workflows, content routes, narration/accessibility and handoff. P2: provider migration, catalog authority integration, new AI provider, complete voice recordings and decorative redesign. Priority 4 remains excluded.

Parallel work can cover adult content review, device/audio testing and presentation documentation while engineering handles integration. One person owns the final package. Human reviewer availability, assessor acceptance of a local demo, presentation duration/device and internet access remain user decisions. No teacher/learner acceptance is inferred from automated checks.
