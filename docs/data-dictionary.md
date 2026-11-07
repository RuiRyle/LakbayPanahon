# LakbayPanahon Data Dictionary

Activity lifecycle (6 November 2026): `classAssignments` and `classReviewAssignments` support `closed` and `withdrawn` in addition to `draft`/`published`, with server-written `endedAt`. See [lifecycle policy](activity-lifecycle.md).


## Conventions

Focused review additions: `classReviewAssignments` may include `reviewTopic` (string, up to 150), `reviewSceneId` (string, up to 150) and `reflectionQuestion` (string, up to 500). The first two fields default to empty for whole-lesson review; the prompt defaults to empty for legacy reviews. `classReviewReflections/{reviewId}` stores the current explanation and teacher guidance. See the [complete field reference](classroom-learning-followups.md) and academic table 76.

Classroom additions (5 November 2026): existing `classAssignments` represent shared class goals. Private `classReviewAssignments` use fresh quiz evidence after first publication; see [full fields and semantics](class-teaching-workflow.md). The `classHelpRequests` fields are documented in [private help](class-help-workflow.md), and the nested `classes/{classId}/classmates/{studentId}` display-name projection in [classmates](classmates-workflow.md). [Academic tables 73–75](data-dictionary-academic.md) contain the corresponding attribute tables. These additions are applied locally; online publication remains separate.

Firestore document IDs are the primary identifiers. `PK` means document ID; `FK` means a string containing another document's ID (a logical reference, not a SQL-enforced foreign key). Timestamps are Firestore `Timestamp` values. A field marked optional may be absent. Nested maps/lists can have different shapes by activity type. This dictionary covers root collections referenced by the checked-in Firestore rules and application code; server-managed fields not exposed to the student client are marked accordingly. The teacher permission extensions are published; see [teacher workflow](teacher-workflow.md).

## Identity, classes, and configuration

Teacher qualification extensions (see [workflow](teacher-qualification-workflow.md)):

| Collection / document | Fields | Access and purpose |
|---|---|---|
| `users/{uid}` | `teacherVerifiedRevision` (integer), `teacherAccessType` (`school_teacher`, `licensed_teacher`, `student_teacher`, `facilitator` or empty), `teacherVerificationReviewId` (string) | Administrator-written eligibility metadata; contains no credential number or evidence image. Must match the current approved application. |
| `teacherApplications/{uid}` | `userId`, `email`, `emailVerified`, `revision`, `status`, `updatedAt`; bounded `legalName`, `institution`, `locality`, `roleTitle`, `officialWebsite`, `workEmail`, `prcNumber`, `prcExpiresAt` (timestamp/null), `sponsorName`, `sponsorContact`, `statement`, `applicantType`, `acknowledged` | Applicant/administrator-only form. States: `draft`, `submitted`, `needs_changes`, `declined`, `approved`. Verified-email token required for submission. |
| | `evidenceRevision`, `evidenceName`, `evidenceUploadedAt` (timestamp/null) | Private attachment metadata; zero/empty/null after removal or a review decision. |
| | `decisionReason`, `reviewId`, `reviewedAt`, `reviewedBy` | Administrator decision metadata; applicant sees the reason, not private verification references. Cleared by a new applicant revision. |
| `teacherEvidence/{uid}` | `userId`, `revision`, `name`, `mime`, `data` (bounded base64 image), `uploadedAt` | Private JPG/PNG, client limit 250 KB. Reads expire after 30 days; deletion on decision, encounter cleanup or trusted maintenance. No list/download-token access. |
| `teacherApplicationReviews/{reviewId}` | `userId`, `actorId`, `revision`, `applicantType`, `decision`, `reason`, `checks` (`identity`, `affiliation`, `prc`, `endorsement` booleans), `affiliationReference`, `credentialReference`, `createdAt` | Immutable administrator-only verification record, atomically paired with the application, eligibility metadata and account audit using the same event ID. |

