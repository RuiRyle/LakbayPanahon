# Account onboarding and recovery review

7 November 2026, Asia/Manila. Local source/fixture checks and the existing emulator website only. No real account, production configuration, billing or deployment change.

## Results

| Check | Result and limit |
|---|---|
| Teacher registration unit suite | 10 passed after updating the mock document body and obsolete success-copy assertion. Preserves existing identity/profile, prevents duplicate creation, handles lost save acknowledgement and session changes. |
| Teacher application policy | 8 passed, including minimal school-affiliation route and independent review requirements. |
| Auth persistence/routing | 18 passed. Includes pending/stale approval, unavailable fresh profile and session races. |
| Protected-page guards | 30 passed for student/teacher/admin access and recovery conditions. |
| Unified registration browser | 12 assertions at each of 390px and 1280px passed; account creation, email step, minimal details, submission and approval stay on the same page. Rerun after auth-ui correction passed. |
| Teacher application browser | 23 assertions at each viewport passed; draft preservation, verification, submission/revision/approval, private evidence and sign-out. Mocked Firebase. |
| Login startup | 10 checks passed against `http://127.0.0.1:4173`, including blocked Firebase script recovery and legacy signup redirect. No sign-in performed. Initial invocation used the test's unavailable default preview address and timed out; rerunning against the confirmed emulator URL passed. |
| Password reset recovery | 3 new tests passed; syntax check passed. Request provider is mocked, so delivery is not verified. |

## Application correction

`js/auth-ui.js` previously disabled the password reset button but had no in-flight handler guard. A second programmatic/queued submission could issue another provider request while the first was unresolved. A form-scoped pending flag now rejects concurrent submissions and clears in `finally`, preserving explicit retry after success/failure. Empty email still makes no request; no automatic retry was added. This is local source only, not deployed or copied into the running staged website.

The legacy `teacher-registration-browser.cjs` fixture previously tried to find the retired standalone form in `teacher-register.html`, now a redirect. It now asserts the redirect/fallback link and invokes the actual unified setup suite. The registration unit mock now provides `document.body.dataset`, and its success-copy assertion matches the current wording while retaining profile/identity checks. No application access rule was relaxed to fix these tests.

## Remaining boundary

Actual email delivery, reset-link redemption, verification-link expiry and school browser/mail filtering remain unverified. Mocked verification cannot establish delivery. Final authenticated assessment integration and the held Workers transport remain separate blockers. This review does not certify all account settings or all admin privileges.
