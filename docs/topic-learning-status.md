# Topic learning status in My Journey

My Journey now shows the status of topics with saved quiz or practice evidence. It uses the existing Firestore practice question topics, quiz attempts, practice sessions, and lesson-review events. It does not add a collection or require new reads.

- **Review the lesson:** A saved quiz or practice result identified the topic, with no later review evidence.
- **Lesson revisited:** The student completed the mapped story review after the latest mistake.
- **Building understanding:** Later practice exists but the configured practice goal is not reached.
- **Practice goal reached:** Saved practice meets that topic's Firestore `reviewEvidencePolicy` for distinct correct questions, separate successful sessions, and required difficulty after the latest mistake.

Each status offers a story or practice action. Topics without saved evidence are omitted; unavailable evidence shows a retry notice. Practice goal reached does not claim permanent mastery, mission completion, or later recall. The existing “Topics to review” count excludes reached goals.

The local My Journey Chrome check passed current review, saved goal reached, locked chapters, session changes, and loading recovery. An authenticated original-project prologue walkthrough also checked the My Journey lesson-review action immediately after a failed quiz, then completed mapped scene review, practice, a fresh retry, all four missions and the chapter challenge. The temporary account and owned records were removed. Firebase Hosting has not been deployed; Grade 5 wording and classroom comprehension still need human review.
