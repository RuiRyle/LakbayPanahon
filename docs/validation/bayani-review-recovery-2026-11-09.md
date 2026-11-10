# Bayani lesson-source recovery improvement

9 November 2026. Local-only improvement; no hosting, live AI, Firebase data mutation or billing change.

Confirmed usability gap: a failed source-lesson read on AI review practice required leaving the page and reopening the topic. The review now provides a native keyboard-accessible **Retry lesson** button. During retry it hides/disables recovery controls and keeps question generation disabled until the source is ready. Duplicate clicks cannot start another retry. Account changes and page exit discard stale results and errors.

Files: `pages/bayani-ai.html`, `js/bayani-review.js`, `tests/bayani-review-recovery.test.cjs`.

Validation under Node 22.23.4:

- New recovery suite: 3/3 passed, covering failure/retry/success, rapid duplicate retry, account changes and page exit with pending reads. These use mocked SDK/DOM fixtures, not a live Firebase browser.
- Existing review parser/prompt suite: 3/3 passed.
- Existing request/deadline/error suite: 6/6 passed.
- Existing isolated headless Chrome chat regression passed: deadlines, draft recovery, new-chat behavior, session isolation and safe message rendering. This browser suite covers chat rather than the new review-source retry path.
- Accepted Stage 0 integrity validator and scoped whitespace check passed.

No educational content, grading, XP, badges, rewards, server permissions or approved overall design changed. Live AI quality remains unverified. This improvement and its tests remain local; no push or deployment was performed.

## Browser follow-up

The new `tests/bayani-review-recovery-browser.cjs` now exercises the actual review module and page markup with mocked SDK calls in Chrome at exactly 1440, 900 and 390 CSS pixels. All three widths passed failure recovery, in-place retry, rapid-click protection, successful readiness, visible source link, keyboard focus and horizontal containment. Successful retry now moves focus to Generate a Review Question when the retry button disappears.

Initial screenshot inspection found the fixture omitted some real page styles and Chrome's command-line window size did not reliably represent the narrow viewport. The harness was corrected to include every page stylesheet and use CDP viewport emulation; all three cases were rerun successfully. The final mobile screenshot was visually inspected. This was a test-fixture correction, not evidence requiring another layout redesign.

Result: `bayani-review-recovery-browser-2026-11-09.json`. Screenshots: `build/bayani-review-recovery-browser/review-1440.png`, `review-900.png` and `review-390.png`. Generated browser profiles and images remain ignored local build output. The existing three recovery tests and accepted candidate validator also passed after the focus change. No live AI/Firebase calls were made by this browser fixture.

## Practice-feedback follow-up

Checking a generated practice answer now moves keyboard focus to its explanation instead of leaving focus on a disabled button. An explicit answered-state guard prevents repeated/programmatic answer actions from replacing checked feedback. Option handlers are bound to their issued question; clearing a question or changing accounts also removes old option elements. This hardens UI state, not authoritative scoring: AI practice remains optional and awards no XP.

Final verification: recovery suite 4/4, review-parser suite 3/3, and the extended actual Chrome fixture passed at 1440/900/390 pixels. Browser coverage now includes a synthetic generated question, selecting/checking an answer, disabled answered controls and explanation focus. Provider calls and generated content are mocked; no live AI quality is claimed. Screenshots in the same local build directory now show the checked practice state.
