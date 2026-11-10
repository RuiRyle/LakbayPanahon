# Clearer teacher onboarding and activation guidance

The existing teacher setup remains on one page. A prominent Your next step panel now shows one context-sensitive action: send/check verification, complete teaching details, check review status, wait for activation, or open the dashboard. The details action focuses the first missing required field. Registered names remain prefilled; the default school route still requires only name, institution and role. PRC/supervisor requirements remain route-specific, with optional supporting information collapsed.

Removed repeated verified-email instructions and the empty status sidebar for brand-new applications. Compacted the hero and form framing. Updated labels and operation-specific loading messages; email-refresh feedback now uses the refreshed verification result. Submitted and approved-but-inactive states explicitly explain that teachers do not need to submit again.

Dashboard readiness now reflects the same prerequisites as the existing guard: verified email, approved current revision, matching profile verification revision and active account. Progress does not mark administrator review complete while activation remains pending. No guard or server permission checks were weakened.

After qualification approval, the administrator sees Next: activate account access. It opens the same teacher in Accounts, preserving the separate activation confirmation, transaction and audit record. No automatic activation or fabricated verification was introduced.

Implementation files: `pages/teacher-application.html`, `js/teacher-application.js`, `css/teacher-application.css`, `js/admin-workspace.js`. Regression coverage updated in `tests/teacher-application-browser.cjs`, `tests/teacher-unified-setup-browser.cjs`, `tests/admin-workspace-browser.cjs`.

Validation: 58 teacher-application browser checks, 30 unified-registration browser checks, 228 administrator browser checks, and 31 policy/registration/data/recovery unit tests passed. Local build passed: 37 pages, 607 files, zero missing/rejected references. Accepted Stage 0 validation passed with protocol disabled. Scoped whitespace checks passed.

Synthetic screenshots at 1280 and 390px cover email verification, teaching details, review waiting, activation waiting and dashboard ready in `teacher-onboarding-clear/`. No horizontal viewport overflow was reported. Browser tests use mocked Firebase and do not replace live-emulator or hosted acceptance. No production account, application or security settings were changed in this implementation pass. No deployment or billing activation occurred.
