# Desktop acceptance follow-up — 30 October 2026

Local-only checks; Firebase, exploration preview, paid activation and deployed rules were untouched.

## Fixes

- Settings no longer promises automatic saving when browser storage cannot be read or written. Controls still apply for the current visit. The header badge, explanatory card and save note explain the limitation; a failed preference write does not break toggles, volumes or Reset. Only preference keys are written.
- Finishing a Daily Challenge focus interval now clears the stale paused-music message when returning to normal mode. An inactive player is offered Start music rather than falsely described as playing. Existing unsupported/autoplay-blocked feedback is preserved when no focus message needs replacing.
- My Journey's Explore Chapters hero link uses the existing primary-button treatment. Its navy text is now readable against gold. The Chrome fixture checks the computed foreground/background contrast rather than a specific hardcoded color.

## Evidence and scope

[Settings report](student-settings-local.json): seven Chrome cases pass at 1280/1440px desktop widths: defaults, restored preferences, denied storage reads, denied writes, refused audio playback, story-reading focus and quiz focus. Each exercises the real page markup/styles and full `page-transition.js` code with Firebase scripts removed. Tests cover switches/ARIA state and focusability, independent volume state and displayed values, reading/motion/contrast, reset/persistence, daily-focus transitions, error handling and horizontal layout. Actual audio is unavailable or deliberately refused in these fixtures. They do not judge melody quality, audible balance, real cross-page playback or physical keyboard activation. Restored initialization uses seeded browser preferences; it is not a live signed-in reload test.

Standard, extra-large and blocked-storage Settings screenshots were inspected. Independent long-title fixtures passed for Home guidance, Journey and collections, with extra-large reading size and no document-width overflow. Their screenshots were inspected for the rendered states; the corrected Journey hero button is readable, and long artifact names/descriptions wrap within their cards. The Home fixture renders journey guidance within real static Home markup/CSS; other Home sections retain fixture loading placeholders. This is not a fully populated Home walkthrough or a proof of every section/dialog state. Journey long chapter/mission strings were rendered with expanded trails and checked for horizontal overflow; the inspected viewport screenshot shows the hero/next-step area, not every offscreen trail row.

[Combined local report](student-acceptance-local.json): 281 unit checks across 43 suites pass. Twelve browser fixtures pass, including seven Settings scenarios. Story returned no browser result during the combined run; a separate unchanged `node tests/story-browser.cjs` rerun exited 0 and passed. The report retains that retry annotation. This was not a Story code fix or an unrecorded all-at-once pass.

Latest package: `build/student-web-eWRm3P/public`, 429 files hash-verified with zero missing/rejected static references. Sibling Hosting configuration/manifest remain outside public. No deployment occurred; previous package directories are older snapshots.

## Acceptance still open

Later same-day follow-up: [13 native-keyboard and actual reload checks now pass](student-settings-keyboard-reload-2026-10-30.md). This supersedes the keyboard/reload pending status below for the local Settings page; real listening and signed-in-shell continuity remain open.

A11 still needs real listening, actual keyboard activation/reload and continuity across the real signed-in shell. A02/A09/A16 still need a populated/hosted visual acceptance pass, real content/assets and intended Hosting header compatibility. Live saves/publication, normal locks after personal exploration, privacy arrangements and learning review remain the existing gates. This follow-up closes the demonstrated storage/message/contrast defects and expands local evidence; it does not mark the student workflow complete.
