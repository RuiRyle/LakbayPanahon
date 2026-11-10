# Pending teacher application panel refinement

9 November 2026. Local implementation following the owner's pending-application reference.

Changed `js/admin-workspace.js` and `css/admin-workspace.css`: people icon and Pending Teacher Applications heading, View all with the loaded snapshot count in the header, compact gradient rows, decorative initials avatars, grouped name/email, gold Awaiting review badge and outlined Review action. Review has an applicant-specific accessible label and retains the existing queue-loading and secure review handler. Missing email is labelled unavailable rather than invented. No qualification or activation decision is automatic.

At desktop, avatar/identity/status/action form one row. At tablet/mobile the status sits below identity while Review remains reachable and at least 44px tall. Long identities wrap. The queue still previews at most five submitted applications; View all opens the existing full paginated queue. More-than-loaded counts retain the plus indicator. No backend query or privilege was added.

All **136 browser-fixture checks passed** at 390/1280px, including new identity/avatar, status semantics, accessible Review label and header-count assertions. Existing correct-applicant Review routing, qualification checks, confirmations, stale decisions and uncertain-save recovery still pass. Accepted Stage 0 validation passed. This is real-module Chrome with synthetic mocked Firestore, not a new live/emulator data acceptance run.

Screenshots use a dedicated two-applicant synthetic preview at exact 1380/900/390px. No actual personal data is represented. The screenshot fixture was separated from the interaction test after a focus-sensitive assertion prevented its demo seed from running in a standalone capture session; the interaction suite itself passed separately. Final captures have no horizontal page overflow.

- [Desktop](admin-pending-reference/overview-1380.png)
- [Tablet](admin-pending-reference/overview-900.png)
- [Mobile](admin-pending-reference/overview-390.png)

No production account/data, billing, deployment, accepted Priority 3 artifact, grading, XP, badges or student-progress change. No push performed. Visual acceptance remains the owner's decision.
