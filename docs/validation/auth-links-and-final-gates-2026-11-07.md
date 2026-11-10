# Auth link behavior and remaining release gates

7 November 2026, Asia/Manila. Local Auth emulator only; no real email, production identity, deployment, credential or billing change.

`node tests/auth-links-emulator.cjs` passed 8 checks: starts unverified, applies generated verification code, fresh lookup sees verified state, validates reset code, changes password, rejects old password, accepts replacement password and rejects reused reset code. One unique synthetic identity was deleted successfully. [Result JSON](auth-links-emulator-2026-11-07.json).

The harness uses emulator-only out-of-band-code retrieval and Auth REST redemption. It does not test SMTP/inbox delivery, spam filtering, hosted Firebase action pages, continue URLs, expired links, revocation of every existing session or institutional browser restrictions. No raw codes, passwords or tokens are written to the report. The test deliberately does not print the emulator code list, which can include other local sessions.

## What remains to complete deployment readiness

1. **Backend acceptance:** current Workers transport remains NO-GO. Do not deploy its fixture trust or silently increase retry limits/remove security. A supported backend/credential/budget decision must precede its next implementation or hosted acceptance. Existing infrastructure evidence is retained; no billing decision was made by these workflow requests.
2. **Real Auth email acceptance:** on an explicitly authorized intended environment and disposable account, request verification/reset through the UI; confirm correct recipient/domain, redeem once, reload the teacher's verification state, reset then sign in, and verify reused/invalid links have safe recovery. Record actual outcome. No credentials or codes belong in screenshots/reports.
3. **Final release candidate:** choose the exact reviewed package and compare production configuration/rules before an authorized release. The passing local package is not automatically the live site or the running earlier emulator preview.
4. **Study evaluation/documentation:** reconcile actual implemented technologies/features with the supplied revised study and complete the intended functionality/usability/acceptance evaluation. Do not turn optional business-model ideas or long-term learning studies into additional implementation requirements.

Local admin and cross-role workflow work now has component, Rules and fixed-package browser evidence. Remaining infrastructure and external-validation gates should not be disguised as missing dashboard features. Admin remains sign-in-only; students learn independently; classrooms are optional; neither teachers nor admins manage core instructional content.
