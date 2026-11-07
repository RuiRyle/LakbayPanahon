# Discovery Museum visual refinement

Changed only the Achievements body class, stylesheet link and new css/discovery-museum.css. Existing rewards, collection counts, authenticated reads, pins, exhibit rendering/content/tabs, modal focus/scroll handling and finale requirements remain unchanged.

Presentation: compact serif museum banner and framed trophy; clear collection selection; enlarged artifact symbol displays with subtle lighting and plinth shadows; aligned card actions; collectible badge medallions; compact commemorative finale panel. Reused actual artifact symbols through the existing renderer, without inventing or replacing artifact identities. No new frameworks, images or application JavaScript.

Exhibit dialogs now use intrinsic height, a desktop display-and-reading layout, mobile stacked layout and bounded scrolling for long text. Corrected a fixed-inset stretch that initially made dialogs fill the viewport. Removed decorative collection plus/minus icons that overlapped totals; accessible expanded state and existing toggle behavior remain intact.

Validation:
- tests/discovery-museum-browser.cjs: passed at 1440, 768 and 390px with actual markup/all linked CSS and modules, simulated owned badges/artifacts. Checked counts, both collection selectors and collapse, artifact gallery/actions, pin/unpin, multiple artifact identities, all exhibit views, centered viewport containment, focus return, background scroll restoration and sign-out cleanup.
- tests/student-collections-browser.cjs: passed existing animation, rapid-switching, reduced-motion, toggle, count and independent-recovery checks.
- Inspected Chrome gallery/exhibit screenshots at desktop/mobile sizes and extra banner/badge views; corrected empty dialog space and overlapping summary ornament.
- These are browser fixtures with simulated collections, not live student-account verification. No Firebase writes or deployment performed.
- Final local package build/student-web-PtBqia/public: 33 pages, 598 files, zero missing/rejected references.
