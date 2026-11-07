# Private assignment help

Students open My Class → Learning → an assigned mission → Ask your teacher for help. A collapsed form offers three reasons (lesson explanation, stuck on a question, or next step) and an optional message of up to 500 characters. One current request exists per student and assignment. An open request cannot be sent again or overwritten. After a teacher answers, the student may ask a follow-up; this replaces the current question and reply, rather than keeping a conversation archive.

Teachers select a class on the Students page and open Student help requests. Requests load on demand, show waiting requests first, and include a private reply form (1–1500 characters). No polling or paid AI runs. The inbox loads 100 records per cursor page, with Load more requests for subsequent pages. Pending counts describe loaded records, and more-available status prevents false caught-up claims. Dashboard-linked requests can load directly by class and ID. Requests from departed members are omitted. Students refresh the request to see a new reply; completing a mission remains independent of help-request status.

## Data dictionary

Collection: `classHelpRequests`. Document ID: `{classId}_{userId}_{assignmentId}`.

| Attribute | Type | Purpose |
| --- | --- | --- |
| classId | string | Class relationship |
| userId | string | Student relationship |
| assignmentId | string | Published assignment relationship |
| assignmentKind | string | `class-goal` or `targeted-review`; absent legacy values mean class goal |
| chapterId | string | Assignment chapter |
| missionId | string | Assignment mission |
| reason | string | `lesson`, `question`, or `next-step` |
| message | string | Optional student question, maximum 500 characters |
| status | string | `open` or `answered` |
| response | string | Current private teacher reply, maximum 1500 characters |
| revision | integer | Starts at 1; increments for each follow-up |
| createdAt | timestamp | First request creation, server time |
| updatedAt | timestamp | Latest request or reply, server time |
| answeredAt | timestamp or null | Server reply time; reset for a follow-up |
| understanding | string, optional for legacy | Empty/unset while awaiting a student response; `understood` or `needs-help` after a teacher reply |
| understandingAt | timestamp or null, optional for legacy | Server time of the student's understanding response; reset for a new teacher reply or follow-up |

Rules restrict students to their own requests within joined classes. Creation must match a published assignment in the active class. Only an approved owning teacher with an active student membership can answer. Students cannot write teacher replies or alter assignment identity. Transactions reject replies to changed requests and duplicate pending requests. Failed sends retain typed text. Leaving a class removes student read access; records remain stored and may be visible again on rejoining.

The student classroom shows a contextual indicator for teacher replies that have no understanding response, with a button opening the matching assignment's help panel. After reading, students choose “I understand” or “I still need help.” This does not complete a mission or prove understanding. Teachers see unresolved requests first, a count in the help-inbox heading, and a reply form when another explanation is needed. New teacher replies reset the understanding response. Reply timestamps and revisions prevent acknowledging a stale reply. Indicators refresh with the class page or the student's response; no live listener or polling runs.

Teacher updates also indicate unread mission feedback using the existing server `readAt` acknowledgement. New announcement indicators compare a local content fingerprint per account/class; opening Teacher updates marks announcements seen on that browser only. No announcement body is stored by this indicator. These are contextual page indicators, not email/push notifications.

Local verification: `node tests/class-help-emulator.cjs`. Uses a temporary local fixture class and cleans it up. Online rules and website publication have not been performed.
