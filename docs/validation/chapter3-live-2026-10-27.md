# Chapter 3 original-project desktop walkthrough

Completed on 27 October 2026 through actual website pages and controls in headless desktop Chrome using the original Firebase project. No emulator or mocked Firebase calls were used for this walkthrough.

## Setup and cleanup

Registered an isolated temporary student through the registration form. Only that temporary account received administrator-created Chapter 1–2 completion records so the test could begin at Chapter 3. This does not test completing Chapters 1–2 through the UI. No real learner records or curriculum documents were modified by the walkthrough.

Two initial runs stopped at a quiz refresh defect. Their temporary accounts and owned records were cleaned up. After the fix, the complete run passed and its account, prerequisite fixtures, drafts, attempts, practice, progress, artifact and badge ownership records were removed. The temporary credential file was deleted by cleanup.

## Verified through the live website

- Registered and continued to the dashboard.
- Completed all five scenes in each of Chapter 3's four missions, including clue exploration and decisions.
- Failed the first mission quiz and followed a topic recovery link to its mapped teaching scene.
- Finished that review scene, opened targeted practice and saved its results.
- Retried with five questions different from the failed attempt and passed.
- Refreshed a quiz with an answer saved, preserving the answer, question position and started state.
- Passed the remaining mission quizzes and verified four Chapter 3 artifacts.
- Completed six decision and four matching activities in the Chapter 3 challenge.
- Refreshed decision and matching challenge interactions without losing saved state.
- Verified the chapter badge and used Continue to Next Chapter to open Chapter 4's mission page.
- Replayed the first mission quiz and confirmed XP and artifact ownership did not increase.

## Fix discovered

The live refresh restored the answer but incorrectly returned to the expedition briefing. The started-state restoration had been placed in the failed-restart handler instead of successful quiz loading. The fix restores `quizStarted` from a validated saved draft before rendering or saving the loaded question. The erroneous restart-handler reference was removed. The fixture browser check now resets the in-memory started state before loading so it catches this cold-start regression.

## Evidence and limits

[Passed-step report](chapter3-live-report-2026-10-27.json) and [Chapter 4 unlocked screenshot](chapter4-unlocked-2026-10-27.png).

The script selects known correct/incorrect answers to exercise behavior. This is a technical acceptance check, not evidence of Grade 5 comprehension, historical approval, usability with children, or assessment difficulty equivalence. It does not complete Chapter 4's learning journey. Teacher/student review remains pending. Hosting was not deployed.
