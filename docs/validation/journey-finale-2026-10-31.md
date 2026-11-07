# Journey Finale — 31 October 2026

The required learning journey now ends with a three-step Bayani celebration, a recap of saved chapter/mission accomplishments, an optional reflection, and a downloadable PNG completion card. The separate **Philippine History Explorer / Journey Complete** badge recognizes finishing the selected journey. It is derived from existing progress, not a new reward transaction. Replaying the ending adds no XP, artifacts, badges or mission completions.

## Entry and meaning

- The last configured chapter challenge offers **Open Journey Finale** after saved completion.
- My Journey and Achievements offer a persistent finish-line link. The shared completed-journey panel offers **Celebrate My Journey**.
- Direct links never bypass eligibility. Missing progress displays remaining chapter/mission counts and Continue My Journey. Failed reads display Refresh Progress rather than treating unknown progress as zero or completed.
- Artifacts recall mission discoveries; chapter badges mark challenge milestones; levels unlock titles/frames; the finale badge marks completing the selected journey. The ending links back to the museum, review and historical timeline.

## Saved completion contract

`learningSettings/journeyFinale` freezes version `philippine-history-journey-v1`: **16 chapters and 66 missions**, including the required prologue/prerequisites, ending at `chapter-15`. Preparation checked the active curriculum and one active final challenge per chapter. This definition was created once and read back. Future curriculum expansion needs an explicit new-version/migration decision rather than silently overwriting the finish line.

Eligibility requires fresh server reads of the signed-in active student's required completed chapters and missions. Mission evidence must match its configured chapter. Preview exploration, high XP, cosmetics, optional practice, collection counts and reflection cannot unlock the ending. The completion date uses the latest saved required chapter timestamp; a missing timestamp produces an unavailable-date label, not a fabricated date.

This inherits the existing browser-graded assessment/progress trust limitations. It is not a new trusted grading backend, a claim of full national curriculum mastery, or an official school certificate.

## Local keepsake and reflection

The optional, ungraded reflection saves only after an explicit click, scoped to UID and definition ID in this browser. It can be cleared. The explorer name is transient. Canvas creates the PNG locally; neither reflection nor name is sent to an AI provider. Closing narration uses existing device narration and preferences, with no autoplay or paid speech generation. Reduced-motion preferences disable the celebration entrance animation.

## Verification

- Nine policy/client unit tests cover complete/missing/foreign evidence, matching mission chapters, frozen optional scope, timestamp fallback, invalid configuration, fresh owner-scoped reads, optional collection failure and account changes.
- Isolated Chrome fixtures exercise locked/complete states, narration start/stop, reflection Save/Clear, PNG generation (download click intercepted), safe name text, replay, read recovery and late results after sign-out. Real page CSS is checked at exact 390px and 1440px widths with no horizontal overflow. These full-completion scenarios use synthetic data, not a real student's earned ending.
- The chapter continuation fixture checks the final-chapter route without reward resubmission. My Journey now has one next-action section; a duplicated section and duplicated IDs were removed.
- The published rules pass 56 synthetic server-rule cases. A guarded comparison confirmed no changes outside the new exact-document read rule. Backups and exact publication readback are recorded in `journey-finale-rules-publication-2026-10-31.json`.
- The bounded live check confirms active-student reads, owner-filtered progress queries, a fresh student's locked state, denied student edits, and denied anonymous reads. Its temporary Auth account/profile were removed. No completions were seeded and no real learner progress/rewards changed. See `journey-finale-live-2026-10-31.json` and the definition readback report.

Website changes are packaged locally, not deployed to hosting. Automated checks do not replace a Grade 5 comprehension/usability study or teacher/history content review.

Final local acceptance: **314 checks across 50 unit suites, zero failures/skips; all 14 browser fixtures passed**, including 18 exact-width captures in the expanded features fixture. The separate chapter-continuation fixture also passed. Fresh staging contains **26 pages and 528 hash-verified files**, with no missing/rejected references, at `build/student-web-Z04Cgd/public`. Phone/desktop keepsake previews using synthetic completion data are saved under `build/journey-finale-review/`.
