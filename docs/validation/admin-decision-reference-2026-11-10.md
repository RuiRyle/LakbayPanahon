# Decision Records reference refinement — 10 November 2026

Changed `js/admin-decision-view.js`, `css/admin-decision-records.css`, and the mount options in `js/admin-workspace.js`. Added `tests/admin-decision-reference-browser.cjs`.

The archive follows the supplied reference: landscape banner, four scoped summaries with SVG icons, compact search/action/current-role/date filters, export, selected-row highlighting, paginated record list and saved-decision details with reason and full-history action. Authorized current profile reads (at most ten distinct account IDs from the existing snapshot) provide names, emails and current roles. Unavailable profiles retain account IDs; the page explicitly distinguishes current identity from saved audit data. Mount/session guards discard stale asynchronous identity results.

Summary cards remain Loaded records, Access activated, Access deactivated and Other reviews. The existing accountModeration snapshot does not establish every qualification outcome, so it must not be relabelled as approvals, declines or changes requested. Search/filters/export apply to the administrator-owned loaded snapshot (up to ten in document order), with five visible records per page. No global totals or invented actor names.

Passed: focused populated reference browser tests at 1440px, 900px and 390px (resolved profiles, email/role/date filters, selected details, history routing, CSV and viewport containment); existing decision-view browser tests at 1440px and 390px (pagination, safe text rendering, empty states and stale-session guards). Local build: 37 pages / 613 files, zero missing/rejected references.

Blocked wider integrity acceptance: `node functions/stage0-gcloud-plan.cjs --validate` reports **Accepted source changed: js/student-assessment-client.js**. This UI pass did not edit that file. It was left untouched; no claim is made that the overall Priority 3 candidate passes validation.

Screenshots: `admin-decision-reference/records-1440.png`, `records-900.png`, `records-390.png`. All screenshots use synthetic browser fixtures, not production or a newly completed emulator-security acceptance. No deployment, billing activation, real data or production changes. No emulator restart/reseed performed.
