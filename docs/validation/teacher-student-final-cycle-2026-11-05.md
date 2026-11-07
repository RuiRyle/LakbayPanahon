# Teacher–student workflow integration review

Reviewed locally on November 5, 2026. This is local code/permission validation, not hosted acceptance, a human usability study or evidence of learning gains.

## Covered cycle

| Stage | Evidence |
| --- | --- |
| Teacher entry, no-class use, class creation | Teacher browser tests: all-classes dashboard, pre-class lesson/announcement/assignment composition, approved access, owned class creation and navigation. |
| Invitation and student membership | Student browser/unit tests and actual local Firestore rules: code validation/expiry/rotation, join, duplicate join, leave and preserved personal progress. |
| Assignment and announcements | Teacher browser and rules tests: recipient routing, drafts/publication/editing, due dates, archived recipient exclusion, student read permissions and normal prerequisites. |
| Learning results | Rules test writes an eligible mission completion, quiz attempt and paired XP as the student, then reads them as the teacher. Replay does not grant another reward. |
| Teacher guidance and student response | Rules test sends guidance after the student-earned mission completion, reads/acknowledges as the recipient, then saves private follow-up as the teacher. Student browser tests cover revised-message acknowledgements and feedback-load failure. |
| Private follow-up | Teacher browser, policy and rules tests: planned/discussed notes, status-time boundary, later quiz evidence, stale-edit protection and no student access. |
| Reports, insights and export | Teacher browser and policy tests: current/history distinction, uncertain dates, scoped groups, fresh-data exports and exclusion of private notes/feedback. |
| Removal, rejoining and archive | Rules/browser checks: owner-only removal, immediate access revocation, retained personal progress, rejoin with active code and archive restrictions. |

## Finding fixed

Roster searching could clear an opened report containing unsent feedback/private notes. Search and Show All Students now honor discard confirmation. The new regression check verifies that canceling a search preserves private follow-up text.

## Results

- 20 focused unit tests passed across student membership, teacher publication/deadline policy, support evidence, exports and quiz insights.
- Teacher workflow browser checks passed at 390px and 1280px.
- Student My Class browser regression passed, including feedback acknowledgement, missing-service recovery, prerequisites and session isolation.
- Separate teacher document navigation checks passed at 390px and 1280px, including report search/page restoration and return navigation.
- 129 actual local Firestore integration/permission checks passed. The added post-completion guidance/follow-up steps verify that saved score remains 100 and XP remains 10.
- Shared page generation and data dictionary audit passed (66 tables; 37 collection references).

Detailed evidence: `teacher-workspace-browser-2026-10-31.json`, `teacher-pages-browser-2026-11-04.json` and `teacher-student-loop-emulator-2026-11-03.json`. Their verifiedAt timestamps identify the current runs. Browser tests use actual modules with mocked Firebase; the rules suite uses a local demo emulator and synthetic identities, not real learner records. The checks span complementary test layers rather than one automated live-browser session for both roles.

## Still required before a deployment-ready claim

Prepare and review the complete hosting/rules release. Pending rules include optional assignment deadlines, classFeedback, teacherSupportNotes and owning-teacher membership removal. Then verify the hosted teacher/student flow with separate authorized accounts. Actual teacher/student usability review, physical print/PDF output and supported-device testing remain separate checks. No hosting, rules or functions were deployed during this review.
