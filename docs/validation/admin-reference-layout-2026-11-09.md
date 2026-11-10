# Admin reference layout

9 November 2026. Applied the supplied screenshot's navy/gold palette, compact header and left navigation to the admin workspace, using the existing student and teacher shell patterns as context. Inspected student classroom and teacher progress layouts as well as current dashboard markup. Student learning routes and teacher classroom workflows were not changed in this pass.

Admin navigation links to overview, accounts/reviews and environment information. Overview opens its disclosure but still requires explicit loading. Navigation preserves forms and unsaved decisions. Qualification review precedes account moderation. Styles load after shared teacher/application styles so admin overrides are predictable. Mobile navigation wraps above the workspace; desktop navigation uses a slim left rail.

Reference totals and green service-health indicators were not copied as real data. Current overview remains a bounded application/decision snapshot; no new global-count query or live health monitor was introduced. Environment text states these limits. No content authoring, student reward editing or new administrator privileges were added.

Final package: `build/student-web-kaXlsW`, 33 pages / 603 files, zero missing or rejected references. Existing admin real-module/mocked-database browser suite passed 41 assertions at each of 390px and 1280px. This is regression evidence, not owner visual acceptance. Local preview on port 4174 uses existing secured demo emulators without reseeding. No billing/deployment action occurred.

Cross-role visual follow-up: verify the owner's preferred density on the actual student learning screens and teacher class screens before changing their layout. The reference serves administrative work; it does not establish that every student lesson should use the same information density.
