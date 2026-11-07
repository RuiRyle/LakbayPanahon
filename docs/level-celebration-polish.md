# Explorer level celebration polish

Updated 6 November 2026. Local only; not deployed.

## Behavior

The existing saved-level banner now distinguishes new cosmetic unlocks from ordinary level increases. It names earned titles/frames and shows the actual next milestone. After all configured frames are unlocked, it explicitly says so rather than promising another reward.

A compact star, clear heading/copy and grouped actions make the banner easier to scan. The entrance runs once for 280 milliseconds using opacity and translation. It does not repeat, play sound, take keyboard focus or interrupt the lesson. The student can dismiss it; it does not vanish on a timer while someone is reading or using its controls.

Cached snapshots do not trigger a new celebration. Local pending writes are still ignored. The existing per-account session baseline prevents first-load historical celebrations and repeated same-level announcements. A server-confirmed level increase can announce multiple newly crossed cosmetic milestones. This uses the existing saved level; it does not verify quiz grading or infer understanding from XP.

System reduced-motion and the saved body preference suppress the animation. A live change to reduced motion cancels active banner animations. Page/account cleanup removes subscriptions, observers/listeners and current banners under the existing lifecycle.

No reward, XP, cosmetic ownership, lesson access or grade calculation changes. No extra database reads or writes.

## Validation

- level-rewards.test.cjs: two policy tests for milestone boundaries and frame validity.
- level-celebration-browser.cjs: 14 assertions at each of 390px and 1280px using actual modules and mocked snapshots. Covers first-load suppression, pending/cache updates, unlock wording, duplicate announcements, focus, dismissal, later milestones, final reward wording, reduced motion, viewport fit and stale-account callbacks.
- Module syntax check passed. This is software validation, not proof that celebrations improve motivation or learning; student usability review remains useful.
