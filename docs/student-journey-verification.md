# Chapter completion and daily reward verification

Verified 26 October 2026 using the original `lakbaypanahon-1797e` database on the free plan. No emulator was used. Existing student accounts and catalog content were unchanged. Temporary test accounts and their learning records were removed.

## Live verification

`tests/live-mission-flow.cjs` now exercises the actual shared reward and access functions with requests authenticated as a temporary student:

- Save a failed mission attempt without rewards.
- Select an equivalent fresh retry and pass with 3/5 correct.
- Replay the submission without additional XP.
- Reject a chapter challenge while a mission is incomplete.
- Complete every mission in the first chapter in order.
- Complete the chapter challenge and award its badge once.
- Replay the challenge without another badge or XP.
- Verify the next ready chapter in the same era is accessible.
- Reject an incorrect daily answer; save a correct answer with XP and streak.
- Replay the daily challenge without additional XP or streak growth.
- Authenticate again and verify XP, chapter/daily completions, artifacts and badge ownership persist.

The test uses a REST adapter to exercise the actual browser service and deployed Firestore rules. It does not replace a full browser navigation test or prove SDK concurrency handling. Cleanup is restricted to the temporary account's record paths.

## Fixed daily behavior

Daily question selection and submission now share `js/daily-policy.js`. They use the Philippines calendar, Firestore ordering and a deterministic document-ID tie break. Content and reward amounts remain in Firestore.

The daily UI refreshes at the next Philippines midnight, when a stale tab becomes visible, on return through the back/forward cache and before accepting an answer for a new day. The previous answer is cleared. A delayed completion callback from yesterday cannot replace today's question. Sign-out clears daily state and the midnight timer.

Loading failures clear stale questions and reward text and expose a retry button. A clock boundary during an in-flight save triggers a refresh afterward. Feedback renders Firestore explanations as text rather than HTML.

Chapter challenge JavaScript symbols with corrupted encoding were repaired.

## Browser verification

`tests/daily-challenge-browser.cjs` exercises the actual dashboard markup, daily UI and reward service with mock Firestore data and a controlled clock. It passed correct/incorrect answers, safe feedback, midnight refresh, stale-answer rejection, delayed callbacks, saved completion restoration, streak/replay behavior, loading failure/recovery and sign-out.

`tests/chapter-challenge-browser.cjs` exercises the actual challenge markup/module. It passed multiple choice, historical decisions, duplicate matching prevention, trade controls, failure/retry, completion, badge display and replay. The main mission quiz browser test also passed after the shared reward-module change.

46 unit tests passed, including day/year/leap-day boundaries, deterministic daily selection, consecutive-day streaks, gap resets and replay stability.

## Remaining acceptance

Full human-driven browser navigation, real phone layout checks, UI registration/story completion and curriculum review remain on STUDENT-WORKFLOW-CHECKLIST.md. Automated browser checks use mocked data; the live test verifies Firestore behavior separately. Frontend changes are in the workspace, and Firebase Hosting was not deployed. No new catalog migration or rules deployment was required for this change.
