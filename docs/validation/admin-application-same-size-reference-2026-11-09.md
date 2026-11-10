# Same-size Teacher Applications reference comparison

9 November 2026. Corrected the remaining geometry against the supplied 1170 × 760 screenshot rather than judging only a larger viewport.

The application page now uses a 208px desktop sidebar, 264px applicant panel, 12px panel gutter and 66px header. The applicant panel has a 578px desktop height with internal scrolling for larger queues. Identity/status, qualification/document and summary/history cards have tighter spacing and typography, followed by the three decision buttons. Sidebar labels and badges fit without horizontal scrolling. Responsive layouts remain stacked below the existing small-screen breakpoint.

Repeated name/email rows were removed from Qualification Details; both remain visible in the applicant identity card. Checklist labels were shortened without changing their availability checks. Missing fields/documents remain explicitly unavailable; no reference-only data was fabricated. Required verification, confirmation, pending-teacher visibility and separate account activation remain intact.

Changed: `css/admin-workspace.css`, `js/admin-workspace.js`, `js/teacher-review-panel.js`, and the first-qualification-field expectation in `tests/admin-workspace-browser.cjs`.

194 synthetic browser regression checks and the local release build passed. Captures at 1170 × 760, 1380px, 900px and 390px are in `admin-application-final/`; no horizontal viewport overflow was reported. The 1170px screenshot is the direct geometry comparison. These browser fixtures use mocked Firebase and do not replace emulator security acceptance. Nothing deployed; production and billing untouched.
