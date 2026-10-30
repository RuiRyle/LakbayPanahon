# LakbayPanahon Data Dictionary and ERD

## Scope and conventions

This document describes the Firestore data model used by the application, based on the repository's Firestore security rules and client code. Firestore is a document database: collections contain documents, and relationships below are logical references rather than SQL-enforced foreign keys. Unless noted, document IDs are strings and timestamps use Firestore `Timestamp` values. Fields marked **conditional** are required only for the corresponding record type or workflow.

Firebase Authentication stores credentials separately; the `users` collection stores the application's profile and learning state. The inventory below is the set of root Firestore collections found in the checked-in security rules and application code. This is a repository-complete logical inventory, not a live export: teacher/admin-created documents and optional catalog fields still need comparison with the deployed database before claiming every stored field is listed.

### Repository collection inventory

| Group | Firestore collection | Document examples / role |
|---|---|---|
| Identity | `users` | `{uid}` account profile, learning XP, level, streak, and reward state. |
| Identity | `avatars` | `{avatarId}` display/avatar catalog. |
| Class learning | `classes` | `{classId}` class information shown to a member. |
| Class learning | `classJoinCodes` | `{code}` server-managed invitation and expiry state. |
| Class learning | `classMembers` | `{uid}_{classId}` student membership. |
| Class learning | `classAssignments` | `{assignmentId}` published class work. |
| Configuration | `learningSettings` | Singleton documents `progression` and `bayaniAI`; both are read-only to students. |
| Learning catalog | `eras` | Historical eras. |
| Learning catalog | `chapters` | Era or standalone chapters. |
| Learning catalog | `missions` | Learning missions inside chapters. |
| Learning catalog | `storyScenes` | Story/lesson scenes for missions. |
| Learning catalog | `quizzes` | Mission quiz policies and metadata. |
| Learning catalog | `questions` | Mission quiz question bank. |
| Learning catalog | `practiceQuestions` | Mission practice bank. |
| Learning catalog | `chapterChallenges` | Chapter assessment definition. |
| Learning catalog | `chapterChallengeQuestions` | Items for chapter assessments. |
| Learning catalog | `dailyChallenges` | Date-selected daily question bank. |
| Learning catalog | `artifacts` | Mission collectible catalog. |
| Learning catalog | `badges` | Chapter badge catalog. |
| Student records | `studentProgress` | One mission completion/best-score record per student and mission. |
| Student records | `studentQuizAttempts` | Append-only quiz attempt and response records. |
| Student records | `studentChapterProgress` | Chapter challenge completion/best-score record. |
| Student records | `studentDailyChallenges` | One daily challenge completion per student and local date. |
| Student records | `studentPracticeProgress` | Append-only practice session history. |
| Student records | `studentArtifacts` | Student-to-artifact ownership records. |
| Student records | `studentBadges` | Student-to-badge ownership records. |
| Student records | `studentEvidenceJournal` | Saved lesson clue references. |
| Student records | `studentReviewEvents` | Lesson review history/events. |
| Student records | `studentLearningDrafts` | Resumable story, quiz, practice, or chapter activity state. |

**Inventory count:** 29 root collections (including `learningSettings`, which contains two known configuration documents). Firebase Authentication is a separate service and is not counted as a Firestore collection. No AI conversation/transcript collection is referenced by the current application code.

## Entity relationship diagram

