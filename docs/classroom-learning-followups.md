# Focused classroom learning and follow-up

Implemented in the local website and emulator on 5 November 2026. Online publication remains separate.

## 1. Focused review

Teachers choose a review focus from active story-scene `reviewTopics` mappings. Whole lesson remains available when no mapped focus exists. `reviewTopic` and `reviewSceneId` are stored on the private review; rules verify the topic belongs to an active scene for that mission. Students use “Review this concept” to open the existing topic-review route, which filters authored scenes. Prerequisites still apply and a fresh passing mission quiz remains the review completion criterion. This is topic-focused reading, not a newly authored topic-only graded quiz.

New reviews include a short `reflectionQuestion` (up to 500 characters). The teacher can customize it before publication. Published focus, scene and question cannot be silently changed; create a new review for another learning objective. Drafts can be revised before first publication. Existing reviews without a question remain usable without an explanation activity.

## 2. Explain understanding

After a fresh passing review, students may expand “Explain what you learned” and send up to 600 characters. The explanation is private to the student and teacher, is not automatically graded, does not alter the quiz result, and gives no additional XP. Students can update it; doing so clears the old teacher response and increments its revision. Teachers respond with encouragement or a next step; students refresh the explanation panel to read that guidance.

Storage: `classReviewReflections/{reviewId}`. One current explanation and teacher response per private review, not a message archive.

| Attribute | Type | Meaning |
| --- | --- | --- |
| classId | string | Class relationship |
| userId | string | Intended student |
| reviewId | string | Private review assignment; also the document ID |
| question | string | Snapshot matching the review's immutable published reflectionQuestion |
| body | string, 1–600 | Student explanation |
| attemptId | string | Document ID of a matching fresh passing studentQuizAttempts record |
| revision | integer | Starts at 1 and increments for student revisions |
| submittedAt | timestamp | Server time of current explanation |
| response | string, 0–1500 | Empty until teacher guidance is sent |
| respondedAt | timestamp or null | Server time of teacher guidance |

Rules require a published review in the active joined class, the intended student, the configured question and a matching saved passing attempt after assignedAt. Students cannot forge a teacher response. Teacher responses require current membership. Transactions reject replies to a replaced explanation. Failed saves keep typed text. These checks validate saved evidence relationships; browser grading retains its existing trust limitations.

## 3. Teacher follow-ups

On Student Progress for the selected class, three collapsible sections organize the work:

- Student help requests: unresolved requests first, with the pending count and private replies.
- Understanding checks: 100 records per cursor page, unanswered first; additional pages load explicitly. Direct links can fetch a selected explanation beyond page one.
- Review outcomes to acknowledge: on-demand fresh review evidence in groups of 10, with links to the review report. This shows progress evidence rather than claiming every completion needs intervention.

No polling runs. Current class membership scopes the visible students. Large lists state loaded coverage and whether more pages are available. Loading another page preserves unsent reply fields; failed page reads retain their cursor for an explicit retry. Draft replies are preserved unless the teacher confirms discarding them on refresh.

## 4. Student activity organization

My Class → Learning offers All activities, To do, Waiting for teacher and Completed filters. Completed activities sit inside collapsible history. Waiting for teacher means an open help request or a “still need help” response in the latest loaded request snapshot; it is separate from assignment completion. A teacher-reply indicator resets filters and opens the matching completed history when needed so the reply stays reachable.

## 5. Private encouragement

The teacher's existing student report → Send guidance form offers a collapsed “Write private encouragement” section. Editable starting points recognize effort, improvement or reasoning. Teachers choose and personalize a message; nothing is sent automatically. Sending uses existing private classFeedback storage/read acknowledgements and awards no XP or score changes. It replaces the current feedback for that mission under the existing one-message-per-mission contract.

## Validation

`tests/class-review-emulator.cjs` exercises authored topic validation, reflection/attempt relationships and private teacher guidance. `tests/class-teaching-browser.cjs` covers actual teacher/student forms and collapsed completed activity behavior using temporary local fixtures and synthetic quiz scores. Existing class/help policy checks remain separate. No user-created class is seeded, reset or deleted by these tests.
