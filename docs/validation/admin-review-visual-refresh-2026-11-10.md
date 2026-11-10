# Teacher Applications visual refresh

10 November 2026. Focused visual treatment of the existing administrator review workspace after feedback that it felt flat and cluttered.

Added decorative applicant initials to selectable list cards, stronger gold selection, warmer identity avatars, a restrained gold-lit review heading, more distinct surface hierarchy, coordinated borders/shadows and clearer status-chip colors. Information sections retain consistent gold vector icons and alignment. The page uses short fades and restrained pointer feedback; system reduced-motion and the application's reduced-motion class disable these effects.

Moved the Back control into the stable topbar rather than an animated review ancestor. Clearing selection removes it. Its existing leave-page/save protections remain. Mobile now uses a non-overlapping menu/title/Back layout and removes empty legacy heading space. Screenshot review also prompted tighter vertical spacing so the primary decision row remains visible at the reference size.

Implementation files changed: `css/admin-workspace.css`, `js/admin-workspace.js`. No Firestore queries, permissions, review transactions, grading, progress or rewards changed.

Validation: 240 synthetic browser checks, 42 navigation/compass checks, 15 focused data/recovery/rules tests and the local build passed. Build: 37 pages, 607 files, zero missing/rejected references. Accepted Stage 0 validation passed with protocol disabled. Scoped whitespace checks passed.

Submitted/awaiting screenshots refreshed at reference size 1170 × 760, plus 1380, 900 and 390px widths in `admin-application-final/`. Capture checks found no viewport overflow and verified that reduced-motion media disables panel animations. Browser fixtures use mocked Firebase, not a fresh live-emulator security acceptance run. No production access, billing activation or deployment occurred.
