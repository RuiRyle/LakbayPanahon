# Student registration and story navigation

Registration prevents overlapping submissions and reuses the authenticated account after a failed profile save. A retry reads the server profile before writing. If a write succeeds but its acknowledgement is lost, another server read confirms completion. Existing profiles are preserved. Success reveals a dashboard link and disables further submissions.

Registration validates required fields, matching passwords, accepted terms and name lengths. Existing Firestore rules protect account role and status. These changes add no runtime curriculum or reward data.

Stories now provide Previous Scene. Exploration, decision and quick-check completion remain available when reviewing earlier scenes within the session. Sign-out clears the loaded story and ignores a pending scene response for the signed-out account. Reloading still restarts unfinished answers.

Lesson loading failures and empty scene banks offer Try Loading Again. Overlapping loads are ignored. Each authenticated session invalidates earlier responses, including signing back into the same account before an old load finishes. Pending AI explanation responses are also invalidated on session changes. The expanded story browser test covers failed reads, empty scenes, retry and this session race.

## Verification

- `node tests/student-registration-browser.cjs`: actual markup, styles and handler with mocked Firebase; password mismatch, duplicate submissions, failed profile save, retry, lost acknowledgement, profile payload and success link.
- `node tests/story-browser.cjs`: actual markup, styles and handler with mocked Firebase; exploration, wrong/correct decisions and quick checks, previous/next navigation, completion, menu and sign-out.
- Both checks test horizontal overflow in a narrow desktop Chrome viewport. Physical phone acceptance remains pending.
- All existing 46 unit tests pass.

No new live database writes or deployment were needed. Fresh registration through the complete live application and the full learning journey remain on the workflow checklist.
