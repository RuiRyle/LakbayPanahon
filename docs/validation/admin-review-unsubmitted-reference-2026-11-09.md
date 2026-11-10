# Reference layout for submitted and unsubmitted teacher reviews

9 November 2026. The user's actual screenshot exposed the missing-application early-return path: it rendered plain identity text and a large empty recorded-decisions section instead of the reference cards.

The same structured right-side layout now renders whether or not a qualification application exists: heading/status, applicant identity, qualifications, summary, documents and review-history cards. Missing applications show Not Submitted, actual profile identity, Not provided qualification values and an explicit next step. No submission timestamp, credential, evidence or approval eligibility is fabricated. No qualification decision form is mounted without an actual submitted application.

Full recorded decisions are initially hidden in Teacher Applications and revealed through the existing View complete history control. They remain available by default in Accounts. The existing account-access action remains separate. Header artwork now renders for every application state. Left-panel layout, Firestore queries, review transactions and security policy are unchanged.

Files changed: `js/teacher-review-panel.js`, `js/admin-workspace.js`, `css/admin-workspace.css`, `tests/admin-workspace-browser.cjs`.

Validation: 224 synthetic browser checks, 42 page/compass navigation checks, 15 focused data/recovery/rules tests and the local web release build passed. Stage 0 remained valid with protocol disabled. Browser fixtures use mocked Firebase; no new live-emulator security acceptance is claimed.

Reference-size screenshots: `admin-application-final/applications-1170.png` (submitted) and `admin-application-final/unsubmitted-1170.png` (missing submission). Both states were also captured at 1380, 900 and 390px widths. No viewport overflow reported.

No deployment, billing activation, production access or student/assessment/reward changes occurred.
