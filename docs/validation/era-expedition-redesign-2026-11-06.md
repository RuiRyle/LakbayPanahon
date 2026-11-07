# Selected-era expedition route

The selected Era Overview (`pages/era.html`) now has a compact header with the existing introduction, chapter completion count, percentage, progress meter and existing next-chapter route. The original exploration guidance remains available in a disclosure. The separate progress panel was moved intact into the header; its IDs and shared loader updates remain in use.

Chapter cards form a connected route with current/completed/locked milestones, retained descriptions and compact actions. Disabled chapter actions remain disabled. Existing prologue display labels, chapter order, chapter completion and unlocking calculations are unchanged. Optional mission meters query active missions and owner-filtered saved progress; failures do not change access or completion. Late results are checked against account and render version.

The existing discovery list is styled as educational tiles. Published objectives remain unchanged; where the original loader supplies chapter-title fallbacks, those are retained rather than invented objectives or relationships.

The artwork follows the atlas's consistent symbolic editorial SVG family. It is explicitly labelled symbolic and is not a historical reconstruction. Historically reviewed narrative scenes are still required as documented in `assets/atlas/README.md`.

Only the selected-era HTML, its new scoped CSS/module, and a page-gated rendering event in shared chapters.js changed for this task. Main Explore Chapters, Dashboard, grading, XP, authentication, database rules and chapter content were not redesigned or changed.

Validation: 16 selected-era browser assertions at each of 1920, 1440, 768 and 390px (64), covering integrated percentage, completed/current/locked states, mission evidence, review/continue routes, objectives and overflow. Existing era overview access/recovery/sign-out browser regression passed. All 16 shared journey/era/shell tests passed. Desktop and mobile screenshots inspected. Fixtures use synthetic chapter/progress data; no real-account SDK walkthrough or production change is claimed.

Package `build/student-web-uXRB7h/public`: 33 pages, 592 files, no missing/rejected references. Not deployed. No reference screenshots were attached, so direct reference comparison is unavailable.

Repeat: `node tests/era-expedition-browser.cjs`, `node tests/era-overview-browser.cjs`, and `node --test tests/era-progression.test.cjs tests/journey-path.test.cjs tests/student-shell-route.test.cjs`.
