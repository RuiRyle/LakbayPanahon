# Fixed-package three-role browser acceptance

7 November 2026, Asia/Manila. **PASS within the scope below.** Actual staged HTML/JavaScript, browser navigation, Firebase SDK and local emulator Rules. No production credential, account, request, deployment, billing or Workers change.

Package: `build/student-web-EYkZzj`. Manifest SHA-256: `d94310977699252e1e98f856eb52a64a7770a0abcfe72f714b453588e496aee2`. A dedicated loopback server serves this exact package with only the documented emulator-environment module/CSP connection override; the existing classroom preview server was not replaced. The package predates this new harness but includes the admin overview and review/recovery improvements.

`tests/cross-role-browser-local.cjs build/student-web-EYkZzj` exited zero. [Result JSON](cross-role-browser-local-2026-11-07.json) records all 10 checks and successful cleanup.

## What actually happened

1. Trusted local fixture setup provisioned a temporary admin, pending teacher and student; no public admin registration was used. All identities are synthetic and unique to this run.
2. Teacher signed in through the real login form, reached unified setup and was refused direct classroom-dashboard access.
3. Teacher submitted a school-affiliation application through the real form.
4. Admin signed in, selected that submitted application, completed identity/affiliation checks and approved through the actual review form. The visible audit history and verified revision were checked.
5. Teacher's next login opened the authenticated classroom dashboard.
6. Student with no class membership opened the authenticated independent-learning dashboard.
7. Admin deactivated the teacher through the account-access form. The teacher's next login showed the inactive-account denial and did not open classroom tools.

Synthetic profiles, application, owned audit/review records and Auth identities were deleted by the harness; cleanup reported no errors. Browser and dedicated package server were stopped. This is cleanup of tracked fixture records, not a database-wide orphan audit.

## Harness corrections

Initial runs exposed fixture readiness assumptions: introductory text containing “submitted” was not a saved application; an empty pending-account queue is valid; inactive login intentionally stays on the sign-in page. Waits now target the saved application status, completed admin load and explicit inactive-account denial. All initial runs cleaned their fixtures. No application or Rules change was used to hide these harness errors.

## Limits and remaining gates

Email was marked verified through trusted local emulator fixture setup; no real email delivery or link redemption is claimed. This walkthrough exercises application/access transitions, not every classroom/learning activity or assessment grading. Earlier 226 emulator assertions and two-role classroom browser results provide complementary coverage. This is not hosted acceptance or proof that the secured assessment backend is ready.

Remaining release gates:

- Secured backend architecture/transport acceptance, concurrency and recovery evidence. Current Workers REST transport remains NO-GO and Blaze stays on hold.
- Actual verification/password-reset delivery and link redemption in the intended authorized environment.
- Exact deployment-candidate approval and hosted checks after infrastructure decisions; no deployment is authorized by this report.
- Final study/implementation documentation reconciliation and scoped participant evaluation (functionality, usability, satisfaction and acceptance), without invented long-term superiority requirements.

Admin scope stays accounts, teacher verification and platform oversight. No content-authoring/publication role or public admin signup is introduced.