```mermaid
erDiagram
    USER {
        string uid PK
        string email
        string role
        string status
        int xp
        int level
    }
    CLASS {
        string classId PK
        string status
    }
    CLASS_MEMBER {
        string membershipId PK
        string userId FK
        string classId FK
        string joinCode FK
        string status
        timestamp joinedAt
    }
    CLASS_JOIN_CODE {
        string code PK
        string classId FK
        string status
        timestamp expiresAt
    }
    CLASS_ASSIGNMENT {
        string assignmentId PK
        string classId FK
        string status
    }
    ERA {
        string eraId PK
        string title
        int order
        string status
    }
    CHAPTER {
        string chapterId PK
        string eraId FK
        string title
        int order
        string status
    }
    MISSION {
        string missionId PK
        string chapterId FK
        string title
        int order
        int xpReward
        string status
    }
    QUIZ {
        string quizId PK
        string missionId FK
        int questionCount
        int passingScore
        string status
    }
    QUESTION {
        string questionId PK
        string quizId FK
        string topic
        string difficulty
        string correctAnswer
    }
    STORY_SCENE {
        string sceneId PK
        string missionId FK
        int order
        string status
    }
    PRACTICE_QUESTION {
        string practiceQuestionId PK
        string missionId FK
        string topic
        string difficulty
        string status
    }
    CHAPTER_CHALLENGE {
        string challengeId PK
        string chapterId FK
        int passingScore
        string status
    }
    CHAPTER_CHALLENGE_QUESTION {
        string questionId PK
        string challengeId FK
        int order
        string questionType
    }
    DAILY_CHALLENGE {
        string dailyChallengeId PK
        string status
        int xpReward
    }
    ARTIFACT {
        string artifactId PK
        string missionId FK
        string status
    }
    BADGE {
        string badgeId PK
        string chapterId FK
        string status
    }
    STUDENT_PROGRESS {
        string progressId PK
        string userId FK
        string missionId FK
        string quizId FK
        int bestScore
        int xpEarned
    }
    STUDENT_QUIZ_ATTEMPT {
        string attemptRecordId PK
        string userId FK
        string quizId FK
        int score
        boolean passed
    }
    STUDENT_CHAPTER_PROGRESS {
        string chapterProgressId PK
        string userId FK
        string chapterId FK
        string challengeId FK
        int bestScore
    }
    STUDENT_DAILY_CHALLENGE {
        string dailyCompletionId PK
        string userId FK
        string challengeId FK
        string dateKey
        int xpEarned
    }
    STUDENT_PRACTICE_PROGRESS {
        string practiceProgressId PK
        string userId FK
        string missionId FK
        int totalQuestions
        int firstTryCorrectCount
    }
    STUDENT_ARTIFACT {
        string artifactOwnershipId PK
        string userId FK
        string artifactId FK
        timestamp earnedAt
    }
    STUDENT_BADGE {
        string badgeOwnershipId PK
        string userId FK
        string badgeId FK
        timestamp earnedAt
    }
    STUDENT_EVIDENCE_JOURNAL {
        string entryId PK
        string userId FK
        string sceneId FK
        int clueIndex
        timestamp savedAt
    }
    STUDENT_REVIEW_EVENT {
        string eventId PK
        string userId FK
        string missionId FK
        string topic
        timestamp completedAt
    }
    STUDENT_LEARNING_DRAFT {
        string draftId PK
        string userId FK
        string kind
        string chapterId FK
        string missionId FK
        timestamp updatedAt
    }

    USER ||--o{ CLASS_MEMBER : joins
    CLASS ||--o{ CLASS_MEMBER : has
    CLASS ||--o{ CLASS_ASSIGNMENT : publishes
    CLASS_JOIN_CODE }o--|| CLASS : grants_access

    ERA ||--o{ CHAPTER : groups
    CHAPTER ||--o{ MISSION : contains
    MISSION ||--o{ QUIZ : assessed_by
    QUIZ ||--o{ QUESTION : draws_from
    MISSION ||--o{ STORY_SCENE : taught_through
    MISSION ||--o{ PRACTICE_QUESTION : practiced_with
    CHAPTER ||--o{ CHAPTER_CHALLENGE : assessed_by
    CHAPTER_CHALLENGE ||--o{ CHAPTER_CHALLENGE_QUESTION : contains
    MISSION ||--o{ ARTIFACT : awards
    CHAPTER ||--o{ BADGE : awards

    USER ||--o{ STUDENT_PROGRESS : completes
    USER ||--o{ STUDENT_QUIZ_ATTEMPT : attempts
    USER ||--o{ STUDENT_CHAPTER_PROGRESS : completes
    USER ||--o{ STUDENT_DAILY_CHALLENGE : completes
    USER ||--o{ STUDENT_PRACTICE_PROGRESS : practices
    USER ||--o{ STUDENT_ARTIFACT : earns
    USER ||--o{ STUDENT_BADGE : earns
    USER ||--o{ STUDENT_EVIDENCE_JOURNAL : saves
    USER ||--o{ STUDENT_REVIEW_EVENT : records
    USER ||--o{ STUDENT_LEARNING_DRAFT : saves

    MISSION ||--o{ STUDENT_PROGRESS : tracked_by
    CHAPTER ||--o{ STUDENT_PROGRESS : contextualizes
    QUIZ ||--o{ STUDENT_PROGRESS : passed_as
    QUIZ ||--o{ STUDENT_QUIZ_ATTEMPT : attempted_as
    QUESTION }o--o{ STUDENT_QUIZ_ATTEMPT : included_in
    CHAPTER ||--o{ STUDENT_CHAPTER_PROGRESS : tracked_by
    CHAPTER_CHALLENGE ||--o{ STUDENT_CHAPTER_PROGRESS : passed_as
    DAILY_CHALLENGE ||--o{ STUDENT_DAILY_CHALLENGE : completed_as
    ARTIFACT ||--o{ STUDENT_ARTIFACT : owned_as
    BADGE ||--o{ STUDENT_BADGE : earned_as
    STORY_SCENE ||--o{ STUDENT_EVIDENCE_JOURNAL : source_for
    STORY_SCENE }o--o{ STUDENT_REVIEW_EVENT : reviewed_in
    CHAPTER ||--o{ STUDENT_PRACTICE_PROGRESS : contextualizes
    MISSION ||--o{ STUDENT_PRACTICE_PROGRESS : records
    CHAPTER ||--o{ STUDENT_LEARNING_DRAFT : draft_for
    MISSION o|--o{ STUDENT_LEARNING_DRAFT : optional_mission
```

