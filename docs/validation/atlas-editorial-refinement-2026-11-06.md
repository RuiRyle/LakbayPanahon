# Explore Chapters editorial refinement

Refined the existing atlas implementation. No changes to historical descriptions, chapter order, authentication, database integration, XP, completion requirements or access checks.

Cards now use a two-column shared-row layout on desktop/tablet and one column on mobile. Removed poster-like minimum heights, reduced illustrations to 132px, and aligned headings, descriptions, requirement notes, progress meters and action buttons. Destination labels sit in HTML above titles, outside illustrations.

Replaced inconsistent scene/slide/diagram decorations with four optimized text-free symbolic SVG objects using one navy/gold/teal editorial treatment. They are explicitly labelled symbolic. The required future historically reviewed narrative illustrations are listed in `assets/atlas/README.md`; no historical reconstruction is claimed.

The expedition navigation has visible inter-destination gold connectors, a filled current milestone, teal completed state, muted locked state, keyboard focus and retained preview behavior. Hover effects remain restrained; reduced-motion rules disable animations. Preview dialogue retains its native modal behavior and published curriculum information.

Verification: 21 browser assertions at each of 1920, 1440 and 768px; 18 at 390px (81 total). Covers aligned actions/heights, compactness, nonoverlapping labels, consistent assets, original descriptions, owned chapter completion, Revisit route, locked preview, navigation and overflow. Existing era overview browser regression passed. All 16 shared era progression, journey path and shell-routing tests passed. Screenshots inspected at desktop and mobile widths. Tests use synthetic local browser data; no production or real-account walkthrough is claimed.

Run `node tests/expedition-atlas-browser.cjs` and `node tests/era-overview-browser.cjs` to repeat. Nothing deployed.
