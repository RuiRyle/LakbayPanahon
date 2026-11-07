# Student and teacher bug/design review - 6 November 2026

This is a focused code, responsive-browser and local-emulator review. It does not certify the absence of all bugs, validate learning outcomes or replace account-based production acceptance.

## Findings fixed locally

| Finding | Impact | Change |
| --- | --- | --- |
| A session on another topic advanced a diagnosed topic's display stage | Students could see practice in progress without having practised that topic | Derive that stage only from sessions containing the topic's question IDs. Preserve lesson-revisited when only another topic was practised. |
| Editing/closing a personal review scanned the whole class review history | Unnecessary database reads, latency and avoidable failure on a large history | Keep the revision-state guard for all review changes, but scan for duplicates only when publishing a round. |
| Personal-review reports fetched unrelated completion history | Additional studentProgress collection reads per recipient despite using quiz attempts for this report | Branch to targeted-review evidence before loading mission-completion history. Shared goal completion queries remain intact. |
| Every outcome repeated a full intervention timeline | Long, crowded review lists | Show the next teaching step directly and use a keyboard-accessible native details/summary for the optional timeline. Keep stage indicators and response/evidence links visible. |
| Outcome card presentation was embedded in the asynchronous paging loader | Harder to maintain layout and loading behavior independently | Extract renderReviewOutcomeCard in the existing controller; preserve page/context and account guards. |

The practice label now says Practice in progress, describing recorded activity rather than asserting that understanding is improving.

## Local validation

- adaptive-review-evidence-dates.test.cjs: seven checks, including cross-topic stage isolation.
- teacher-review-publication.test.cjs: ten checks, including avoided scans and retained publication duplicate checks.
- teacher-review-learning-stages.cjs: 17 assertions at each of 390px and 1440px, including avoided completion reads, collapsed timelines and visible next steps.
- student-review-browser.cjs: practice, recovery and lesson/quiz escape routes.
- student-classroom-hub-design.cjs and teacher-student-progress-design.cjs: responsive classroom/report regressions.
- student-navigation-browser.cjs: native/modified/dynamic navigation and Back/Forward.
- student-settings-keyboard-browser.cjs: keyboard controls and persisted preferences.
- teacher-publication-recovery.cjs: ambiguous/confirmed saves and failed refreshes.
- Release staging: build/student-web-mge53Y, 33 pages, 572 files, zero missing/rejected references.

## Architectural follow-up

The shared teacher-workspace controller is still large. Continue extracting cohesive rendering/policy responsibilities when changing those areas, using the existing independent pages and shared shell. A wholesale rewrite would add migration risk without proving a user benefit. Keep database access, derived evidence policies and presentation distinct; retain current on-demand loading and explicit refresh semantics.

Further review targets include larger-class load characteristics and actual content/explanation quality. The available browser/SDK tests do not establish dependable formal grading: existing browser-graded practice scores remain a documented trust limitation.

## Publication status

These fixes are local and staged. The site published earlier on 6 November remains the previous build. No production rules or learner records were changed by this review. There are no new database fields or rules in this patch.

Full updated SDK/emulator walkthrough also passed 42 checks at 2026-11-06T05:25:51.005Z, including current review creation, guidance, post-guidance comparison and closing/history behavior. The test uses synthetic saved scores and does not validate formal grading or learning effectiveness.