**Relationship notes:** `USER` is the Firestore profile document and has the same ID as its Firebase Authentication UID. Completion/ownership document IDs are usually deterministic composites such as `{userId}_{missionId}` or `{userId}_{chapterId}`. `QUESTION` records reference a quiz with `quizId`; quiz selection also uses topic and difficulty from `questionBlueprint`. Quiz attempt documents contain a list of question IDs and an `answers` map, so attempt-to-question is many-to-many over time. Review events store a list of scene IDs. A chapter or mission can have multiple inactive/archived content versions, so the diagram shows catalog cardinality across all documents, not only active content. `DAILY_CHALLENGE` is date-selected from active challenge records. `LEARNING_SETTINGS` is a singleton-style collection with known documents `progression` and `bayaniAI`; it is not included in the relationship diagram because it has no per-user foreign key.

## Data dictionary

### Identity, classes, and settings

| Collection / document | Field | Type | Required / key | Description |
|---|---|---|---|---|
| `users/{uid}` | document ID | string | PK; equals Auth UID | Application profile for one authenticated account. |
| | `firstName`, `lastName` | string | Required | User's first and last name. |
| | `middleName` | string | Optional | Middle name; defaults to empty when absent. |
| | `email` | string | Required | Must match the authenticated account email at registration. |
| | `role` | string | Required; `student` / `teacher` | Application role. |
| | `status` | string | Required; currently `active` student or `pending` teacher at account creation | Account access state. |
| | `createdAt`, `updatedAt` | timestamp | `createdAt` required; `updatedAt` conditional | Creation and most recent profile/reward update time. |
| | `avatarId` | string | Optional; references `avatars/{avatarId}` | Selected active avatar. |
| | `profileSetupCompletedAt`, `profileSetupDismissedAt` | timestamp | Optional | Profile setup completion/dismissal markers. |
| | `xp`, `level` | integer | Optional; initialized by progression flow | Accumulated experience and derived level. |
| | `learningStreak`, `lastStreakDate` | integer, string | Optional | Daily streak count and last date key (`YYYY-MM-DD`, UTC+8 basis in rules). |
| | `lastRewardKind`, `lastRewardId` | string | Optional | Identifies the paired mission/daily reward transaction. |
| `classes/{classId}` | `status`, `name`, `teacherName`, `description` | string | `status` required by access logic; display fields observed in class UI | Class must be active for membership/access. Student-side rules do not validate class creation or the complete class record. |
| `classJoinCodes/{code}` | document ID (`code`), `classId`, `status`, `expiresAt` | string, string, string, timestamp | `classId`, `status` used by membership validation; expiry optional | Code maps a student to an active class; codes are server-managed and not writable by clients. |
| `classMembers/{uid_classId}` | `userId`, `classId`, `joinCode`, `status`, `joinedAt` | string, string, string, string, timestamp | All required | Student's active membership in a class. Composite ID `{userId}_{classId}`. |
| `classAssignments/{assignmentId}` | `classId`, `status`, `missionId`, `chapterId`, `title`, `instructions`, `dueAt` | string, string, string, string, string, string, timestamp | `classId` and `status` required for member listing; remaining fields are observed UI fields | Published assignment for a class, usually pointing to a mission and chapter. Admin/teacher write schema is not specified in student rules. |
| `learningSettings/progression` | `xpPerLevel`, `version`, `reviewAfterDays` | integer | First two required by level policy; review interval is optional policy configuration | Controls XP-to-level calculation and, when configured, the return-to-learn review interval. |
| `learningSettings/bayaniAI` | `enabled`, `model`, `appCheckSiteKey`, `maxMessageCharacters`, `welcomeMessage`, `systemInstruction` | boolean, string, string, integer, string, string | Configuration fields observed in setup code | Read-only controls for Bayani AI availability, provider model, client configuration, limits, greeting, and instruction text. Secret/provider credentials are not stored in these fields. |
| `avatars/{avatarId}` | `name`, `status`, `kind`, `icon`, `order`, `isDefault` | string, string, string, string, number, boolean | `name`, `status`, `kind` required by catalog normalization; `icon` required when `kind=emoji` | Read-only avatar catalog record. `kind` is `initials` or `emoji`; active items can be selected. |

