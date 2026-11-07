# Student workflow completion work — 31 October 2026

The product remains a complete student web system for a potential buyer. No functionality was downgraded to a demonstration. Buyer, school and operator details remain undecided. This report distinguishes implemented behavior from outstanding release acceptance.

## Changes and checks

- `pages/student-shell.html` and `js/student-shell.js`: an initial frame load that stalls for 20 seconds offers Try Again and Go to Home. Frame errors expose the same controls. Retry preserves the supported mission route, resets the timeout and rejects external destinations. Successful loading clears the timeout and dismisses the overlay. No learner record is cleared by the recovery controls.
- Added two meaningful recovery tests and included the shell sources/tests in the fixed student acceptance plan. All 298 unit checks in 46 suites and all 13 mocked browser fixtures pass. Settings now has a bounded 90-second allowance because its seven-scenario run previously exceeded 40 seconds; assertions are unchanged.
- Updated the populated visual fixture to scroll to the current Story content rather than the removed reading toolbar. All 22 captures pass at exact 390px/1440px widths. These include one teacher dashboard pair; the remaining 20 cover the homepage and student screens. Desktop Home and mobile Discovery Wall captures were visually inspected. Simulated data and authentication do not establish hosted acceptance.
- Chapter continuation browser fixture passes scoped reads, pending-action protection, visible recovery without reward resubmission, next-chapter routing and session recovery.
- Local candidate inventory passes 66 missions, 388 scenes and 330 topics with zero missing images, structural topic gaps or scene-interaction issues. This is structural evidence, not approval of historical accuracy or learner comprehension.
- Rebuilt and hash-verified `build/student-web-z8vN19/public`: 24 pages, 510 files, zero missing/rejected references. Nine boundary/header/local-server tests pass. Staged Chrome verifies the 404 page, CSP blocking/control and private-file exclusion. Nothing was deployed.

## Student route coverage

The fixed browser suite covers registration and profile recovery; dashboard and My Journey; lesson interactions and completion; quiz failure/retry/pass and reward saving; draft/storage/session recovery; targeted practice; collections; profile editing; My Class join/leave/assignments; Settings; optional AI error handling; and browser navigation. Chapter continuation is checked separately above.

The [previous real-account walkthrough](student-capstone-flow-live-2026-10-31.json) verifies the first prologue lesson, actual refresh, failure/review/practice/retry, saved rewards and next destination, and network disconnect/reconnect. Its account and nine owned records were removed. It was not repeated for the shell-only change, and it does not prove every chapter or hosted deployment works.

## Work still required before claiming full release acceptance

- Independent teacher/history review and intended-learner comprehension testing, including the previously recorded partial-depth curriculum areas.
- Physical-device playback/listening and intended hosted Auth/App Check/assets acceptance. No public deployment is claimed.
- Remaining recorded narration: 47 of 1,294 planned passages are saved; all 35 playground passages are included. Other lesson passages use device speech. Further ElevenLabs generation remains quota-dependent.
- Current optional AI response and audience-suitability acceptance. The interface's mocked recovery tests do not prove provider availability or suitability.
- Browser scoring remains the active implementation; the prepared stronger grading backend is inactive. Do not claim server-verified grades.
- Buyer/operator/contact/retention arrangements before public rollout, and teacher-created class integration when that workflow is ready.
- The user's exploration preview remains unchanged. Normal locks were checked in the isolated earlier live browser; switching the user's current preview requires their decision.

These outstanding items are not silently marked complete by automated checks. Run the current system with `node tools/serve-student-web.cjs`; see the [system runbook](../student-system-runbook.md).
