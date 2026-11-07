# Activity lifecycle

Implemented locally on 6 November 2026 for class goals (`classAssignments`) and personal reviews (`classReviewAssignments`). Announcements retain their existing Draft/Published states.

| State | Meaning | Student behavior |
| --- | --- | --- |
| Draft | Teacher preparation | Hidden from students. |
| Published | Active assigned work | Normal prerequisite checks, help requests and review explanations apply. |
| Closed | Finished activity | Readable in Ended activities; no new assignment help/explanation submissions. |
| Withdrawn | Cancelled, no longer required | Readable in Ended activities and excluded from active work. |

Only a published activity can be closed or withdrawn. Ended records cannot be edited or republished; assigning the lesson again requires a new activity. Confirmation explains the consequences before the teacher acts. Conflict protection and save-recovery checks still apply.

## Evidence and learning

`endedAt` is a server timestamp required for Closed/Withdrawn and absent/null otherwise. Closing preserves the activity's mission, chapter, instructions, title, deadline and original personal-review anchor. No mission progress, attempts, XP, badges or reward records are changed. Retiring lesson content does not prevent a teacher from ending its existing assignment.

Historical class-goal completion must be dated at or before endedAt; missing dates remain unverifiable. Personal reviews use passing attempts after assignedAt and at or before endedAt. Later independent learning remains available through My Journey but does not finish an ended activity. Evidence is derived from retained records, not copied into a new gradebook or immutable aggregate snapshot.

## Existing guidance

Students can read their saved explanations and teacher replies after the activity ends. Teachers may still answer an existing help request or provide guidance on an existing explanation. Students may acknowledge whether that guidance helped. New help/follow-up questions and new/revised explanations for the ended activity are rejected by rules. Leaving the class revokes the student's access to this class history; students never gain access to classmates' private reviews.

## Interface

Teachers use Close activity or Withdraw activity on published cards. The activity board includes Closed and Withdrawn filters, read-only labels and retained historical progress tools. Students see a separate, collapsible Ended activities history and an Ended filter. Ended work is excluded from To do and the active completion target. Saved explanations render outside the hidden editing form.

## Validation and release boundary

- 27 isolated lifecycle rule checks passed, including teacher ownership, forged timestamps, terminal immutability, private review query scope, existing guidance and membership revocation.
- Existing 129 teacher/student permission checks and 18 review/guidance checks passed.
- Browser fixtures cover teacher end controls and read-only student history at 390px and desktop widths; seven policy tests cover cutoff logic and existing behavior.
- Actual Firebase SDK/emulator walkthrough passed with teacher closing/withdrawal and student retained guidance/history, with no unexpected JavaScript errors.

No production publication occurred. This feature changes both the activity schema/rules and student queries. Publish the reviewed rules and matching frontend together; the expanded student status query is not compatible with the old published-only read rule. Verify production indexes/routing and a bounded real-account flow after publication. The existing production-connected preview remains on its earlier package; use the local emulator to inspect the lifecycle implementation.
