# Administrator confirmation guard ? local validation

Fixed a duplicate-submission window in the account-access form while its asynchronous confirmation was pending. The handler now reserves the confirmation, releases it on cancellation, and rejects confirmation results after the session or selected account changes.

Validation: source syntax check passed; three focused handler tests passed in tests/admin-moderation-confirmation.test.cjs; shared dialog browser checks passed (OK/Cancel, Escape, safe text, focus, duplicate prevention and cleanup).

The combined teacher/admin browser fixtures have been updated for asynchronous navigation and current shared modules. They still fail and are not release acceptance: the teacher fixture stops at catalog preparation before a receiving class exists; admin checks still include timing-sensitive focus and moderation assertions. These remaining failures require investigation. No production data or deployment was changed. The running local server must be rebuilt to serve this source fix.
