# LakbayPanahon student privacy notice — unpublished review draft

Prepared 29 October 2026 from the current student implementation. **This is not an operative privacy policy, legal approval or permission to enroll children. Do not link it from registration or publish it as final notice yet.**

## Decisions needed before publication

| Decision | Unresolved item |
| --- | --- |
| Operator identity | Confirm the person, school or organization responsible for LakbayPanahon and its student data. |
| Contact and request route | Supply a monitored contact and identify who will handle questions, corrections and requests to remove account data. No working contact or automated request service is established by this draft. |
| Retention and disposal | Decide how long each account, result, draft and membership record is needed, what happens after a student leaves, and how deletion and backups are handled. No duration is promised here. |
| School/guardian arrangements | Determine the appropriate arrangements for the intended learners and school context, including the basis for processing their information. This draft does not establish consent or a lawful basis. |
| AI | Resolve provider eligibility, safeguards, retention and the intended under-13 use before learner rollout. See [Bayani provider decision](../bayani-provider-options.md). |
| Access and service details | Confirm the operator's actual administrative access, authorized recipients and applicable service/account arrangements. Frontend restrictions are not a complete account-access inventory. |

## For students: what happens to your information?

LakbayPanahon uses your name and email to create your account. It saves your learning progress so you can return to your lessons.

- Your saved information can include quiz answers, scores, practice results, rewards and your place in a lesson.
- Joining a class saves which class you joined. Leaving a class keeps your learning progress.
- Saving a clue keeps a bookmark to that lesson. You can remove bookmarks in My Journey.
- Sound, music and reading choices can stay in the browser on the computer you use.
- Keep your password private. Log out when you finish on a shared computer.

If you need help with your information, ask a trusted adult to read the details below with you. **[Operator review: insert the confirmed contact and a simple way to ask for help before this notice is published.]**

### About Bayani AI

Bayani AI is an AI assistant, so its explanations can be wrong. Check them against your lessons and ask a trusted adult when unsure. Keep your address, phone number, passwords and other private information out of chat.

The current chat sends your question and earlier messages in that conversation to an outside AI service. New Chat clears the conversation from this page. It does not promise that the AI service has deleted its records.

**Operator review:** this describes the existing technical connection. Its suitability for Grade 5 is unresolved. It is not approval to offer that connection to children.

## Details for adults and reviewers

### Account and learning information

| Information | Current purpose and location |
| --- | --- |
| Email and sign-in credentials | Firebase Authentication handles account creation and sign-in. The student registration code does not write passwords to Firestore. |
| First, optional middle and last names; email; role/status; avatar; setup and update times | `users/{uid}` holds the profile and account state. The student editor changes names/avatar, with email displayed read-only. |
| Mission/chapter/daily completions, best scores, rewards and times | `studentProgress`, `studentChapterProgress` and `studentDailyChallenges` support progress, unlocks and one-time rewards. |
| Mission question IDs, submitted answers, scores and topics to review | `studentQuizAttempts` supports retry history and learning recommendations. |
| Practice answers/results, first-try performance and review topics | `studentPracticeProgress` supports targeted practice and its learning summary. |
| Reviewed topic and scene references | `studentReviewEvents` records a lesson-review activity separately from quiz grades. |
| Unfinished lesson/quiz/practice/challenge state | `studentLearningDrafts` supports resuming. A normal restart or completion can clear the relevant draft without removing completed progress. |
| Saved lesson-clue references | `studentEvidenceJournal` stores bookmarks to authored clues; students can remove their own bookmarks. |
| Class ID, owner ID, joining code, membership status and joining time | `classMembers` records a class join. Leave Class removes that membership, not completed learning records. |

These records are linked to the Firebase account identifier. The reviewed student pages do not provide a classmates' profile/result directory. The operator must still confirm administrative access and any future teacher access before making broader confidentiality or sharing promises.

### Device storage and signing out

The site keeps sound, volume, animation, contrast and text-size preferences in browser storage. These preferences are shared by accounts using that browser. Tab storage can contain account-scoped quiz attempt/question IDs, preview activity state and a short-lived instructional catalog cache. Firebase also manages sign-in storage.

Signing out does not delete Firestore learning records. The account and saved progress can remain available for a later sign-in. Do not describe logout as deleting an account or erasing all browser data.

**Local frontend update, 29 October:** Remember me now controls whether the updated sign-in flow uses a tab session or a remembered session. New registrations default to a tab session. Logout/account-change handling removes the departing account's scoped tab-local learning keys where browser storage permits it. Ten focused local checks and the registration recovery browser fixture passed; public deployment and actual-browser persistence acceptance remain separate work. Browser preferences are intentionally retained. This draft does not promise deletion of browser history, screenshots or provider-managed records. See the [audit](../student-access-privacy-audit.md).

### Outside services and chat

The implementation uses Google Firebase for authentication and Firestore storage. The current Bayani client additionally initializes Firebase App Check and calls Gemini through Firebase AI Logic. It sends the typed question, preceding chat turns and configured assistant instructions; it does not load saved profile names, class records or scores into the chat request. Information a learner types can nevertheless reach the provider.

The reviewed frontend does not persist chat messages in a Firestore chat collection. Chat state is held in memory and cleared on New Chat, account change and page exit. Provider retention is separate and must be resolved in the AI decision. No claim of zero retention, guaranteed history-only answers or guaranteed child-safe replies is made.

**Prepared, not activated:** the optional [Anthropic backend](../bayani-backend-preparation.md) would additionally write UID-linked request/minute/date counters to `bayaniUsage` and global daily counts to `bayaniUsageDaily`, without transcripts. This is planned processing, not a claim that those records are currently collected. Agree retention/disposal and include the UID-linked usage records in the eventual account-data request/removal process before activation.

### Questions, corrections and removal requests

Students can edit their name/avatar, leave a class and remove Journal bookmarks through the existing website. There is no implemented student self-service account deletion or complete account-data request workflow in the reviewed frontend.

**[Operator decision: insert the real request contact, identity-check procedure and response process.]** A complete account-removal procedure must consider Firebase Authentication and the linked Firestore collections above, plus any retained copies or service-side records covered by the agreed policy. Deleting only the sign-in account is not evidence that all related information was erased. Some completion and reward records intentionally reject student deletion; any administrative process must preserve the intended security controls.

Do not promise a retention period, automatic deletion, backup deletion or an AI-provider deletion outcome until the responsible operator has defined and verified it.

## Implementation evidence and review reference

The code references below support the factual description, not a claim of legal compliance:

- [Registration](../../js/auth-ui.js), [profile editor](../../js/student-profile.js), [reward/results writes](../../js/student-rewards-client.js).
- [Practice records](../../js/practice.js), [lesson review events](../../js/review-events.js), [resume drafts](../../js/learning-draft.js), [Journal](../../js/evidence-journal.js).
- [Class membership](../../js/student-class-client.js), [class display](../../js/my-class.js), [logout](../../js/logout.js), [scoped tab cleanup](../../js/student-session-storage.js).
- [Browser preferences](../../js/page-transition.js), [instructional cache](../../js/content-cache.js), [Bayani client](../../js/bayani-client.js), [chat state](../../js/bayani-ai.js).

The layered student/adult format is informed by the National Privacy Commission's [Guidelines on Child-Oriented Transparency, Advisory No. 2024-03](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf), which discusses understandable notices, operator identity and practical ways to exercise privacy rights. Referencing that guidance does not certify this draft or the application.
