# Optional profile setup and dashboard learning actions

Implemented 26 October 2026 against the original Firebase project on the existing free plan. Frontend code is local; Firestore rules are deployed. Firebase Hosting was not deployed.

## Optional setup

The dashboard offers Set Up My Profile and Not Now when neither setup state exists. Setup uses the existing profile editor. It does not automatically open a modal, require an avatar, require a classroom, or disable learning links.

Saving a profile records `users.profileSetupCompletedAt` once. Not Now records `users.profileSetupDismissedAt` once. Both are server timestamps, with an accompanying updatedAt. A failed dismissal leaves the prompt available with a retry message, while learning remains accessible. The profile listener keeps the prompt consistent with saved state.

Existing accounts without either field receive the same optional offer. No bulk student migration was performed. A skipped student can still open My Profile and save later, which records completion. Names and avatar behavior continue to work during catalog failures.

Rules allow only the owner to record these states, require an active student for setup timestamps, and reject arbitrary values and rewrites. Protected role, account status and reward fields remain protected.

## Learning action

`js/student-journey.js` resolves the action from current Firestore chapters, eras, missions, chapter challenges and owner-scoped completions/quiz attempts. No lesson IDs, historical titles or learning content are embedded in the resolver.

- New student: Start Learning opens the first eligible lesson directly with encoded chapter/mission parameters.
- Returning student: Continue Mission opens the next unfinished eligible lesson.
- A recent attempt in another independent era is preferred only when its mission is currently unlocked.
- Failed quiz: the card also offers Retry Mission Quiz and, when weak-topic metadata exists, Review Missed Topics. These remain optional recovery routes.
- All missions complete: Take Chapter Challenge appears only when an active challenge exists.
- All available chapters complete: Review Chapters appears.
- Unready/inactive chapters are excluded. Empty content in one era does not suppress available content in another independent era. Later chapters in the same era still require the preceding ready chapters to be completed.
- No content, missing chapter challenges and loading failures have explicit states. Failed loading offers a retry without retaining a stale learning link.

Chapter ordering and mission ordering use Firestore metadata. Database text is rendered with textContent and route parameters use URLSearchParams. The card preserves mission completion counts and an accessible progress bar. Returning through browser back/forward cache refreshes the journey.

This resumes a saved learning checkpoint, not an exact unfinished story scene or quiz answer. Those answers remain in memory during the current activity.

## Verification

43 unit tests passed across the student flow, including new account/partial progress/challenge/complete states, era prerequisites, owner filtering and setup state.

The dashboard Chrome test passed Start/Continue routing, encoded IDs, safe database text, review links, challenge/finished/unavailable states and loading retry. The expanded profile Chrome test passed optional setup, completion/dismissal persistence, failed dismissal, catalog recovery and existing profile interactions.

Firebase compiled and deployed the setup rules. A temporary live student verified timestamp validation, invalid flag rejection, fresh-sign-in persistence and a Start Learning action derived from live content. Its temporary account, profile and catalog test entry were removed. Existing students and their XP were unchanged.

Full manual learning navigation and phone visual acceptance remain on STUDENT-WORKFLOW-CHECKLIST.md.