| Collection / document | Field | Firestore type | Key / requirement | Description |
|---|---|---|---|---|
| `users/{uid}` | document ID | string | PK; equals Firebase Auth UID | Application profile for the authenticated account. |
| | `firstName` | string | Required; 1–100 chars | User's first name. |
| | `middleName` | string | Optional; up to 100 chars | User's middle name; empty string is accepted. |
| | `lastName` | string | Required; 1–100 chars | User's last name. |
| | `email` | string | Required | Must equal the authenticated account email on profile creation. |
| | `role` | string | `student`/`teacher` self-registration; `admin` through trusted setup | Application role; account-management UI cannot promote roles. |
| | `status` | string | Required; `active` student or `pending` teacher at creation | Account status used for access control. |
| | `createdAt` | timestamp | Required on creation | Profile creation time. |
| | `updatedAt` | timestamp | Optional | Most recent profile or reward update time. |
| | `moderatedAt` | timestamp | Optional; server timestamp | Most recent administrator account-status decision. |
| | `moderatedBy` | string | Optional; logical FK to administrator `users` | Administrator who made the last decision. |
| | `moderationEventId` | string | Optional; FK to `accountModeration` | Last atomically paired decision record. |
| | `avatarId` | string | Optional; logical FK to `avatars` | Selected avatar catalog document. |
| | `profileSetupCompletedAt` | timestamp | Optional | Time initial profile setup was completed. |
| | `profileSetupDismissedAt` | timestamp | Optional | Time initial profile setup was dismissed. |
| | `xp` | integer | Optional; nonnegative in reward flow | Total experience points. |
| | `level` | integer | Optional; derived from XP and progression settings | Current learning level. |
| | `learningStreak` | integer | Optional | Number of consecutive learning days. |
| | `lastStreakDate` | string | Optional; `YYYY-MM-DD` in UTC+8 | Date key of the latest daily challenge streak update. |
| | `lastRewardKind` | string | Optional; `mission` or `daily` | Type of the most recently paired reward transaction. |
| | `lastRewardId` | string | Optional | Mission ID or daily date key associated with that reward transaction. |
| `accountModeration/{eventId}` | document ID | string | PK; immutable | Administrator-only status-decision audit entry. |
| | `userId` | string | Required; FK to student/teacher `users` | Account whose application access changed. |
| | `actorId` | string | Required; active administrator UID | Decision author. |
| | `previousStatus`, `status` | string | Required | Actual previous status and new `active`/`inactive` status. |
| | `reason` | string | Required; 5–500 characters | Administrator-only reason for the decision. |
| | `identityVerified` | boolean | Required; true for teacher activation | Administrator confirmation of teacher identity/eligibility review, not an automated verification result. |
| | `createdAt` | timestamp | Required; server timestamp | Audit creation time, paired with the profile's moderation timestamp. |
| `avatars/{avatarId}` | document ID | string | PK | Unique avatar option. |
| | `name` | string | Required by profile catalog | Display name. |
| | `status` | string | `active` or `inactive` | Only active avatars are available for selection. |
| | `kind` | string | `initials` or `emoji` | How the avatar is rendered. |
| | `icon` | string | Required when `kind=emoji` | Emoji/icon displayed for the avatar. |
| | `order` | number | Optional | Sort order in the avatar picker. |
| | `isDefault` | boolean | Optional | Identifies the default avatar. |
| `classes/{classId}` | document ID | string | PK | Unique class. |
| | `teacherId` | string | Required for teacher-managed classes; FK to `users` | Immutable owning teacher UID. |
| | `currentJoinCode` | string | Required on new teacher-managed classes | Current 12-character code; empty string revokes new joins. Legacy records may omit it. |
| | `createdAt`, `updatedAt` | timestamp | Required on new teacher-managed classes | Server creation/update times. |
| | `status` | string | Required by membership/access logic; active class required | Class availability state. |
| | `name` | string | Optional display field | Class name shown to a member. |
| | `teacherName` | string | Optional display field | Teacher name shown to a member. |
| | `description` | string | Optional display field | Class description. |
| `classJoinCodes/{code}` | document ID | string | PK; 12 uppercase letters/digits | Server-managed class invitation code. |
| | `teacherId` | string | Required for new teacher-issued codes | Owning teacher. |
| | `createdAt` | timestamp | Required for new teacher-issued codes | Server creation time. |
| | `classId` | string | Required logical FK to `classes` | Class that the code joins. |
| | `status` | string | Must be `active` to join | Code availability. |
| | `expiresAt` | timestamp | Optional | Code expiration time. |
| | `className` | string | Optional; new codes | Classroom name snapshot shown before joining; must match the classroom when issued. |
| | `teacherName` | string | Optional; new codes | Teacher display name snapshot shown before joining; must match the classroom when issued. |
| `classMembers/{uid_classId}` | document ID | string | PK; `{userId}_{classId}` | Unique student membership in a class. |
| | `userId` | string | Required; FK to `users`, must equal signed-in UID | Member account. |
| | `classId` | string | Required logical FK to `classes` | Joined class. |
| | `joinCode` | string | Required logical FK to `classJoinCodes` | Code used to join. |
| | `status` | string | Required; `active` on creation | Membership state. |
| | `joinedAt` | timestamp | Required | Membership creation time. |
| `classAssignments/{assignmentId}` | document ID | string | PK | Unique class assignment. |
| | `classId` | string | Required for class query; FK to `classes` | Assigned class. |
| | `status` | string | `draft`, `published`, `closed`, `withdrawn` | Drafts are private; published activities are active; ended activities remain in student history. |
| | `endedAt` | timestamp | Required for closed/withdrawn; absent/null otherwise | Server ending time; later independent learning does not change the ended activity outcome. |
| | `missionId` | string | Optional logical FK to `missions` | Assigned mission. |
| | `chapterId` | string | Optional logical FK to `chapters` | Chapter containing the assigned mission. |
| | `title` | string | Optional | Assignment display title. |
| | `instructions` | string | Optional | Teacher's assignment instructions. |
| | `dueAt` | timestamp | Optional | Assignment deadline. |
| | `publishedAt`, `updatedAt` | timestamp | Required by new teacher publisher | Server save/publication times. Drafts remain hidden from students. |
| `teacherStudentLinks/{teacherUid_studentUid}` | document ID | string | PK; `{teacherId}_{userId}` | Report lookup; every read still checks live ownership and membership. Not a progress copy. |
| | `teacherId` | string | Required; FK to `users` | Active approved teacher. |
| | `userId` | string | Required; FK to `users` | Joined student whose learning records are requested. |
| | `classId` | string | Required; FK to `classes` | Owned active class with active membership. Retaining this document does not retain access after the student leaves. |
| `learningSettings/progression` | document ID | string | Fixed ID: `progression` | XP and review progression policy. |
| | `xpPerLevel` | integer | Required; positive | XP needed for each level. |
| | `version` | integer | Required; positive | Policy version. |
| | `reviewAfterDays` | integer | Optional; configured range 1–365 | Interval used to schedule return-to-learn review. |
| `learningSettings/bayaniAI` | document ID | string | Fixed ID: `bayaniAI` | Bayani AI feature configuration. |
| | `enabled` | boolean | Required in setup config | Whether AI assistance is enabled. |
| | `model` | string | Setup/config field | AI model identifier. |
| | `appCheckSiteKey` | string | Setup/config field | Client App Check site key; may be empty until configured. |
| | `maxMessageCharacters` | integer | Setup/config field | Maximum message length. |
| | `welcomeMessage` | string | Setup/config field | Opening message shown by Bayani. |
| | `systemInstruction` | string | Setup/config field | Teaching and response policy text. |

