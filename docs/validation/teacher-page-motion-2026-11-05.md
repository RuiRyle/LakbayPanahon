# Teacher dashboard and My Classes motion — 5 November 2026

Added coordinated, page-scoped motion using existing teacher assets and modules:

- Intersection-based entrances for overview hero, metrics, work panels and classroom cards: 480ms, with at most 260ms stagger delay. Each element enters once per render.
- Short finite decorative effects: a 3.6-second hero light wash, 3.2-second class-header compass settle and 1.1-second selected-class gold ring.
- Hover lift, emblem/icon movement, timeline-dot feedback and a small directional arrow on follow-up links. Hover effects use hover-capable media conditions.
- A short reveal when invitation, create-class and edit forms open; press feedback on primary controls.

No continuously looping decorative motion or fabricated number animations were added. Motion never gates data loading or actions. System reduced-motion preference and the existing lakbay-reduce-motion class suppress motion; active scripted animations cancel when the preference changes. The observers and animations are disconnected/cancelled on page exit; removed elements are unobserved. Unsupported animation APIs leave content available without scripted effects.

Verification: `node tests/teacher-overview-browser.cjs` passes 16 actual local browser checks. Added checks observe real scripted entrances, their duration/stagger bounds, and a reduced-motion reload with zero scripted entrance starts and no decorative header animation. Existing overview, classroom controls and 390px layout checks remain passing. Disposable fixture records are removed; user-created classes remain intact.

The current local preview is updated without resetting emulator data. No database schema/rules changes or production deployment were performed.
