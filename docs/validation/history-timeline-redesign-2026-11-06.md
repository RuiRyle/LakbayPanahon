# Historical Timeline redesign — 6 November 2026

Implemented locally in `pages/history-timeline.html`, `js/history-timeline-view.js`, `js/history-timeline.js`, and `css/history-timeline.css`.

The redesign keeps the existing student shell, authentication/profile header, Firestore catalog/progress queries, `buildJourneyPath`, chapter routes, all descriptions, mission lists, era ordering and chapter unlock rules. No grading, XP rewards, database schema, security rules or production data changed in this task.

## Presentation

- Expedition banner reuses the existing early-community lesson illustration, labelled as a lesson illustration.
- Connected vertical chapter trail with gold available milestones, teal completion states, locked states and reduced-motion support.
- Existing first-four-chapter lesson artwork is reused decoratively; introduction and other chapters have symbolic atlas/archive artwork rather than invented historical scenes. Valid authored HTTPS chapter artwork takes precedence, with local fallback on load errors.
- Each card displays its original chapter description and mission titles, owned mission completion, and its existing accessible chapter action. The introduction is labelled separately from numbered chapters.
- Era meters count saved chapter completion, not mission totals. A chapter with every mission completed still requires the existing chapter completion result.
- Learning highlights use published mission titles. No dates, history facts, earned badges or XP amounts are fabricated.
- XP and account controls reuse the existing shared student profile/header. No extra XP subscription was added.
- Era selection survives refresh and temporary loading failures, and resets when the account changes. Failed loads and sign-out clear stale timeline content.

## Verification

- 30 current-source browser assertions passed at each of 1440, 1024, 768, 390 and 320 pixels: content/order, encoded routes, locked/completed/available states, progress, chapter challenges, era filtering, retry, session isolation, safe text and larger-text overflow.
- Existing Timeline browser regression passed at 1440 and 390 pixels.
- 21 shared profile, progression, era and shell-routing tests passed.
- Actual app/Firebase SDK walkthrough passed 14 checks using isolated local emulator accounts, including zero XP from the saved profile, actual chapter progress, image loading, mobile header visibility and navigation through the persistent student shell. See `history-timeline-browser-2026-11-06.json`.
- Desktop and mobile screenshots were inspected: `history-timeline-1440-2026-11-06.png`, `history-timeline-390-2026-11-06.png` and corresponding `history-timeline-cards-*` captures.
- Fresh release package: `build/student-web-76MqfZ/public`, 33 pages and 578 files, zero missing or rejected references. Not deployed. Local test services were stopped afterward.

The reference screenshot was not attached in the conversation. Visual review therefore used the written brief and existing design conventions; matching a supplied reference remains unverified.

The full existing `student-missing-features-browser.cjs` run also encountered an unrelated mission-page fixture failure (`emitMissionGuide is not defined`) at desktop and mobile sizes. This is outside the Timeline change; the targeted Timeline suite and its dependent progression tests pass. The shared harness now accepts a page argument so the Timeline checks can be run independently.

## Repeat checks

```powershell
node tests/history-timeline-browser.cjs
node tests/student-missing-features-browser.cjs history-timeline.html
node --test tests/journey-path.test.cjs tests/era-progression.test.cjs tests/student-shell-route.test.cjs tests/student-profile.test.cjs
```

For the actual application walkthrough, start `node tools/start-local-emulator.cjs`, wait for its ready message, then run `node tests/history-timeline-emulator.cjs`. This uses only local synthetic accounts and does not certify production availability or historical image accuracy independently.
