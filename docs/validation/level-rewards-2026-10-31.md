# Explorer level rewards — 31 October 2026

Levels now unlock cosmetic rewards alongside the existing XP progression. Mission artifacts and chapter badges retain their existing educational/completion purpose. No assessment, learning prerequisite, XP award or progression formula changed.

| Saved level | Automatic title | Available frame |
| --- | --- | --- |
| 1 | History Scout | Classic Explorer |
| 3 | Clue Detective | Bamboo Explorer |
| 5 | Heritage Explorer | Golden Sun |
| 10 | History Guardian | History Guardian |

Intermediate levels build toward the next milestone. Above Level 10, the current catalog is fully unlocked and level growth continues; no invented future reward is promised. Milestones are implemented in `js/level-reward-policy.js`, with matching server gates in `firestore.rules`.

## Student experience

- Home shows the current explorer title and next title/frame milestone beside the existing XP bar, linking to My Profile.
- My Profile has a Level Rewards collection showing earned and locked titles/frames. Titles advance automatically; students choose their equipped frame. Existing students receive the cosmetics appropriate to their saved level.
- Frame preferences are stored in the account's `studentCosmetics/{uid}` document and appear around the existing avatar across student pages. The avatar itself is unchanged. Classic Explorer removes the extra frame.
- A nonmodal, dismissible celebration announces a level increase and newly unlocked milestones. It does not replay for initial sign-in or every page visit. The cross-page baseline is tab-local; when session storage is unavailable, within-page increases still work. Reduced-motion preferences disable the entrance animation.
- Pending/failed saves are explicit. A failed write keeps the last confirmed frame. Frame selection remains keyboard accessible through save/re-render; account changes discard old replies and styles. Unavailable data offers retry on the reward collection.

## Security and verification

- Full local baseline after feature integration: **304 unit checks in 48 suites and all 14 mocked browser fixtures pass**. Final keyboard-focus polish was followed by the expanded real-Chrome fixture, with all eight exact 390px/1440px page scenarios passing. The fixture now loads each page's complete real stylesheet order.
- Browser checks cover milestone boundaries, a multi-level jump, next-reward routing, equipped frame display, a failed save, account restoration, pending saves, stale callbacks and sign-out/account switching. Mobile collection appearance was visually inspected. Physical-phone acceptance remains separate.
- **52 synthetic server Rules API cases pass.** Owner-only get/create/update, exact preference fields and server-time writes are enforced. Future/unknown frames, other-account reads/writes and XP fields in preferences are denied.
- The cosmetic rule was compared against live rules, with no changes outside its new block. The previous release was backed up; publication and exact readback succeeded. See [comparison](level-reward-rules-comparison-2026-10-31.json) and [publication](level-reward-rules-publication-2026-10-31.json).
- `tests/level-rewards-live.cjs` passed real owner read/write, classic-frame saving, earned Golden Sun saving/readback, and locked-frame, cross-account and XP-field denials. It used two temporary accounts; the Level 5 boundary was prepared only in a temporary fixture profile, not claimed as an actual mission-earned level. Both Auth accounts, profiles and the cosmetic record were removed.
- Nine boundary/header/local-server checks pass. The final package is `build/student-web-usNYxt/public`: 25 pages, 520 hash-verified files, zero missing/rejected references. Website Hosting was not deployed. The narrowly scoped cosmetic rule was the only live configuration change.

No paid API, speech generation, lesson publication, historical content or real learner record was changed. The existing browser-grading trust limitation still applies; cosmetic gating is not a claim of cheatproof grading.
