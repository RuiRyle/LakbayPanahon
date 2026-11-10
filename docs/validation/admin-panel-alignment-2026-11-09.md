# Applicant and review panel alignment

9 November 2026. CSS-only finishing pass on the Teacher Applications directory to visually pair it with the existing review panel.

Matched outer borders, radii, background, shadow and internal padding; aligned panel tops and normalized the gap. The directory has a viewport-bounded desktop/tablet height and remains sticky below the header, with the applicant list scrolling inside it and pagination retained at the bottom. Mobile keeps natural panel heights and a bounded list. Gold selection and keyboard focus remain clear.

The first screenshot check showed full-height stretching pushed pagination below the viewport; that was corrected before completion. At the 1170 × 760 reference size, the directory footer and primary decision row now end at comparable heights. Expanding verification or history does not stretch the directory into an oversized list.

Changed implementation: `css/admin-workspace.css`. No query, application state, right-side markup or permission changes.

Validation: 224 synthetic browser checks, 42 separate-page navigation checks and local release build passed (37 pages, 607 files, zero missing/rejected references). Updated submitted/unsubmitted captures at 1170, 1380, 900 and 390px are in `admin-application-final/`. These use mocked Firebase; no live-emulator security acceptance is claimed. No deployment, production access or billing changes.
