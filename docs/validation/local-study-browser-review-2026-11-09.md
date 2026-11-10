# Local browser study-flow finding

9 November 2026. **Result-reload defect fixed and bounded browser regression passed; full journey remains open.** Actual Chrome, Firebase browser SDK and local emulators were used with the seeded synthetic student. The corrected package is `build/student-web-SwUlGX`. No deployment or billing activation occurred.

The authenticated prologue lesson loaded and reopened after reload. Five adaptive answers were entered using actual quiz controls, the confirmation and three personalized practice feedback steps completed, and the result displayed score 100 for the review attempt.

The next assertion failed: reloading the result page displayed a new five-question expedition briefing instead of the saved result. Treat this as an unresolved result-recovery behavior until investigation distinguishes application behavior from test/navigation context. Do not claim saved browser-result recovery passed from the earlier direct callable smoke.

Earlier harness issues were corrected: lesson queries initially inspected the outer student shell rather than its frame; the test initially assumed any new quiz visit should immediately show an older result. A frame `eval` approach was rejected by CSP and replaced by Chrome's default frame execution context; site CSP was unchanged. These intermediate failures do not establish application defects.

Root cause confirmed: the quiz retained a temporary attempt ID rather than the server-issued ID, then removed that reference after submission. The quiz now updates the reference after issuance and retains it for secured result recovery. Explicit retry/restart still clears it. No grading or server reward logic changed.

The corrected build passed actual quiz answer controls, personalized feedback, passing result, reload and unchanged XP 40. A second zero-score browser run passed failed-result reload, targeted lesson/practice links and explicit retry creating a fresh unanswered attempt. These use an already-completed synthetic mission: they do not prove a new student's entire lesson interaction or first unlock sequence.

All ten actual three-role checks passed on the same corrected package, with fixture cleanup successful; see `cross-role-browser-local-2026-11-09.json`. Seven assessment-client tests also passed. Persistence restore, full lesson interactions/first unlock and participant evaluation remain open. Backend direct-call resume/replay evidence is recorded separately in the local secured launch review.

Follow-up: backup restore passed separately. Six classroom browser/SDK checks passed on the restored secured setup. `node tests/local-secured-catalog-smoke.cjs --fresh` created a uniquely labelled synthetic local student, passed the prologue assessment, confirmed first completion XP 40 and replay at 40, then issued the next mission's five questions. This closes that bounded backend first-unlock check, not the complete lesson browser interaction. The clearly labelled progression fixture remains in local demo data.

The final failed-attempt browser run passed all nine checks and is recorded separately in `local-study-browser-failure-2026-11-09.json`. The existing story browser regression also passed interactive lesson controls, previous/next, completion, layout, load/empty-scene retries, session recovery and unsafe content handling. That suite uses isolated fixtures and does not replace an entire current-catalog lesson walkthrough.
