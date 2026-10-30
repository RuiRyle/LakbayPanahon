# LakbayPanahon Data Dictionary

## Conventions

Firestore document IDs are the primary identifiers. `PK` means document ID; `FK` means a string containing another document's ID (a logical reference, not a SQL-enforced foreign key). Timestamps are Firestore `Timestamp` values. A field marked optional may be absent. Nested maps/lists can have different shapes by activity type. This dictionary covers the 29 root collections referenced by the checked-in Firestore rules and application code; server-managed fields not exposed to the student client are marked accordingly.

## Identity, classes, and configuration

| Collection / document | Field | Firestore type | Key / requirement | Description |
|---|---|---|---|---|
| `users/{uid}` | document ID | string | PK; equals Firebase Auth UID | Application profile for the authenticated account. |
| | `firstName` | string | Required; 1–100 chars | User's first name. |
| | `middleName` | string | Optional; up to 100 chars | User's middle name; empty string is accepted. |
| | `lastName` | string | Required; 1–100 chars | User's last name. |
| | `email` | string | Required | Must equal the authenticated account email on profile creation. |
| | `role` | string | Required; `student` or `teacher` | Application role. |
| | `status` | string | Required; `active` student or `pending` teacher at creation | Account status used for access control. |
| | `createdAt` | timestamp | Required on creation | Profile creation time. |
| | `updatedAt` | timestamp | Optional | Most recent profile or reward update time. |
| | `avatarId` | string | Optional; logical FK to `avatars` | Selected avatar catalog document. |
| | `profileSetupCompletedAt` | timestamp | Optional | Time initial profile setup was completed. |
| | `profileSetupDismissedAt` | timestamp | Optional | Time initial profile setup was dismissed. |
| | `xp` | integer | Optional; nonnegative in reward flow | Total experience points. |
| | `level` | integer | Optional; derived from XP and progression settings | Current learning level. |
| | `learningStreak` | integer | Optional | Number of consecutive learning days. |
| | `lastStreakDate` | string | Optional; `YYYY-MM-DD` in UTC+8 | Date key of the latest daily challenge streak update. |
| | `lastRewardKind` | string | Optional; `mission` or `daily` | Type of the most recently paired reward transaction. |
| | `lastRewardId` | string | Optional | Mission ID or daily date key associated with that reward transaction. |
| `avatars/{avatarId}` | document ID | string | PK | Unique avatar option. |
| | `name` | string | Required by profile catalog | Display name. |
| | `status` | string | `active` or `inactive` | Only active avatars are available for selection. |
| | `kind` | string | `initials` or `emoji` | How the avatar is rendered. |
| | `icon` | string | Required when `kind=emoji` | Emoji/icon displayed for the avatar. |
| | `order` | number | Optional | Sort order in the avatar picker. |
| | `isDefault` | boolean | Optional | Identifies the default avatar. |
| `classes/{classId}` | document ID | string | PK | Unique class. |
| | `status` | string | Required by membership/access logic; active class required | Class availability state. |
| | `name` | string | Optional display field | Class name shown to a member. |
| | `teacherName` | string | Optional display field | Teacher name shown to a member. |
| | `description` | string | Optional display field | Class description. |
| `classJoinCodes/{code}` | document ID | string | PK; 12 uppercase letters/digits | Server-managed class invitation code. |
| | `classId` | string | Required logical FK to `classes` | Class that the code joins. |
| | `status` | string | Must be `active` to join | Code availability. |
| | `expiresAt` | timestamp | Optional | Code expiration time. |
| `classMembers/{uid_classId}` | document ID | string | PK; `{userId}_{classId}` | Unique student membership in a class. |
| | `userId` | string | Required; FK to `users`, must equal signed-in UID | Member account. |
| | `classId` | string | Required logical FK to `classes` | Joined class. |
| | `joinCode` | string | Required logical FK to `classJoinCodes` | Code used to join. |
| | `status` | string | Required; `active` on creation | Membership state. |
| | `joinedAt` | timestamp | Required | Membership creation time. |
| `classAssignments/{assignmentId}` | document ID | string | PK | Unique class assignment. |
| | `classId` | string | Required for class query; FK to `classes` | Assigned class. |
| | `status` | string | `published` to be visible | Publication state. |
| | `missionId` | string | Optional logical FK to `missions` | Assigned mission. |
| | `chapterId` | string | Optional logical FK to `chapters` | Chapter containing the assigned mission. |
| | `title` | string | Optional | Assignment display title. |
| | `instructions` | string | Optional | Teacher's assignment instructions. |
| | `dueAt` | timestamp | Optional | Assignment deadline. |
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

## Schema basis

Field names and constraints were compiled from `firestore.rules`, JavaScript client collection reads/writes, Firebase Functions, and repository content migration examples. Catalog and teacher/admin-managed records can contain optional fields not exhaustively constrained by student rules; compare those documents with a current Firestore export when an exact deployed-instance dictionary is required.