## Learning content catalog

Catalog documents are server/admin-managed and read-only to students. Requirements below describe observed application behavior; they do not imply that Firestore Rules validates every catalog write.

| Collection | Field | Firestore type | Key / requirement | Description |
|---|---|---|---|---|
| `eras/{eraId}` | document ID | string | PK | Unique historical era. |
| | `title`, `description` | string | Display fields | Era name and overview. |
| | `order` | number | Optional; used for sorting | Position in the learning sequence. |
| | `status` | string | `active` for accessible chapters | Publication state. |
| `chapters/{chapterId}` | document ID | string | PK | Unique chapter. |
| | `eraId` | string | Optional logical FK to `eras` | Parent era; some chapters can be ungrouped. |
| | `title`, `description` | string | Display fields | Chapter name and overview. |
| | `order` | number | Optional; used for sorting | Position within an era/path. |
| | `status` | string | Must be `active` for learning access | Publication state. |
| | `contentReady` | boolean | Optional; defaults true in some checks | Whether chapter content is ready to access. |
| `missions/{missionId}` | document ID | string | PK | Unique mission. |
| | `chapterId` | string | Required logical FK to `chapters` | Parent chapter. |
| | `title`, `description`, `introduction` | string | Optional content/display fields | Mission name and introductory text. |
| | `learningObjective` | string | Optional | Main learning objective. |
| | `learningObjectives` | list<string> | Optional | Detailed learning objectives. |
| | `lessonRecap` | string | Optional | Mission summary. |
| | `sourceUrls` | list<string> | Optional | Sources associated with the learning content. |
| | `order` | number | Optional; used for sorting | Mission order within a chapter. |
| | `status` | string | Must be `active` for use | Publication state. |
| | `xpReward` | integer | Nonnegative; defaults to 0 in reward logic | XP awarded for first mission completion. |
| `storyScenes/{sceneId}` | document ID | string | PK | Unique lesson scene. |
| | `missionId` | string | Required logical FK to `missions` | Parent mission. |
| | `title`, `content` | string | Lesson content | Scene title and narrative. |
| | `order` | number | Used for scene sequence | Position within the mission. |
| | `status` | string | Must be `active` for supported workflows | Publication state. |
| | `imageUrl`, `imageFit`, `imageAlt`, `imageCaption` | string | Optional presentation fields | Illustration path, display fit, alternative text, and caption. |
| | `visualSymbol` | string | Optional | Scene symbol/emoji. |
| | `exploreIntroduction` | string | Optional | Instructions for exploring scene clues. |
| | `exploreItems` | list<map> | Optional | Clue cards; observed item fields include `title`, `hint`, `discovery`, and `icon`. Journal records refer to these by list index. |
| | `reviewTopics` | list<string> | Optional | Topic IDs associated with review. |
| | `learningHelp` | map | Optional | Support content; observed children include `explanation`, `guidingQuestion`, `example`, and `vocabulary` (list of `{term, definition}` maps). |
| | decision activity fields | string/list<string> | Optional | `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, `decisionExplanation`. |
| | discovery/key-term fields | string | Optional | Observed fields include `discoveryTitle`, `discoveryText`, `keyTerm`, and `keyTermDefinition`. |
| | `sourceUrls` | list<string> | Optional | References associated with the scene. |
| `quizzes/{quizId}` | document ID | string | PK | Unique mission quiz. |
| | `missionId` | string | Required logical FK to `missions` | Mission assessed. |
| | `title`, `description` | string | Optional display fields | Quiz name and learner-facing description. |
| | `order` | number | Optional | Ordering when multiple quizzes belong to a mission. |
| | `status` | string | Must be `active` to start | Publication state. |
| | `questionCount` | integer | Required by quiz-selection logic; 1–200 | Number of questions in an attempt. |
| | `passingScore` | number | Required by quiz policy; 0–100 | Minimum percentage to pass. |
| | `questionBlueprint` | list<map> | Required by quiz-selection logic | Each entry has `topic` (string), `difficulty` (string), and `count` (positive integer); counts sum to `questionCount`. It defines scored topic quotas and baseline difficulty. Prior mastery selects the starting level, and answers can reroute later questions while preserving quotas. A separate follow-up adapts to answers without changing the mission score. |
| | `practicePolicy` | map | Optional adaptive-practice configuration | `difficultyLevels` is an ordered list; `startDifficulty` selects the initial level when no core topic was missed, and `reviewDifficulty` selects it when review topics were found. If absent, available `easy`/`medium`/`hard` practice levels are used. |
| `questions/{questionId}` | document ID | string | PK | Unique quiz question. |
| | `quizId` | string | Required logical FK to `quizzes` | Parent quiz/question bank. |
| | `topic`, `difficulty` | string | Required for initial blueprint selection and adaptive routing | Topic and level tags used to preserve topic coverage and select the next scored question. A varied active difficulty bank enables stronger adaptation. |
| | `status` | string | Must be `active` to be selected | Publication state. |
| | `order` | number | Optional display order | Preferred question ordering. |
| | `question` | string | Required by question UI | Prompt. |
| | `optionA`, `optionB`, `optionC`, `optionD` | string | Required for four-choice items | Answer option text. |
| | `correctAnswer` | string | Answer key, commonly `A`–`D` | Correct option. |
| | `explanation`, `historicalClue` | string | Optional | Answer explanation and supporting historical context. |
| | `learningPoint` | string | Optional | Short concept or skill reinforced by the question. |
| | `answerExplanations` | map<string,string> | Optional | Choice-specific feedback keyed by answer letter. |
| `practiceQuestions/{practiceQuestionId}` | document ID | string | PK | Unique practice item. |
| | `missionId` | string | Required logical FK to `missions` | Mission context. |
| | `topic`, `topicLabel`, `difficulty` | string | Topic/difficulty metadata | Machine topic ID, learner-facing topic label, and difficulty level. |
| | `status` | string | Must be `active` for practice | Publication state. |
| | `order` | number | Optional | Bank ordering. |
| | `question`, `optionA`–`optionD`, `correctAnswer` | string | Choice-question fields | Prompt, four answer choices, and answer key. |
| | `explanation`, `learningPoint`, `hint` | string | Optional | Feedback, key idea, and hint. |
| | `answerExplanations`, `answerHints` | map<string,string> | Optional | Per-answer explanation/hint keyed by choice letter. |
| | `reviewEvidencePolicy` | map | Optional | Review policy; observed fields include `version`, `minDistinctQuestions`, `requiredDifficulty`, and `minCleanSessions`. |
| | `contentReviewStatus` | string | Optional editorial metadata | Content review state/note. |
| `chapterChallenges/{challengeId}` | document ID | string | PK | Unique chapter assessment. |
| | `chapterId` | string | Required logical FK to `chapters` | Parent chapter. |
| | `title`, instructions/description | string | Optional display fields | Challenge name and learner instructions. |
| | `order` | number | Optional | Ordering when multiple challenge records exist. |
| | `status` | string | Must be `active` for completion | Publication state. |
| | `passingScore` | number | Required by challenge policy; 0–100 | Minimum percentage for chapter completion. |
| `chapterChallengeQuestions/{questionId}` | document ID | string | PK | Unique question/task in a chapter challenge. |
| | `challengeId` | string | Required logical FK to `chapterChallenges` | Parent chapter challenge. |
| | `order` | number | Used for question sequence | Position in the challenge. |
| | question prompt/type fields | string | Varies by item type | Prompt and type-specific interaction metadata. |
| | `optionA`–`optionD`, `correctAnswer` | string | Conditional on choice-question type | Choice text and answer key. |
| | `evidenceTask` | map | Conditional on evidence-decision type | Nested evidence task configuration, including cards that point to scene clue indices and a correct evidence/conclusion. |
| | matching/task fields | map/list | Conditional on interaction type | Matching pairs, trade simulation, or other type-specific task data. |
| `dailyChallenges/{dailyChallengeId}` | document ID | string | PK | Unique daily question bank item. |
| | `status` | string | Must be `active` to be selected | Publication state. |
| | `order` | number | Optional; used before document ID as sort tie-breaker | Position in daily rotation. |
| | `question`, `optionA`–`optionD`, `correctAnswer` | string | Required by daily question flow | Prompt, choices, and answer key. |
| | `xpReward` | integer | Nonnegative; defaults to 0 in reward logic | XP for correct first completion. |
| `artifacts/{artifactId}` | document ID | string | PK | Unique collectible catalog item. |
| | `missionId` | string | Required for reward matching | Mission that awards the artifact. |
| | `status` | string | Must be `active` to award | Publication state. |
| | `name`, `title`, `description`, `icon`, `rarity` | string | Optional display/reward fields | Collectible label, description, icon, and rarity. |
| | image metadata | string/map | Optional | Image path and display/accessibility data where present. |
| `badges/{badgeId}` | document ID | string | PK | Unique badge catalog item. |
| | `chapterId` | string | Required for reward matching | Chapter associated with the badge. |
| | `status` | string | Must be `active` to award | Publication state. |
| | `name`, `title`, `description`, `icon`, `rarity` | string | Optional display/reward fields | Badge label, description, icon, and rarity. |
| | image metadata | string/map | Optional | Image path and display/accessibility data where present. |

## Student progress, attempts, and activity records

| Collection / document | Field | Firestore type | Key / requirement | Description |
|---|---|---|---|---|
| `studentProgress/{uid_missionId}` | document ID | string | PK; `{userId}_{missionId}` | One mission completion record per student/mission. |
| | `userId` | string | Required; FK to `users` and must equal Auth UID | Record owner. |
| | `chapterId`, `missionId`, `quizId` | string | Required; logical FKs | Chapter, mission, and quiz completed. |
| | `completed` | boolean | Required; true on creation | Mission completion state. |
| | `bestScore` | integer | Required; 0–100 | Highest score. Replays may only increase this value. |
| | `completedAt`, `updatedAt` | timestamp | Required on creation/update | First completion and latest score update. |
| | `xpEarned` | integer | Required by direct-client rules; nonnegative | XP reward for first completion. The Admin callable writer does not currently include this field. |
| `studentQuizAttempts/{uid_attemptId}` | document ID | string | PK; `{userId}_{attemptId}` | One quiz submission attempt. Current browser writer uses this shape; Admin callable writer has an alternate shape noted below. |
| | `userId`, `chapterId`, `missionId`, `quizId`, `attemptId` | string | Required by direct-client rules; logical FKs for content fields | Attempt owner and quiz context. |
| | `questionIds` | list<string> | Required by direct-client rules; unique IDs | Scored questions in the order adaptively presented during this attempt. |
| | `answers` | map | Required by direct-client rules | Submitted response keyed by question ID. Values can be choice strings or structured maps for interactive tasks. |
| | `score` | integer | Required; 0–100 | Score percentage. |
| | `correctAnswers`, `totalQuestions` | integer | Required | Number correct and number of questions. |
| | `passed` | boolean | Required | Whether score met quiz `passingScore`. |
| | `topicsForReview` | list<string> | Required | Unique missed core and adaptive follow-up topics, capped at `totalQuestions` for Firestore rule compatibility. |
| | `completedAt` | timestamp | Required | Submission time. |
| | `response` | map | Required by direct-client rules | Cached result/reward response used for replay/idempotency. The browser mission-quiz writer may include `adaptiveFollowup` when tagged practice questions are available. |
| | `response.adaptiveFollowup.questionIds` | list<string> | Optional | Ordered IDs of up to three adaptive follow-up questions; these are separate from scored mission `questionIds`. |
| | `response.adaptiveFollowup.answers` | map | Optional | Follow-up answer choices keyed by practice-question ID. |
| | `response.adaptiveFollowup.correctAnswers`, `totalQuestions`, `score` | integer | Optional | Follow-up diagnostic result; it does not affect mission score, passing, completion, or XP. |
| | `response.adaptiveFollowup.items` | list<map> | Optional | Per-question snapshot: `questionId`, `topic`, `difficulty`, `selectedAnswer`, `correctAnswer`, and `isCorrect`. |
| | `answerFingerprint` | string | Optional; Admin callable writer | Server-calculated fingerprint used to verify retries. |
| | `xpReward` | integer | Optional; Admin callable writer | XP awarded for this attempt; commonly zero after prior completion. |
| | `response` (callable variant) | map | Present on successful Admin callable writes | Callable result including progression and reward information. |
| `studentChapterProgress/{uid_chapterId}` | document ID | string | PK; `{userId}_{chapterId}` | One chapter challenge completion record per student/chapter. |
| | `userId`, `chapterId`, `challengeId` | string | Required; logical FKs | Owner, chapter, and challenge. |
| | `completed` | boolean | Required; true on creation | Completion state. |
| | `bestScore` | integer | Required; 0–100 | Highest chapter challenge score. |
| | `completedAt`, `updatedAt` | timestamp | Required | Completion and latest score update time. |
| `studentDailyChallenges/{uid_dateKey}` | document ID | string | PK; `{userId}_{dateKey}` | One daily completion per user and Philippines date. |
| | `userId`, `challengeId` | string | Required; logical FKs | Owner and selected daily challenge. |
| | `dateKey` | string | Required; `YYYY-MM-DD`, UTC+8 | Local challenge date. |
| | `completed`, `correct` | boolean | Required by completion flow; true for reward | Completion and correctness state. |
| | `selectedAnswer` | string | Required; normalized answer key | Selected option, normally `A`–`D`. |
| | `xpEarned` | integer | Required; nonnegative | XP issued for first correct completion. |
| | `bestScore` | integer | Required; 100 for correct daily completion | Daily question score. |
| | `completedAt`, `updatedAt` | timestamp | Required | Completion and update time. |
| `studentPracticeProgress/{autoId}` | document ID | string | PK; auto-generated | Append-only practice session. |
| | `userId`, `chapterId`, `missionId` | string | Required; owner FK and content references | Student and practice context. |
| | `completedAt` | timestamp | Required | Session completion time. |
| | `totalQuestions` | integer | Required; greater than 0 | Number of questions completed. |
| | `firstTryCorrectCount` | integer | Required; 0 through `totalQuestions` | Number answered correctly on the first attempt. |
| | `questionResults` | list<map> | Required; list length equals `totalQuestions` | Each result records `questionId`, `topic`, `difficulty`, `firstTryCorrect`, and `attempts`. |
| | `topicsForReview` | list<string> | Required | Topics missed on first try. |
| `studentArtifacts/{uid_artifactId}` | document ID | string | PK; `{userId}_{artifactId}` | Student ownership of a mission artifact. |
| | `userId`, `artifactId`, `missionId`, `chapterId` | string | Required; logical FKs | Owner and artifact/lesson context. |
| | `earnedAt` | timestamp | Required | Award time. |
| `studentBadges/{uid_badgeId}` | document ID | string | PK; `{userId}_{badgeId}` | Student ownership of a chapter badge. |
| | `userId`, `badgeId`, `chapterId`, `challengeId` | string | Required; logical FKs | Owner and badge/challenge context. |
| | `earnedAt` | timestamp | Required | Award time. |
| `studentEvidenceJournal/{uid_sceneId_clueIndex}` | document ID | string | PK; `{userId}_{sceneId}_{clueIndex}` | Saved reference to one explored clue. |
| | `userId`, `chapterId`, `missionId`, `sceneId` | string | Required; logical FKs | Owner and lesson context. |
| | `clueIndex` | integer | Required; zero-based and within `exploreItems` | Index of the saved clue in its scene. |
| | `savedAt` | timestamp | Required | Save time. |
| `studentReviewEvents/{eventId}` | document ID | string | PK; auto-generated | Append-only event for lesson review. |
| | `userId`, `chapterId`, `missionId` | string | Required; logical FKs | Owner and reviewed lesson context. |
| | `topic` | string | Required; 1–160 chars | Topic reviewed. |
| | `sceneIds` | list<string> | Required; 1–50 entries | Scene IDs associated with the review. |
| | `kind` | string | Required; currently `lesson-review` | Review event type. |
| | `completedAt` | timestamp | Required | Review completion time. |
| `studentLearningDrafts/{uid_kind_contentId}` | document ID | string | PK; `{userId}_{kind}_{missionId or chapterId}` | Resumable in-progress activity state. |
| | `userId` | string | Required; FK to `users` and must equal Auth UID | Draft owner. |
| | `kind` | string | Required; `story`, `quiz`, `practice`, or `chapter` | Activity type. |
| | `chapterId` | string | Required; logical FK to `chapters` | Chapter context. |
| | `missionId` | string or null | Required for story/quiz/practice; null for chapter challenge | Mission context when applicable. |
| | `state` | map | Required | Saved UI state. Shape depends on `kind`: story progress/plans, quiz answers and flags, practice queue/results, or chapter challenge answers/index. |
| | `updatedAt` | timestamp | Required | Last draft save time. |

## Alternate writer note

An additional [trusted-assessment backend proposal](trusted-assessment-preparation.md) is prepared locally but inactive. Its private answer-key/attempt/history/counter collections and `serverVerified` provenance field are not current deployed data-model requirements. No such collections were created and the active frontend remains on the direct client writer until a coordinated cutover.

The 30 October student rule hardening adds no collections or fields. Direct-client attempt `response` score/pass/correctness/topics must match the outer attempt; `firstCompletion` and `xpReward` must agree with catalog rewards and fresh matching completion evidence when claimed. The browser validates and reconstructs replay output instead of trusting arbitrary response fields. Practice sessions are bounded to 1–200 results and require active matching parent content. Draft creates/updates also require active, ready parent content; updates require the existing owner. These checks do not make browser grades or practice evidence server-verified. See [security scope and publication](student-security-hardening-2026-10-30.md).

The repository also exports a callable Admin SDK reward function. The current browser code imports the direct Firestore client writer, whose attempt format is validated in `firestore.rules`. The callable function writes a different `studentQuizAttempts` variant with `answerFingerprint` and `xpReward`, and may omit `questionIds` and `answers`; Admin SDK writes bypass Firestore Rules. The table records both shapes so that the dictionary reflects all in-repository writers.

Adaptive mastery is derived from a student's existing `studentQuizAttempts`, `studentPracticeProgress`, and `studentReviewEvents` records; there is no separate aggregate mastery collection. Mission quiz startup uses this history to seed topic priorities and the starting difficulty, then updates the next-question choice from answers in the current attempt.

## Browser personalization

These settings are local storage entries, separate from the Firestore collections above.

| Local storage key | Value | Use |
|---|---|---|
| `lakbay.reading-surface` | `paper` or `dark` | Device reading-surface preference; paper is the default. |
| `lakbay.discovery-wall.v1.{encoded uid}` | JSON list of up to three `{kind, id}` maps | Personal profile pins. `kind` is `artifact` or `journal`; `id` is the artifact catalog document ID or saved journal document ID. Only references are stored. The profile verifies current ownership and authored content before rendering. Pins are local to this browser and do not grant access or affect rewards. |

## Schema basis

Field names and constraints were compiled from `firestore.rules`, JavaScript client collection reads/writes, Firebase Functions, and repository content migration examples. Catalog and teacher/admin-managed records can contain optional fields not exhaustively constrained by student rules; compare those documents with a current Firestore export when an exact deployed-instance dictionary is required.
# Narration preference

`lakbay.narrator-voice` is a browser-local preference containing the selected Web Speech API voice URI. The mission and playground share it. A missing voice falls back to an available English voice or the device default. It contains no learning progress and is not stored in Firestore. The narrator uses a slightly brighter pitch and clear pace; the underlying voice and pronunciation depend on the device. Voice selection, voice-loading fallback and preserved narration text have automated checks; subjective audio quality has not been verified by listening.


## Published class announcements (31 October 2026)

| Field | Type | Meaning |
| --- | --- | --- |
| classAnnouncements/{announcementId} | document | Optional class message; separate from assignments. |
| classId | string | Existing class ID. |
| status | string | Only published messages are visible to joined active students. Drafts remain inaccessible. |
| title | string | Required nonempty message heading, rendered as text. |
| body | string | Required nonempty message body, rendered as text with line breaks preserved. |
| publishedAt | timestamp, optional | Display/order time; shown in Philippine time. Missing timestamps are not invented. |

Students cannot write announcements. Active members can read published messages; leaving revokes those reads. The current teacher contract allows qualified teachers to manage announcements for their owned active classes, including drafts. See [teacher workflow](teacher-workflow.md) and the `classAnnouncements` rules for the exact access checks.

### Mission-specific teacher feedback

| Collection / Document | Field | Type | Requirement | Description |
| --- | --- | --- | --- | --- |
| `classFeedback/{feedbackId}` | document ID | string | Required PK | Deterministic classId_userId_missionId; one current feedback message per student, class and mission. |
| | `classId` | string | Required FK to classes | Owning class. |
| | `userId` | string | Required FK to users | Student recipient; must be an active class member when the teacher sends. |
| | `teacherId` | string | Required FK to users | Approved owning teacher; cannot change on revision. |
| | `missionId` | string | Required FK to missions | Mission discussed by the feedback. |
| | `chapterId` | string | Required FK to chapters | Must match the active mission's chapter. |
| | `body` | string | Required, 1-1500 chars | Student-visible guidance. Never store private support notes here. |
| | `revision` | integer | Required | Starts at 1 and increases by 1 per teacher update. |
| | `createdAt` | timestamp | Required | Server timestamp on first send; preserved thereafter. |
| | `updatedAt` | timestamp | Required | Server timestamp of the latest teacher send. |
| | `readAt` | timestamp | Optional, nullable | Null on teacher send; only the recipient can set it to the server time. It means marked as read, not demonstrated understanding. |

The student can read only their feedback while a class member. The owning teacher can send/read feedback only for active members of an active class. Students can change only readAt; sending a revision clears it. Private teacher notes are outside this entity. Messages do not change scores, mission completion or rewards. The new rules and local UI must be published before hosted use.

### Private teacher follow-up

| Collection / Document | Field | Type | Requirement | Description |
| --- | --- | --- | --- | --- |
| `teacherSupportNotes/{noteId}` | document ID | string | Required PK | Deterministic classId_userId_missionId; one current private follow-up per student, class and mission. |
| | `classId` | string | Required FK to classes | Owned active class; active student membership required for reading and writing notes. |
| | `userId` | string | Required FK to users | Student discussed in the follow-up. Students cannot access these records. |
| | `teacherId` | string | Required FK to users | Approved owning teacher; other teachers cannot read this note. |
| | `missionId` | string | Required FK to missions | Active mission discussed in the note. |
| | `chapterId` | string | Required FK to chapters | Active chapter containing the mission. |
| | `status` | string | Required | planned or discussed; teacher action, not student mastery or review resolution. |
| | `note` | string | Required, 1-1500 chars | Private teacher note; never stored in student-visible feedback. |
| | `revision` | integer | Required | Starts at 1 and increments on each save; prevents stale concurrent UI edits. |
| | `createdAt` | timestamp | Required | First server save time; preserved on updates. |
| | `updatedAt` | timestamp | Required | Latest server save time. |
| | `statusAt` | timestamp | Required | Server time when status was set or changed. Ordinary note edits preserve it. Later quiz evidence is compared to this boundary without asserting causation or mastery. |

Only the approved owning teacher can read or save a note for an active member of an active class. Students, other teachers and administrators have no rule granting access. Archive or leaving revokes the report access. Reopening a discussed note as planned creates a new statusAt boundary. This entity retains the latest note, not a full discussion-event history; it does not change feedback, scores, completion or rewards.

The Historical Timeline reuses eras, chapters, missions and owned progress. It uses authored ordering/dateRange labels and normal journey prerequisites; it does not fabricate exact event dates or create a second curriculum store.

Bayani generated review questions remain transient in the page: question, four options A-D, suggested answer and explanation. They are not saved as official questions, grades, mastery evidence or rewards. The generator receives bounded authored lesson text, not account identity, scores or answer keys.

## Student level cosmetics (31 October 2026)

| Field | Type | Meaning |
| --- | --- | --- |
| studentCosmetics/{uid} | document | Account-owned cosmetic preference; document ID equals the Auth UID. |
| frameId | string | none, bamboo, sunburst or guardian. Server checks the saved profile level for earned frames. |
| updatedAt | timestamp | Server time of the preference write. |

Titles and cosmetic eligibility derive from the existing saved level; no extra XP or reward ownership counters are written. Only the owner can get/create/update the preference. Listing/deletion and extra fields are denied to students. Choosing Classic Explorer resets the equipped frame to none. Any future administrator account-erasure procedure must also remove the UID-keyed cosmetic document, rather than relying on userId-field queries.

## Journey finale (31 October 2026)

| Field | Type | Meaning |
| --- | --- | --- |
| learningSettings/journeyFinale | document | Frozen selected-journey requirements; active students can get this exact document, not list or write it. |
| enabled | boolean | Must be true before the ending can be evaluated. |
| id | string | Version identifier, currently philippine-history-journey-v1. |
| title | string | Human-readable journey label. |
| chapters | array of maps | Required id/title/eraId entries; currently 16 chapters including required prerequisites/prologue. |
| missions | array of maps | Required id/chapterId pairs; currently 66 missions. |
| finalChapterId | string | Last chapter challenge's finale destination, currently chapter-15. |

The Journey Complete badge derives from fresh owned studentChapterProgress and studentProgress completions matching every configured requirement. It is not an extra studentBadges document, XP award or cosmetic preference. Its completion date is the latest valid required chapter completedAt; missing evidence dates stay unavailable. Catalog expansion must not silently redefine this frozen version.

`lakbay.finale-reflection:{uid}:{definitionId}` stores an optional ungraded thought (maximum 1,000 characters) only in this browser after explicit Save. Clear removes it locally. It is never sent to Firestore or AI. A locally generated PNG completion card uses a transient explorer name and saved completion evidence, and is a system achievement rather than a school certificate.

## Authored discovery activities and community

`js/discovery-cases.js` contains three public authored companion cases mapped by chapterId + missionId: community-clues, trade-clues and boat-clues. Each contains a goal, setting, three labelled clues, a conclusion question/options/answer index, explanation, two comparison classifications/reasons, a Bayani claim/support index/evidence limit, and source metadata. These are practice content, not protected quiz keys or official assessment records. Activity answers and visited clues are transient page memory, cleared on disposal; no localStorage or Firestore record is added.

The learning community derives counts from currently available ready catalog missions and owned completed studentProgress rows with matching chapterId and missionId. Five visual places reveal at one completion and at 25/50/75/100 percent of available missions. These are calculated decorations with lesson return links, not studentBadges or studentCosmetics ownership. Account changes clear the view. Catalog changes can change this visual's thresholds; the finale definition remains separately frozen.

Museum dialogs reuse owned artifact catalog/learningDetails data. An optional string learningDetails.historicalUse is displayed when supplied; missing historical-use/provenance details are not invented. New dialogs are ephemeral and produce no reward writes.

## All-mission learning guides

`js/mission-learning-guides.js` supplies one authored guide for each of the 66 active chapterId/missionId pairs. Each has a central question, why-it-matters explanation, one application scenario, three choices, three explanations and editorial Grade 5 curriculum references. These are public authored companion practice, not official quiz results or AI-generated responses. Answers and optional explanations stay in page memory and are cleared on activity disposal/account change. No localStorage, Firestore scores or rewards are written.

The published aggregate migration stores this object as missions/{id}.learningGuide, including a referenceNote that distinguishes editorial quarter/row locators from official competency codes. The frontend has the authored guides bundled, so the field is not required for rendering. No student write rule is added. Recap vocabulary derives from existing scene keyTerm/keyTermDefinition fields. Short-reading parts preserve the complete authored scene text while changing its presentation boundaries.

## Review publication coordination

`classReviewPublicationState/{classId}` stores `classId` (string, class reference matching document ID), `revision` (positive integer, starts at 1 and increases exactly by 1), and `updatedAt` (server timestamp). Updated teacher clients compare this revision before committing review writes, preventing stale duplicate-check confirmations across tabs/devices. Only the owning approved teacher can get it; writes require an active owned class. List/delete and student access are denied. This is implemented locally and requires matching rules/frontend publication. It is coordination metadata, not a review score or a database uniqueness constraint; intentional rounds and legacy/direct writes remain possible. See docs/duplicate-review-warning.md.

## Practice hint-request evidence addition - 6 November 2026

Storage: studentPracticeProgress.questionResults[].hintRequested (BOOLEAN OR NULL; optional for historical rows). True records an in-app AI hint request before that question was answered correctly; false records no request for a newly tracked question; absent/null means unknown. This does not prove hint delivery, unaided work or learning. studentLearningDrafts.state.hintRequested carries the same optional boolean/null for the current practice question across reloads; completed draft result rows retain the nested result attribute. No separate collection or authoritative grade is added. Current rules do not validate each nested flag individually; evidence remains browser-reported. Implemented locally; not yet published. See docs/practice-hint-evidence.md.
