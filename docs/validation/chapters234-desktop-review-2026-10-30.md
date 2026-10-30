# Chapters 2–4 desktop Story review — 30 October 2026

Local candidate content, mocked Auth/data, no Firebase or emulator. This is a desktop Story review and related regression check, not a whole-site or live lesson-to-retry acceptance.

## Confirmed fixes

- The Story heading inherited a 720px cap while the scene trail and reading card used a wider column. The navy-theme heading now uses the same 900px maximum and full available width. No heading, trail or reading-card bounds mismatch remains in the tested candidate scenes.
- Story scrolling previously respected only the device's reduced-motion preference. It now also respects the website's `lakbay-reduce-motion` preference and uses immediate scrolling when either is enabled.

No curriculum, answer keys, scores, rewards, progression locks or backend activation changed. The four help drafts remain unpublished. They are included only in the local candidate/fixtures; this review does not make them available from Firestore.

## Desktop evidence

The optional `--desktop-review=2`, `=3`, and `=4` modes of `tests/roadmap-story-browser.cjs` each render all **58 candidate scenes** from Chapters 2–4 with extra-large reading text. They check actual title/body content, horizontal overflow, aligned heading/trail/card bounds, authored help opening/closing and the website reduced-motion scroll behavior.

Each mode then renders the first mission opening from its selected chapter and loads its actual local scene image. Those three screenshots were inspected: long headings wrap, scene trails align with the reading card, image captions and lesson text remain readable. Chapter 4's modern teaching diagram retains its existing qualification as a teaching illustration. This is not historical/artwork approval.

- [Chapter 2 result and screenshot path](chapters234-desktop-2-local.json)
- [Chapter 3 result and screenshot path](chapters234-desktop-3-local.json)
- [Chapter 4 result and screenshot path](chapters234-desktop-4-local.json)

Assets are copied into isolated temporary fixture folders; the real curriculum image URLs are preserved. The first fixture attempt accidentally used a generic chapter identity, hiding the page behind the expected mission/chapter error. This was corrected and visible-page assertions were added before accepting the captures. A Chapter 4 image assertion also ran before the onload visibility update; it now waits for actual loaded/visible state and avoids lazy-loading ambiguity in the capture. No broken image asset or authorization bypass was inferred from these fixture problems.

Captures use reduced motion to obtain stable geometry. Programmatic scene selection exercises rendering and help, not completion of every scene activity. The viewport captures cover representative opening content, not every offscreen panel. The chapter subtitle/top profile remain fixture values; this is not real account-data display acceptance.

## Related verification

13 focused unit checks passed: Story routes, the four Chapter 2 help-draft scope/guard rules, and existing roadmap policy/progression/reward constraints. The core Story browser fixture passed interaction, topic-review/practice handoff, saved-state recovery, hostile-content checks and session isolation. The standard 40-scene Chapter 3/4 fixture also passed clue exploration, correct decisions, authored help and recovery at its existing narrow fixture size. Together with the three desktop captures, five browser scenarios passed. No new full 281-check regression run is claimed.

The website was rebuilt into `build/student-web-wGGfja/public`: 429 hash-verified files, 23 entry pages, zero missing/rejected static references. Sibling manifest/Hosting configuration remain outside public. Nothing deployed; older packages are snapshots predating these two fixes.

## Remaining acceptance

The existing quiz-result/review/practice/retry evidence is retained; those screens were not newly claimed as live or fully visually reviewed in this Story pass. Human learning review, actual audio listening/device output, remaining populated/hosted states, bounded Firebase save/security acceptance, guarded publication, privacy arrangements and normal-mode confirmation after personal exploration remain open. Preserve the fixed finish line rather than adding new mechanics.