### Learning content catalog

Catalog collections are read-only to students. The fields below capture the main identifiers and content fields used in the client and validation rules. Every catalog item also has a Firestore document ID, commonly exposed to the UI as `id`.

| Collection | Main fields | Relationships / purpose |
|---|---|---|
| `eras` | title/name, description, ordering, status | Groups chapters into a historical era. |
| `chapters` | `eraId`, title, description, order, `status`, `contentReady` | Belongs to an era (optional for ungrouped chapters); contains missions and a chapter challenge. |
| `missions` | `chapterId`, title, description, order, `status`, `xpReward` | Belongs to a chapter; linked to lesson scenes and a quiz. `xpReward` is used for first completion. |
| `storyScenes` | `missionId`, order, `status`, narrative/content fields, `exploreItems`, `reviewTopics` | Lesson scenes belonging to a mission. `exploreItems` contains evidence/clue content; `reviewTopics` supports review workflows. |
| `quizzes` | `missionId`, `status`, `questionCount`, `passingScore`, `questionBlueprint` | Assessment definition for a mission. Blueprint organizes selected questions by topic/difficulty. |
| `questions` | `quizId` or mission association, prompt, options, `correctAnswer`, topic/difficulty metadata | Question bank used to construct quiz attempts. Current quiz logic expects unique question IDs and answer keys. |
| `practiceQuestions` | `missionId`, topic, prompt, answer/options, `correctAnswer`, `status` | Optional practice question bank associated with a mission/topic. |
| `chapterChallenges` | `chapterId`, `status`, `passingScore`, title/instructions | Chapter-level assessment, generally one active challenge per chapter. |
| `chapterChallengeQuestions` | `challengeId`, question type, prompt, options/answer data, `correctAnswer`, optional task data | Ordered question items belonging to a chapter challenge. Question types may include choice, matching, and evidence decision tasks. |
| `dailyChallenges` | `status`, date/selection metadata, question, `optionA`–`optionD`, `correctAnswer`, `xpReward` | Active daily question bank; date-based policy selects the challenge for the current day. |
| `artifacts` | `missionId`, `status`, title/name, description, image metadata | Catalog reward associated with completing a mission. |
| `badges` | `chapterId`, `status`, title/name, description, image metadata | Catalog reward associated with completing a chapter challenge. |

Catalog content has evolved through migrations and optional nested task structures. For an appendix requiring every catalog field, export the active Firestore documents and add the exact optional fields present in the deployed dataset.

#### Field-level catalog reference

The table distinguishes stable relationship/policy fields used in code from optional presentation fields. **Required by application logic** means the feature needs the field to run; it does not imply Firestore Rules validates every catalog document at write time.

