# Explore Chapters expedition atlas

Existing era/chapter loader, authentication, routes, completion requirements, XP and achievements remain unchanged. A separate display module adds saved chapter-progress summaries, destination selection and a native keyboard-accessible locked-era preview dialog. It queries owned chapter results and reuses cached instructional catalogs. Load failures retain the original destination controls.

The compact banner retains the journey action and moves the existing refresh button to a utility row. Destination cards use responsive four/two/one-column layouts, matching heights and bottom-aligned actions. Native focus indicators and reduced-motion behavior are retained.

Local artwork: existing maritime scene for Precolonial Philippines, authored encounter diagram for exploration, archive illustration for colonial social/economic change, and authored reform-document illustration for national consciousness. The archive fallback is explicitly symbolic; a dedicated era illustration can replace it later. No new historical facts or objectives are authored: previews display existing descriptions, chapter titles, learningObjectives when present and requiredChapterIds/unlockMessage. Locked previews contain no lesson links.

Validation: 11 browser assertions at 1920, 1440 and 768 pixels and 10 at 390 pixels, covering destination order/count, locked preview, safe navigation, actual zero progress, current-era highlight, equal card heights and horizontal overflow. Existing era-overview browser suite passed access, progress, retry and sign-out checks. Screenshots inspected and saved as expedition-atlas-desktop/mobile-2026-11-06.png. These are synthetic browser fixtures, not a production or actual Firebase SDK walkthrough.

Final staged package: build/student-web-Vtbcca/public; 33 pages, 585 files, zero missing/rejected references. Nothing deployed. The supplied attachment contains no screenshot, so exact reference comparison remains unavailable.

Repeat: `node tests/expedition-atlas-browser.cjs` and `node tests/era-overview-browser.cjs`.
