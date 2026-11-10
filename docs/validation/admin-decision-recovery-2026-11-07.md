# Admin decision save and recovery

7 November 2026 (Asia/Manila). Local implementation for account status and teacher qualification decisions, within the revised study's platform-administration role. No content management, deployment, billing, production requests or Workers changes.

## Behavior

- A confirmed transaction and a subsequent failed UI refresh are different outcomes. Both forms now retain a saved acknowledgement and offer refresh-only recovery rather than implying the decision failed.
- Transport errors (`unavailable`, deadline, unknown/internal/cancelled) trigger a fresh read of the exact generated audit/review record. Matching actor, target and decision fields confirm the request; the application path additionally matches its revision. No broad history scan or automatic write replay is used.
- If the record is absent, unreadable or mismatched, the outcome stays unconfirmed. Missing data is not proof of abort. The preserved form is locked and offers a manual read-only check; a later matching receipt confirms the commit.
- Ordinary validation/permission/stale-review failures retain their original error and form values. Existing transactional expected-version checks remain.
- Auth/session checks protect recovery reads, and page generation guards suppress stale refresh work across auth changes. No new Firestore schema or Rules permission was introduced.

## Evidence

- `admin-decision-recovery.test.cjs`: 6 tests passed for confirmed writes without extra reads, lost acknowledgement, absent/delayed receipts, unavailable verification, foreign/mismatched receipts and definite errors.
- `admin-accounts.test.cjs`: 3 passed.
- `admin-workspace-browser.cjs`: 35 checks at each of 390px/1280px passed (70 viewport assertions), using actual services/controllers with synthetic transaction/transport failures. Includes qualification-save refresh failure, lost moderation acknowledgement, delayed moderation commit, repeat-submit blocking, unchanged reason and refresh-only recovery without another write. [Browser evidence](admin-decision-recovery-2026-11-07.json).
- Syntax checks passed for the changed controllers/services. Local package reference audit passed with 33 pages/603 files and zero missing/rejected references before the final page-level qualification-message adjustment; the final controller browser/syntax rerun passed afterward.

## Limits

Pending recovery closures are held in the current page, not durable cross-reload operation storage. Reload/sign-out clears them; existing transactional stale-status/revision checks and audit history remain, but no cross-process/ambiguous-Google-commit certification is claimed. A missing record leaves recovery blocked; this intentionally does not provide a potentially unsafe resubmit shortcut. Provider/runtime errors outside the listed transport codes retain normal error handling. No hosted fault injection or browser-kill recovery test ran.

The running emulator website still uses its staged package until deliberately refreshed; these tests exercise current source. Secured assessment transport remains independently NO-GO. Next: teacher review interface polish and a scoped platform-activity overview, with no lesson/question editing or publication in admin.