| Collection | Field | Firestore type | Requirement / allowed values | Definition |
|---|---|---|---|---|
| `eras` | document ID | string | Required; PK | Unique identifier for a historical era. |
| | `title`, `description` | string | Display fields | Era name and student-facing overview. |
| | `order` | number | Used for sorting | Position in the learning sequence. |
| | `status` | string | Commonly `active` / inactive | Publication state. |
| `chapters` | document ID | string | Required; PK | Unique chapter identifier. |
| | `eraId` | string | Optional logical FK to `eras` | Parent era; some chapters may be ungrouped. |
| | `title`, `description` | string | Display fields | Chapter name and overview. |
| | `order` | number | Used for sorting | Position within the era/learning path. |
| | `status` | string | Must be `active` to unlock/read | Publication state. |
| | `contentReady` | boolean | Optional; defaults true in some rules | Indicates whether chapter content is ready for learning access. |
| `missions` | document ID | string | Required; PK | Unique mission identifier. |
| | `chapterId` | string | Required logical FK to `chapters` | Parent chapter. |
| | `title`, `description` | string | Display fields | Mission name and overview. |
| | `order` | number | Used for sorting | Position within chapter. |
| | `status` | string | Must be `active` for use | Publication state. |
| | `xpReward` | integer | Nonnegative; defaults to 0 in reward rules | XP granted on first successful completion. |
| `storyScenes` | document ID | string | Required; PK | Unique lesson scene identifier. |
| | `missionId` | string | Required logical FK to `missions` | Parent mission. |
| | `title`, `content`, `order`, `status` | string, string, number, string | Content fields; `status` must be active for evidence saving | Scene title, narrative, sequence, and publication state. |
| | `imageUrl`, image/caption fields | string/map | Optional presentation data | Scene illustration and accessible/display caption where present. |
| | `exploreItems` | list of maps | Optional; clue workflow uses it | Each clue can include `title`, `hint`, `discovery`, and display `icon`. Saved journal entries point to an item by array index. |
| | `reviewTopics` | list<string> | Optional | Topic tags available for lesson review. |
| | `learningHelp` | map | Optional | Support text; observed child fields include `explanation`, `guidingQuestion`, `example`, and `vocabulary` (list of term/definition maps). |
| | decision activity fields | string/list/map | Optional | Observed fields include `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, and `decisionExplanation`. |
| `quizzes` | document ID | string | Required; PK | Unique quiz identifier. |
| | `missionId` | string | Required logical FK to `missions` | Mission assessed by the quiz. |
| | `title`, `description`, `order` | string, string, number | Presentation/sorting | Quiz title, instructions, and ordering where multiple quizzes exist. |
| | `status` | string | Must be `active` to start | Publication state. |
| | `questionCount` | integer | Required by quiz policy; 1–200 | Number of questions selected for an attempt. |
| | `passingScore` | number | Required by quiz policy; 0–100 | Minimum percentage score for passing. |
| | `questionBlueprint` | list of maps | Required by quiz policy | Each slot has `topic` (string), `difficulty` (string), and `count` (positive integer); slot counts sum to `questionCount`. It fixes scored topic coverage and baseline difficulty. Prior mastery selects the starting level, and answers can reroute later questions while preserving quotas. A separate follow-up adapts to answers without changing the mission score. |
| | `practicePolicy` | map | Optional adaptive-practice configuration | Ordered `difficultyLevels`, optional `startDifficulty`, and optional `reviewDifficulty`; omitted settings use the active practice bank's available difficulty levels. |
| `questions` | document ID | string | Required; PK | Unique question bank item identifier. |
| | `quizId` | string | Required logical FK to `quizzes` | Quiz question bank association. |
| | `topic`, `difficulty` | string | Required for blueprint/adaptive selection | Tags used to preserve topic quotas and select the next question at a suitable difficulty. Multiple active levels per topic improve adaptation. |
| | `status`, `order` | string, number | Active rows can be selected; order is display metadata | Publication state and preferred sequence. |
| | `question` | string | Required by quiz UI | Prompt shown to the learner. |
| | `optionA`–`optionD` | string | Required for four-choice items | Answer option text. |
| | `correctAnswer` | string | Required; answer key such as `A`–`D` | Correct option key; also used to diagnose topics for review. |
| | `explanation`, `historicalClue` | string | Optional | Feedback and evidence/context shown with the question. |
| | `learningPoint` | string | Optional | Short concept or skill reinforced by the question. |
| | `answerExplanations` | map<string,string> | Optional | Choice-specific feedback keyed by answer letter. |
| `practiceQuestions` | document ID | string | Required; PK | Unique practice item. |
| | `missionId` | string | Required logical FK to `missions` | Mission practice context. |
| | `topic`, `topicLabel`, `difficulty` | string | Topic and review metadata | Machine-readable topic, display label, and difficulty band. |
| | `status`, `order` | string, number | Active rows can be shown | Publication state and sequence. |
| | `question`, `optionA`–`optionD`, `correctAnswer` | string | Required by choice practice UI | Prompt, four options, and correct option key. |
| | `explanation`, `learningPoint`, `hint` | string | Optional instructional feedback | Rationale, summary learning point, and hint. |
| | `answerExplanations`, `answerHints` | map<string,string> | Optional | Per-answer feedback indexed by answer key. |
| | `reviewEvidencePolicy` | map | Optional | Review quality configuration; observed fields include `version`, `minDistinctQuestions`, `requiredDifficulty`, and `minCleanSessions`. |
| | `contentReviewStatus` | string | Optional editorial metadata | Human review/readiness note; not a student score. |
| `chapterChallenges` | document ID | string | Required; PK | Unique chapter-level assessment identifier. |
| | `chapterId` | string | Required logical FK to `chapters` | Parent chapter. |
| | `title`, instructions/description, `order` | string/number | Presentation fields | Challenge name, directions, and sequence where present. |
| | `status` | string | Must be `active` for completion | Publication state. |
| | `passingScore` | number | Required by challenge policy; 0–100 | Score threshold for completion. |
| `chapterChallengeQuestions` | document ID | string | Required; PK | Unique chapter challenge item identifier. |
| | `challengeId` | string | Required logical FK to `chapterChallenges` | Parent challenge. |
| | `order`, question text, `questionType` | number/string | Required by corresponding renderer | Position, prompt, and interaction type. |
| | `optionA`–`optionD`, `correctAnswer` | string | Conditional on item type | Choice content and answer key for multiple-choice items. |
| | `evidenceTask` | map | Conditional on evidence-decision items | Nested task definition; may include situation/instructions, evidence cards, and expected evidence/conclusion. |
| | matching/task fields | list/map | Conditional on interaction type | Item-specific matching pairs, ordered elements, or task configuration. |
| `dailyChallenges` | document ID | string | Required; PK | Unique daily challenge bank item identifier. |
| | `status` | string | Must be `active` to be selected | Publication state. |
| | `question`, `optionA`–`optionD`, `correctAnswer` | string | Required by daily challenge UI | Question, answer options, and correct option key. |
| | `xpReward` | integer | Nonnegative; defaults to 0 in reward rules | XP issued for a correct first completion. |
| | date/selection metadata | varies | Optional policy fields | Challenge selection is date-based; the exact metadata depends on `daily-policy.js` and the deployed bank. |
| `artifacts` | document ID | string | Required; PK | Unique collectible identifier. |
| | `missionId` | string | Required for earning logic | Mission that can award the artifact. |
| | `status`, title/name, description, image metadata | string/map | Status must be active to award | Publication and display information. |
| `badges` | document ID | string | Required; PK | Unique badge identifier. |
| | `chapterId` | string | Required for earning logic | Chapter associated with the badge. |
| | `status`, title/name, description, image metadata | string/map | Status must be active to award | Publication and display information. |

### Student activity, progress, and rewards

| Collection | Field | Type | Required / key | Description |
|---|---|---|---|---|
| `studentProgress/{uid_missionId}` | `userId`, `chapterId`, `missionId`, `quizId` | string | Required | Identifies the student and completed mission/quiz. |
| | `completed` | boolean | Required; true on first completion | Mission completion state. |
| | `bestScore` | integer 0–100 | Required | Highest recorded score; replays may only increase it. |
| | `completedAt`, `updatedAt` | timestamp | Required on completion/update | Completion and latest score update times. |
| | `xpEarned` | integer | Required on creation | XP awarded for the mission's first completion. |
| `studentQuizAttempts/{uid_attemptId}` | `userId`, `chapterId`, `missionId`, `quizId`, `attemptId` | string | Required | Identifies one immutable quiz attempt. ID is `{userId}_{attemptId}`. |
| | `questionIds` | list<string> | Required | Unique scored question IDs in the adaptive presentation order for the attempt. |
| | `answers` | map | Required | Submitted answer keyed by question ID. |
| | `score`, `correctAnswers`, `totalQuestions` | integer | Required | Score percentage, number correct, and number of questions. |
| | `passed` | boolean | Required | Whether score meets quiz `passingScore`. |
| | `topicsForReview` | list | Required | Unique topics missed in the scored checkpoints or adaptive follow-up, capped at `totalQuestions`. |
| | `completedAt` | timestamp | Required | Attempt submission time. |
| | `response` | map | Required | Cached assessment/reward response. The browser mission quiz can include nested `adaptiveFollowup` details: ordered follow-up question IDs, answers, diagnostic score/counts, and per-question topic/difficulty/correctness snapshots. This follow-up is formative and does not alter the fixed mission score or pass rule. |
| `studentChapterProgress/{uid_chapterId}` | `userId`, `chapterId`, `challengeId` | string | Required | Student's completed chapter challenge. ID `{userId}_{chapterId}`. |
| | `completed` | boolean; `bestScore` | boolean; integer | Completion state and best score. |
| | `completedAt`, `updatedAt` | timestamp | Required | Completion and score update times. |
| `studentDailyChallenges/{uid_dateKey}` | `userId`, `challengeId`, `dateKey` | string | Required | Student, selected daily challenge, and local date key. ID `{userId}_{dateKey}`. |
| | `completed`, `correct` | boolean | Required | Completion/correctness state. Valid first completion requires `correct=true`. |
| | `selectedAnswer` | string | Required | Selected answer key (A–D in the current UI). |
| | `xpEarned`, `bestScore` | integer | Required | XP reward and score (100 for a correct daily answer). |
| | `completedAt`, `updatedAt` | timestamp | Required | Completion and update times. |
| `studentPracticeProgress/{recordId}` | `userId`, `chapterId`, `missionId` | string | Required | Owner and practice context. |
| | `completedAt` | timestamp | Required | Practice session completion time. |
| | `totalQuestions`, `firstTryCorrectCount` | integer | Required | Session length and first-try correct count. |
| | `questionResults` | list | Required | Per-question practice result details. |
| | `topicsForReview` | list | Required | Topics suggested for review. |
| `studentArtifacts/{uid_artifactId}` | `userId`, `artifactId`, `missionId`, `chapterId` | string | Required | Ownership relation between a student and earned artifact. ID `{userId}_{artifactId}`. |
| | `earnedAt` | timestamp | Required | Award time. |
| `studentBadges/{uid_badgeId}` | `userId`, `badgeId`, `chapterId`, `challengeId` | string | Required | Ownership relation between a student and earned badge. ID `{userId}_{badgeId}`. |
| | `earnedAt` | timestamp | Required | Award time. |
| `studentEvidenceJournal/{uid_sceneId_clueIndex}` | `userId`, `chapterId`, `missionId`, `sceneId` | string | Required | Owner and lesson context for a saved clue. |
| | `clueIndex` | integer ≥ 0 | Required | Index of the clue in the scene's `exploreItems` array. |
| | `savedAt` | timestamp | Required | Save time. |
| `studentReviewEvents/{eventId}` | `userId`, `chapterId`, `missionId`, `topic` | string | Required | Student's lesson-review event and topic. |
| | `sceneIds` | list<string> | Required | Lesson scenes associated with the review. |
| | `kind` | string | Required; `lesson-review` | Review event type. |
| | `completedAt` | timestamp | Required | Event time. |
| `studentLearningDrafts/{uid_kind_contentId}` | `userId`, `kind`, `chapterId` | string | Required | Draft owner, workflow type, and chapter. `kind`: story, quiz, practice, or chapter. |
| | `missionId` | string or null | Conditional | Required for mission workflows; null for chapter challenge draft. |
| | `state` | map | Required | Serialized in-progress learning state. |
| | `updatedAt` | timestamp | Required | Last saved time. |

## Keys and cardinalities summary

- One era can group many chapters; a chapter can contain many missions.
- A mission is linked to a quiz and can have many story scenes and practice questions.
- A chapter can have a chapter challenge with multiple challenge question documents.
- One user can have many attempts, progress records, review events, saved clues, and earned catalog items.
- Student progress, chapter progress, daily completion, membership, and ownership use deterministic composite document IDs to limit duplicate records.
- Firestore rules enforce owner-scoped access and selected reference checks for writes; they do not provide relational cascades or general foreign-key enforcement.

### Relationship and key register

In this table, **logical FK** means a string field stores the referenced Firestore document ID. Firestore does not automatically enforce referential integrity; the application or a security rule checks the reference where noted.

| Parent collection | Child collection | Relationship | Child reference / document ID | Integrity behavior |
|---|---|---|---|---|
| `users` | `classMembers` | 1 to many | `userId`; ID `{uid}_{classId}` | Rules require the signed-in student's UID and active membership. |
| `classes` | `classMembers` | 1 to many | `classId` | Membership creation verifies active class and active join code. |
| `classes` | `classJoinCodes` | 1 to many | `classId` | Join codes are server-managed; student can only look up a code. |
| `classes` | `classAssignments` | 1 to many | `classId` | A student can read a published assignment only as an active member. |
| `eras` | `chapters` | 1 to many | `eraId` | Used for chapter ordering and progression; optional for ungrouped chapters. |
| `chapters` | `missions` | 1 to many | `chapterId` | Checked against active chapter when completing a mission. |
| `missions` | `quizzes` | 1 to many | `missionId` | Quiz must be active and associated with the mission being completed. |
| `quizzes` | `questions` | 1 to many | `quizId` | Client starts from the quiz blueprint, then selects each next scored question from the active bank using remaining topic quotas and the learner's previous answers. |
| `missions` | `storyScenes` | 1 to many | `missionId` | Scene must belong to active mission when saving a clue/review event. |
| `missions` | `practiceQuestions` | 1 to many | `missionId` | Practice supplies mission review questions; the quiz follow-up filters active choice items by topic/difficulty and adapts selection from the learner's answers. |

Adaptive mastery is computed from quiz attempts, practice sessions, and lesson review events. These existing student records provide cross-session topic priorities without a separate mastery collection; current quiz answers then adjust question difficulty and topic selection in-session.
| `chapters` | `chapterChallenges` | 1 to many | `chapterId` | Challenge must be active and match chapter to record completion. |
| `chapterChallenges` | `chapterChallengeQuestions` | 1 to many | `challengeId` | Questions are loaded by challenge ID; active questions are used. |
| `missions` | `artifacts` | 1 to many | `missionId` | Earning logic verifies the active artifact and matching completed mission. |
| `chapters` | `badges` | 1 to many | `chapterId` | Earning logic verifies the active badge and matching completed challenge. |
| `users` | student activity collections | 1 to many | `userId`; usually composite document IDs | Reads are owner-scoped; create rules bind `userId` to Auth UID. |
| `dailyChallenges` | `studentDailyChallenges` | 1 to many over time | `challengeId`; ID `{uid}_{dateKey}` | Rule validates selected answer, active challenge, date key, correctness, and reward pairing. |
| `storyScenes` | `studentEvidenceJournal` | 1 to many | `sceneId` and `clueIndex`; ID `{uid}_{sceneId}_{clueIndex}` | Rule verifies the scene and that clue index exists in `exploreItems`. |

### Example Firestore documents

The following examples are schematic and use illustrative IDs. The string `"<Firestore Timestamp>"` is a placeholder for a Firestore `Timestamp`, not a literal stored string. Optional fields are omitted.

**User profile — `users/student-uid-123`**

```json
{
  "firstName": "Ana",
  "middleName": "",
  "lastName": "Reyes",
  "email": "ana@example.edu",
  "role": "student",
  "status": "active",
  "createdAt": "<Firestore Timestamp>",
  "avatarId": "compass",
  "xp": 45,
  "level": 1,
  "learningStreak": 2,
  "lastStreakDate": "2026-10-29"
}
```

**Mission completion — `studentProgress/student-uid-123_mission-1`**

```json
{
  "userId": "student-uid-123",
  "chapterId": "chapter-1",
  "missionId": "mission-1",
  "quizId": "quiz-1",
  "completed": true,
  "bestScore": 80,
  "completedAt": "<Firestore Timestamp>",
  "updatedAt": "<Firestore Timestamp>",
  "xpEarned": 20
}
```

**Quiz question — `questions/mission-1-q1`**

```json
{
  "quizId": "quiz-1",
  "status": "active",
  "order": 1,
  "topic": "barangay-community",
  "difficulty": "easy",
  "question": "What is a barangay in this lesson?",
  "optionA": "An organized community",
  "optionB": "A single tool",
  "optionC": "Only one person's home",
  "optionD": "A modern factory",
  "correctAnswer": "A",
  "explanation": "A barangay was a kind of early Philippine community."
}
```

### How to present this in the paper

Suggested description: *LakbayPanahon uses Cloud Firestore, a NoSQL document database. Learning content is stored in catalog collections, while student activity is stored in owner-scoped progress and event collections. Documents refer to related records through string IDs, and selected student records use deterministic composite document IDs to prevent duplicate completion or ownership records. Security rules validate ownership, allowed fields, scores, timestamps, and selected content references.*

For the final submission, the ERD can be exported from the Mermaid block to SVG or PNG, then labeled as a **logical data model**. Since this is Firestore rather than a relational SQL database, explain that PK/FK marks in the diagram denote document identifiers and logical references, not SQL constraints.

## Source and verification notes

Primary schema source: `firestore.rules`. Client usage reviewed in the JavaScript modules under `js/`, including reward submission, quiz, chapter challenge, story, practice, profile, class, and review flows. This is a repository-derived logical schema rather than a live database export. Before final paper submission, compare optional catalog fields and teacher/admin-managed class fields with the deployed Firestore documents and your institution's required notation/template.
