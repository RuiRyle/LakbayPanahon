# Teacher Applications workflow clarity

10 November 2026. Local implementation of the approved queue and next-action improvements.

## Resulting workflow

- Awaiting Submission: pending teacher profiles with no application or a draft. This reads a bounded account page and checks only those profiles' application records. Submitted, returned, approved and declined forms are excluded.
- Needs Review: submitted application records only. This is the default actionable view.
- For Revision: applications with needs_changes status.
- Reviewed: approved and declined applications. Activation remains a separate account decision.

Search and the selected-category count remain page-scoped. Awaiting Submission scans up to 25 profiles per page; a page may contain no matching applications while more profiles remain. Its scope note and empty-state message explain using Next. Failed counterpart reads fail closed instead of treating the application as missing. Authorization/session checks remain mandatory. Available profile name/email fills gaps in historical application identity fields.

The new read-only list refresh preserves the selected teacher and reloads current details. Empty categories no longer offer a meaningless Clear search control. Names, email and scope text are more readable, and four categories use a compact two-row control.

Choosing Approve, Request changes or Decline opens a correspondingly labeled checks/reason section. The final button reads Review & confirm decision and retains the existing confirmation, permissions, transaction, audit and uncertain-save handling. Success messages explain the actual outcome. Next: activate account access appears only for an approved revision matching the profile's saved verified revision and non-active account. Other states offer View account details.

## Files and validation

Implementation: `js/admin-accounts.js`, `js/admin-workspace.js`, `js/teacher-review-panel.js`, `css/admin-workspace.css`. Coverage: `tests/admin-overview.test.cjs`, `tests/admin-workspace-browser.cjs`.

240 synthetic desktop/mobile browser checks, 42 separate-page/compass checks and 15 focused data/recovery/rules tests passed. Coverage includes all four populated categories, scanned empty-page pagination, independent scrolling, name/email search, identity fallback, refresh selection, permissions, stale/duplicate decisions, save recovery and activation separation. The browser fixture was corrected to implement Firestore in filters and remove a teacher-form record incorrectly inherited by its administrator fixture. Initial new-category assertions failed against that fixture; the final runs passed.

Local build passed: 37 pages, 607 files, zero missing/rejected references. Scoped whitespace checks and accepted Stage 0 validation passed; protocol remains disabled. Submitted/awaiting screenshots in `admin-application-final/` were refreshed at 1170, 1380, 900 and 390px without viewport overflow.

Browser fixtures use mocked Firebase; no fresh live-emulator security acceptance is claimed. No production records, rules, credentials, billing, deployment, grading, rewards or student progress were changed in this pass.
