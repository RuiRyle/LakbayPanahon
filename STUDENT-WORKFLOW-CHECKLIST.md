# Student workflow: Phase 1

Phase 1 reflects a local code audit, automated tests, and the user's report that the main journey passed against live Firebase. Phase 2 security changes now require deployment and another live verification; see STUDENT-SECURITY-ROLLOUT.md.

## Implemented or checked in code

- [x] Student registration creates an active student profile.
- [x] Login, logout, and protected-page guards exist.
- [x] Independent learning has no classroom requirement.
- [x] Mission journey opens the selected story with chapter/mission parameters.
- [x] Story opens its mission quiz; failed quizzes link to practice; practice links back to the quiz.
- [x] Passing quizzes return to the mission journey.
- [x] Chapter, mission, story, practice, quiz, and challenge entry points check chapter prerequisites consistently within an era.
- [x] Story, practice, and quiz direct links check mission prerequisites.
- [x] Story loading waits for Firebase authentication restoration.
- [x] Completed chapters and missions are read from Firestore for navigation.
- [x] Mission XP is awarded transactionally on first completion; replay preserves XP and best score.
- [x] Artifact and badge awards use deterministic ownership IDs and transactions in the existing code.
- [x] Practice shows save progress, reports failures, and offers a retry.
- [x] Practice retries reuse a session ID to avoid duplicate records after a lost response.
- [x] Mission quiz icon encoding repaired.

## Automated verification

Run from the project root:

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/student-journey.test.cjs
```

Journey tests use mocked Firebase operations with the actual access/save functions and shared activity service. The security suite separately checks actual Firestore rules and transactional reward handling against a local emulator, including concurrent submissions. Neither suite confirms the deployed backend or browser layout.

## Browser acceptance checklist — still pending

- [ ] Register a fresh student; confirm validation, errors, and successful login.
- [ ] Complete the first story and its interactive checks.
- [ ] Verify previous/next navigation, long answers, icons, and mobile layout.
- [ ] Fail a quiz, open practice, complete it, and retry the correct quiz.
- [ ] Pass a quiz and confirm XP, artifact, and next-mission availability.
- [ ] Replay the same mission and confirm XP/artifact ownership are unchanged.
- [ ] Complete all missions and a chapter challenge; confirm badge and next-chapter access.
- [ ] Replay a chapter challenge and confirm no duplicate badge.
- [ ] Refresh each learning page and verify it reloads cleanly.
- [ ] Log out and back in; confirm XP, progress, artifacts, and badges persist.
- [ ] Simulate a failed practice save; confirm retry and continued navigation work.
- [ ] Test loading failures, missing content, slow internet, and expired sessions.
- [ ] Verify daily challenge availability and duplicate-reward handling with live content.

In-progress story/quiz answers currently restart when the page reloads. Persisted completions and rewards remain in Firestore. Resuming unfinished attempts is a separate feature.

## Phase 2

Account-field protection, private progress reads, and free-plan Firestore reward transactions are implemented locally. All 22 automated tests passed. Full quiz grading remains in the browser. Live rules deployment and verification are pending. See STUDENT-SECURITY-ROLLOUT.md for deployment steps and limitations.

## Student profile and avatar

- [x] Open My Profile from the profile button or sidebar without leaving an activity.
- [x] Access the editor on every protected student page, including chapter challenges.
- [x] Edit names; show sign-in email as read-only.
- [x] Choose an initial or one of eight avatars with a live preview.
- [x] Save only name/avatar fields and a server timestamp; preserve roles, status and rewards.
- [x] Refresh saved names and avatars across the interface through Firestore.
- [x] Handle cancel, validation, failed saves and pending saves.
- [x] Verify profile validation, persistence and permissions (26 passing automated tests total).
- [x] Verify editor interactions in a headless browser using mock data.
- [ ] Deploy the revised avatar rules to live Firebase.
- [ ] Confirm saved profile details remain after logout/login with live Firebase.
- [ ] Check the editor visually on a phone.

Profile selection is optional. Existing students keep their initial until they choose an avatar.

## Adaptive review

- [x] Load topic labels and question metadata from Firestore.
- [x] Display topics needing review on the dashboard and practice page.
- [x] Link Practice Again to the selected topic within its mission.
- [x] Use latest per-question practice results so later first-try successes replace earlier mistakes.
- [x] Refresh recommendations after a saved practice session.
- [x] Preserve regular practice when adaptive metadata is incomplete.
- [x] Test review logic and the targeted practice UI with mock data.
- [ ] Check live question metadata and complete the live acceptance steps in ADAPTIVE-REVIEW.md.

## Deferred

Browser prerequisite checks and full quiz grading run on the client. The revised rules protect ownership, configured reward amounts and duplicate awards once deployed. Bayani AI, timeline, and teacher/admin workflows remain deferred.
