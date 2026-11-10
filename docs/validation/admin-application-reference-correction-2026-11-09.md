# Teacher Applications reference correction

The previous refinement retained oversized page framing and placed action choices below the verification form. This pass corrects those visible differences with the supplied reference.

- Removed the repeated main-page introduction; retained the shared topbar title.
- Set a narrow 264px desktop applicant panel beside a wider application review panel, with compact status tabs, rows and search disclosure.
- Kept qualifications/documents on the left and summary/history on the right within the review panel; reduced panel and row spacing.
- Moved Approve, Request Changes and Decline choices directly below application information, before the required verification and reason fields. Choosing an action still only selects the proposed decision; the existing save handler and confirmation remain mandatory. Focus reveals the reason field when choosing an action.
- Retained tablet list/detail columns and mobile stacking, existing evidence access, permissions, audit and recovery behavior. No mockup-only qualifications were added.

Files changed in this pass: `css/admin-workspace.css`, `js/teacher-review-panel.js`.

Validation: 188 synthetic browser checks passed, local build passed (37 pages, 607 files, zero missing/rejected references), and accepted Stage 0 validation passed. Screenshots refreshed in `admin-application-final/` at 1380, 900 and 390px. Browser fixtures use mocked Firebase; no fresh emulator security acceptance is claimed. No production access, deployment or billing changes.
