# Student My Class

Students can join a class by code, view published mission assignments and due dates, open eligible lessons, and leave a class without losing learning progress. Independent learning remains available. Completion comes from the student's existing saved mission progress, including missions completed before joining. There is no separate submission or grade record yet.

Assignments respect the existing mission and chapter prerequisites. Assigning a locked mission does not unlock it. Due dates are informational and displayed in Philippine time; passing after the deadline still completes the mission. Assignment completion does not award additional XP.

## Firestore setup before teacher authoring is built

Class creation and assignment publishing currently require a trusted project administrator using Firebase Console or Admin SDK. Students cannot create classes or publish assignments. The page initially shows an empty state until class data exists; no demo class is shipped or automatically created.

In Firebase Console, open **Firestore Database → Data** in the existing project. Create these documents in order. Replace the example placeholders with actual values; do not paste placeholder mission IDs.

1. Create collection `classes`, with a document ID you choose, such as `history-section-a`. Add string fields `name`, `teacherId` (the teacher's real account UID), `teacherName`, and `status` set to `active`. Optionally add a string `description`. Avoid private teacher/student information.
2. Create collection `classJoinCodes`. Use a randomly generated **12-character uppercase letter/number code** as the document ID. Add string `classId` matching the class document ID and string `status` set to `active`. Optionally add `expiresAt` using Firestore's **timestamp** type. Keep this document limited to these invitation fields; students can look up an exact code before joining. Do not reuse a predictable sample code.
3. Create collection `classAssignments`, using an automatically generated document ID. Add string fields `classId`, `chapterId`, `missionId`, `title`, and `status` set to `published`. Copy `chapterId` and `missionId` from an existing mission in your Firestore curriculum. Optionally add string `instructions` and timestamp `dueAt`. A `draft` status hides the assignment from students.
4. Give the invitation code to the intended student. On the website, sign in as an active student, open **My Class**, enter the code and select **Join Class**.

To stop new joins, change the invitation's `status` to `revoked`, or set an expiration timestamp. To archive a class, change its `status` to `archived`; existing members retain the class view but lesson actions from that class are disabled. These changes do not delete learning progress.

## Automatically managed membership

The browser creates `classMembers/{studentUid}_{classId}` with `userId`, `classId`, `joinCode`, `status: active`, and server timestamp `joinedAt`. Do not manually create this record for the normal join flow. Joining twice preserves the existing membership. Leaving deletes only that membership.

Rules restrict membership reads to the owner and class/assignment reads to members. Codes cannot be listed, expired/revoked codes cannot create memberships, and students cannot edit assignments. High-entropy codes reduce guessing; the current free-plan flow has no server-side invitation rate limiter. Existing browser grading limits still apply.

## Teacher integration still to implement

The fixed [student acceptance baseline](student-acceptance-checklist.md#fixed-my-class-contract) preserves this existing read/join/leave contract. Later teacher work must verify ownership and publishing against it; teacher roster/progress permissions are not automatically provided by the existing student rules. It should reopen independent student flow only for confirmed integration defects or an explicitly agreed contract migration.

Teacher class creation, roster management, invitation rotation, assignment editing/publishing, announcements and individual feedback need a teacher interface and corresponding ownership rules. Until then, only trusted administrators author the documents above. No chatbot or placeholder teacher interaction substitutes for these features.

## Verification — 27 October 2026

- Unit checks cover normalized codes, duplicate joins, invalid/expired/revoked codes and session changes.
- Desktop Chrome fixture checks cover joining/leaving, published assignments, saved completion, prerequisites, safe text, load recovery and session isolation.
- Original-project REST checks passed for joining, member isolation, hidden drafts, rejected student publishing, leaving, expiry and revocation. Temporary test accounts and records were removed.
- Supporting Firestore rules are deployed. The frontend remains local; Hosting was not deployed.
