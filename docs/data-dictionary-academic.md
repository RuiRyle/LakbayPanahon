# Data Dictionary

This section presents the revised data dictionary for the LakbayPanahon application, documenting account, learning, progress, reward, teacher and administrator data. It follows the supplied manuscript format: a numbered table, entity name, five attribute columns and an explanatory paragraph. Prepared 3 November 2026 from repository code and rules; this is not a fresh export of every live document.


Teacher Account Settings (6 November 2026): the preferred display name uses Firebase Authentication `displayName` (optional, limited to 1-60 characters by this form), not a new Firestore USER attribute. Teacher avatars reuse `users.avatarId` and `updatedAt`. Approved legal name and institution come from the existing teacher application. Display preferences remain browser-local and are not database entities.

## Reading the dictionary

The application uses Firebase Authentication and Cloud Firestore, rather than SQL tables. STRING document IDs replace the old INT identifiers. PK denotes a document ID; FK denotes an application-level reference, not a database-enforced SQL foreign key. The exact stored camelCase field names are retained. Firebase Authentication manages passwords; no User_Pass/password field is stored in the application collections.

Field Size gives an observed application limit where known, otherwise Variable (no SQL length is declared). A dash means size does not apply. NOT NULL means required by the stated writer/use; YES means absent, empty or null may be allowed as described; CONDITIONAL means the activity, record version or application stage determines the requirement. Firestore absence and explicit null are distinct. Catalog requirements are application expectations, not a claim that all catalog writes have strict schema enforcement. Proposed tables at the end are explicitly unimplemented.

### Table 7

**USER**

Storage: `users/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Application profile for the authenticated account. PK; equals Firebase Auth UID. |
| `firstName` | STRING | 1-100 | NOT NULL | User's first name. Required; 1–100 chars. |
| `middleName` | STRING | 100 | YES | User's middle name; empty string is accepted. Optional; up to 100 chars. |
| `lastName` | STRING | 1-100 | NOT NULL | User's last name. Required; 1–100 chars. |
| `email` | STRING | Variable | NOT NULL | Must equal the authenticated account email on profile creation. Required. |
| `role` | STRING | Variable | NOT NULL | Application role; account-management UI cannot promote roles. `student`/`teacher` self-registration; `admin` through trusted setup. |
| `status` | STRING | Variable | NOT NULL | Account status used for access control. Required; `active` student or `pending` teacher at creation. |
| `createdAt` | TIMESTAMP | - | NOT NULL | Profile creation time. Required on creation. |
| `updatedAt` | TIMESTAMP | - | YES | Most recent profile or reward update time. Optional. |
| `moderatedAt` | TIMESTAMP | - | YES | Most recent administrator account-status decision. Optional; server timestamp. |
| `moderatedBy` (FK) | STRING | Variable | YES | Administrator who made the last decision. Optional; logical FK to administrator `users`. |
| `moderationEventId` (FK) | STRING | Variable | YES | Last atomically paired decision record. Optional; FK to `accountModeration`. |
| `avatarId` (FK) | STRING | Variable | YES | Selected avatar catalog document. Optional; logical FK to `avatars`. |
| `profileSetupCompletedAt` | TIMESTAMP | - | YES | Time initial profile setup was completed. Optional. |
| `profileSetupDismissedAt` | TIMESTAMP | - | YES | Time initial profile setup was dismissed. Optional. |
| `xp` | INTEGER | - | YES | Total experience points. Optional; nonnegative in reward flow. |
| `level` | INTEGER | - | YES | Current learning level. Optional; derived from XP and progression settings. |
| `learningStreak` | INTEGER | - | YES | Number of consecutive learning days. Optional. |
| `lastStreakDate` | STRING | Variable | YES | Date key of the latest daily challenge streak update. Optional; `YYYY-MM-DD` in UTC+8. |
| `lastRewardKind` | STRING | Variable | YES | Type of the most recently paired reward transaction. Optional; `mission` or `daily`. |
| `lastRewardId` | STRING | Variable | YES | Mission ID or daily date key associated with that reward transaction. Optional. |
| teacherVerifiedRevision | INTEGER | - | YES | Administrator-written approved application revision; must match the current application. |
| teacherAccessType | STRING | Allowed values | YES | school_teacher, licensed_teacher, student_teacher, facilitator or empty. |
| teacherVerificationReviewId (FK) | STRING | Variable | YES | Qualification decision reference. |

Table 7 presents the structure of the user records. Students, teachers and administrators share this collection; student XP/profile fields apply to learner accounts. Firebase Auth UID is the account identity.

### Table 8

**STUDENT**

Storage: logical role view of `users/{uid}`; not a separate collection.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| userId (FK) | STRING | Variable | NOT NULL | users document ID; role must be student. |
| avatarId (FK) | STRING | Variable | YES | Selected avatar. |
| xp | INTEGER | - | YES | Saved total XP, awarded once per eligible completion. |
| level | INTEGER | - | YES | Level derived from XP and progression configuration. |

Table 8 presents the structure of the student role view. These attributes already belong to USER; no duplicate Stud_ID, student password or separate student identity is created.

### Table 9

**TEACHER**

Storage: logical role view of `users/{uid}` plus private application/review documents.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| userId (FK) | STRING | Variable | NOT NULL | users document ID; role must be teacher. |
| status | STRING | Allowed values | NOT NULL | Account access status, separate from application status. |
| teacherVerifiedRevision | INTEGER | - | YES | Approved application revision; zero/unset does not authorize classroom tools. |
| teacherAccessType | STRING | Allowed values | YES | Approved school-affiliation, licensed-teacher, student-teacher or facilitator route. |
| teacherVerificationReviewId (FK) | STRING | Variable | YES | Administrator decision reference. |

Table 9 presents the structure of the teacher role view. Access also requires verified Auth email, active profile status and a current approved application. A self-declared teacher role alone is insufficient.

### Table 10

**ADMINISTRATOR**

Storage: logical role view of `users/{uid}`; not a separate collection.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| userId (FK) | STRING | Variable | NOT NULL | users document ID; role must be admin through trusted setup. |
| status | STRING | Allowed values | NOT NULL | Active status required for administrator operations. |

Table 10 presents the structure of the administrator role view. Names and email reuse USER. Administrator actions are attributed using actorId in private review and moderation records; no separate Admin_ID or duplicated password exists.

### Table 11

**TEACHER APPLICATION**

Storage: `teacherApplications/{uid}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Firebase Auth UID of the applicant; also a logical FK to users. |
| userId (FK) | STRING | Variable | NOT NULL | Applicant account UID. |
| email | STRING | Variable | NOT NULL | Account email at this application revision. |
| emailVerified | BOOLEAN | - | NOT NULL | Snapshot of email verification; submission also requires a verified Auth token. |
| revision | INTEGER | - | NOT NULL | Incremented on applicant save; approval must match the current revision. |
| status | STRING | Allowed values | NOT NULL | draft, submitted, needs_changes, declined or approved. |
| applicantType | STRING | Allowed values | NOT NULL | school_teacher, licensed_teacher, student_teacher or facilitator. |
| legalName | STRING | 100 | CONDITIONAL | Legal name; required to submit. |
| institution | STRING | 150 | CONDITIONAL | Declared institution; required to submit. |
| locality | STRING | 100 | CONDITIONAL | Optional institution location; empty when omitted. |
| roleTitle | STRING | 100 | CONDITIONAL | Declared teaching role; required to submit. |
| officialWebsite | STRING | 250 | CONDITIONAL | Optional HTTPS institution website. |
| workEmail | STRING | 150 | CONDITIONAL | Optional institutional contact email. |
| prcNumber | STRING | 12 | CONDITIONAL | 4-12 digits for the licensed-teacher route; private credential data. |
| sponsorName | STRING | 100 | CONDITIONAL | Endorsing supervisor; required for student teachers/facilitators. |
| sponsorContact | STRING | 150 | CONDITIONAL | Supervisor work contact; required for endorsement routes. |
| statement | STRING | 1500 | CONDITIONAL | Optional teaching context; empty when omitted. |
| prcExpiresAt | TIMESTAMP | -  | CONDITIONAL | Declared credential expiry; required and current for licensed teachers; otherwise null. |
| acknowledged | BOOLEAN | - | NOT NULL | Applicant acknowledgement; must be true to submit. |
| evidenceRevision | INTEGER | - | NOT NULL | Attachment revision; zero when no attachment is retained. |
| evidenceName | STRING | 100 | NOT NULL | Attachment filename; empty after removal/review. |
| evidenceUploadedAt | TIMESTAMP | -  | YES | Attachment upload time; null when absent. |
| decisionReason | STRING | 500 | YES | Administrator decision explanation; absent before review. |
| reviewId (FK) | STRING | Variable | YES | Latest review event ID; optional before review. |
| reviewedBy (FK) | STRING | Variable | YES | Reviewing administrator UID; optional before review. |
| reviewedAt | TIMESTAMP | -  | YES | Decision time; absent before review. |
| updatedAt | TIMESTAMP | -  | NOT NULL | Latest saved application/review time. |

Table 11 presents the structure of the teacher application records. Qualification information is private; students cannot read credentials or verification references.

### Table 12

**TEACHER EVIDENCE**

Storage: `teacherEvidence/{uid}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Applicant UID; at most one current private image document. |
| userId (FK) | STRING | Variable | NOT NULL | Applicant account. |
| revision | INTEGER | - | NOT NULL | Revision identified by application evidenceRevision. |
| name | STRING | 100 | NOT NULL | Filename. |
| mime | STRING | Allowed values | NOT NULL | image/jpeg or image/png. |
| data | STRING | 250 KB source image | NOT NULL | Base64 encoded image; encoding is larger than the source bytes. |
| uploadedAt | TIMESTAMP | -  | NOT NULL | Used to enforce 30-day access expiry. Deletion occurs on decision or cleanup; expiry is not proof of scheduled physical deletion. |

Table 12 presents the structure of the teacher evidence records. Qualification information is private; students cannot read credentials or verification references.

### Table 13

**TEACHER APPLICATION REVIEW**

Storage: `teacherApplicationReviews/{reviewId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Immutable review ID; shared with the account moderation event. |
| userId (FK) | STRING | Variable | NOT NULL | Teacher applicant. |
| actorId (FK) | STRING | Variable | NOT NULL | Administrator making the decision. |
| revision | INTEGER | - | NOT NULL | Application revision reviewed. |
| applicantType | STRING | Allowed values | NOT NULL | Applicant route being reviewed. |
| decision | STRING | Allowed values | NOT NULL | approved, needs_changes or declined. |
| reason | STRING | 5-500 | NOT NULL | Decision explanation. |
| checks | MAP | 4 booleans | NOT NULL | identity, affiliation, prc and endorsement; approval requires identity/affiliation plus the route-specific check. |
| affiliationReference | STRING | 500 | NOT NULL | Private verification source/result reference; at least 5 characters for approval. |
| credentialReference | STRING | 500 | NOT NULL | Private PRC/endorsement verification reference; at least 5 characters for approval. |
| createdAt | TIMESTAMP | -  | NOT NULL | Immutable review creation time. |

Table 13 presents the structure of the teacher application review records. Qualification information is private; students cannot read credentials or verification references.

### Table 14

**ACCOUNT MODERATION**

Storage: `accountModeration/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Administrator-only status-decision audit entry. PK; immutable. |
| `userId` (FK) | STRING | Variable | NOT NULL | Account whose application access changed. Required; FK to student/teacher `users`. |
| `actorId` | STRING | Variable | NOT NULL | Decision author. Required; active administrator UID. |
| `previousStatus` | STRING | Variable | NOT NULL | Actual previous status and new `active`/`inactive` status. Required. |
| `status` | STRING | Variable | NOT NULL | Actual previous status and new `active`/`inactive` status. Required. |
| `reason` | STRING | Variable | NOT NULL | Administrator-only reason for the decision. Required; 5–500 characters. |
| `identityVerified` | BOOLEAN | - | NOT NULL | Administrator confirmation of teacher identity/eligibility review, not an automated verification result. Required; true for teacher activation. |
| `createdAt` | TIMESTAMP | - | NOT NULL | Audit creation time, paired with the profile's moderation timestamp. Required; server timestamp. |

Table 14 presents the structure of the account moderation records. This administrator-only audit is separate from user profile fields and records account-status decisions.

### Table 15

**AVATAR**

Storage: `avatars/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique avatar option. PK. |
| `name` | STRING | Variable | NOT NULL | Display name. Required by profile catalog. |
| `status` | STRING | Variable | CONDITIONAL | Only active avatars are available for selection. `active` or `inactive`. |
| `kind` | STRING | Variable | CONDITIONAL | How the avatar is rendered. `initials` or `emoji`. |
| `icon` | STRING | Variable | NOT NULL | Emoji/icon displayed for the avatar. Required when `kind=emoji`. |
| `order` | NUMBER | - | YES | Sort order in the avatar picker. Optional. |
| `isDefault` | BOOLEAN | - | YES | Identifies the default avatar. Optional. |

Table 15 presents the structure of the avatar records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 16

**CLASS**

Storage: `classes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique class. PK. |
| `teacherId` (FK) | STRING | Variable | NOT NULL | Immutable owning teacher UID. Required for teacher-managed classes; FK to `users`. |
| `currentJoinCode` | STRING | Variable | NOT NULL | Current 12-character code; empty string revokes new joins. Legacy records may omit it. Required on new teacher-managed classes. |
| `createdAt` | TIMESTAMP | - | NOT NULL | Server creation/update times. Required on new teacher-managed classes. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Server creation/update times. Required on new teacher-managed classes. |
| `status` | STRING | Variable | NOT NULL | Class availability state. Required by membership/access logic; active class required. |
| `name` | STRING | 100 | NOT NULL | Class name required by the current teacher publisher. |
| `teacherName` | STRING | Variable | YES | Teacher name shown to a member. Optional display field. |
| `description` | STRING | 500 | YES | Class description. Optional display field. |

Table 16 presents the structure of the class records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 17

**CLASS JOIN CODE**

Storage: `classJoinCodes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Server-managed class invitation code. PK; 12 uppercase letters/digits. |
| `teacherId` | STRING | Variable | NOT NULL | Owning teacher. Required for new teacher-issued codes. |
| `createdAt` | TIMESTAMP | - | NOT NULL | Server creation time. Required for new teacher-issued codes. |
| `classId` (FK) | STRING | Variable | NOT NULL | Class that the code joins. Required logical FK to `classes`. |
| `status` | STRING | Variable | CONDITIONAL | Code availability. Must be `active` to join. |
| `expiresAt` | TIMESTAMP | - | YES | Code expiration time. Optional. |
| `className` | STRING | 100 | YES | Classroom name snapshot for pre-join confirmation; new codes match the classroom name when issued. |
| `teacherName` | STRING | 200 | YES | Teacher display name snapshot for pre-join confirmation; new codes match the classroom when issued. |

Table 17 presents the structure of the class join code records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 18

**ENROLLMENT**

Storage: `classMembers/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique student membership in a class. PK; `{userId}_{classId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Member account. Required; FK to `users`, must equal signed-in UID. |
| `classId` (FK) | STRING | Variable | NOT NULL | Joined class. Required logical FK to `classes`. |
| `joinCode` (FK) | STRING | Variable | NOT NULL | Code used to join. Required logical FK to `classJoinCodes`. |
| `status` | STRING | Variable | NOT NULL | Membership state. Required; `active` on creation. |
| `joinedAt` | TIMESTAMP | - | NOT NULL | Membership creation time. Required. |

Table 18 presents the structure of the enrollment records. Class membership is optional; students can learn independently.

### Table 19

**CLASS ASSIGNMENT**

Storage: `classAssignments/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique class assignment. PK. |
| `classId` (FK) | STRING | Variable | NOT NULL | Assigned class. Required for class query; FK to `classes`. |
| `status` | STRING | Fixed values | NOT NULL | `draft`, `published`, `closed`, or `withdrawn`. Drafts are private; ended activities remain in readable history. |
| `missionId` (FK) | STRING | Variable | YES | Assigned mission. Optional logical FK to `missions`. |
| `chapterId` (FK) | STRING | Variable | YES | Chapter containing the assigned mission. Optional logical FK to `chapters`. |
| `title` | STRING | Variable | YES | Assignment display title. Optional. |
| `instructions` | STRING | Variable | YES | Teacher's assignment instructions. Optional. |
| `dueAt` | TIMESTAMP | - | YES | Assignment deadline. Optional. |
| `publishedAt` | TIMESTAMP | - | NOT NULL | Server save/publication times. Drafts remain hidden; ended activities remain readable as history. Required by new teacher publisher. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Server save/publication times. Drafts remain hidden; ended activities remain readable as history. Required by new teacher publisher. |
| endedAt | TIMESTAMP | - | CONDITIONAL | Server time of closing/withdrawal. Required for terminal states; absent/null for active work. Evidence after this time does not satisfy the ended activity. |

Table 19 presents the structure of the class assignment records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 20

**CLASS ANNOUNCEMENT**

Storage: `classAnnouncements/{announcementId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique class announcement ID. |
| classId (FK) | STRING | Variable | NOT NULL | Class receiving the message. |
| title | STRING | 120 | NOT NULL | Message heading. |
| body | STRING | 3000 | NOT NULL | Message text. |
| status | STRING | Allowed values | NOT NULL | draft or published; only published announcements are visible to active members. |
| publishedAt | TIMESTAMP | -  | NOT NULL | Publication timestamp written by current publisher. |
| updatedAt | TIMESTAMP | -  | NOT NULL | Latest save time. |

Table 20 presents the structure of class announcements. Approved teachers publish messages for active members of their owned classes; students cannot publish.

### Table 21

**CLASS FEEDBACK**

Storage: `classFeedback/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Deterministic classId_userId_missionId; one current feedback message per student, class and mission. Required PK. |
| `classId` (FK) | STRING | Variable | NOT NULL | Owning class. Required FK to classes. |
| `userId` (FK) | STRING | Variable | NOT NULL | Student recipient; must be an active class member when the teacher sends. Required FK to users. |
| `teacherId` (FK) | STRING | Variable | NOT NULL | Approved owning teacher; cannot change on revision. Required FK to users. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Mission discussed by the feedback. Required FK to missions. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Must match the active mission's chapter. Required FK to chapters. |
| `body` | STRING | 1-1500 | NOT NULL | Student-visible guidance. Never store private support notes here. Required, 1-1500 chars. |
| `revision` | INTEGER | - | NOT NULL | Starts at 1 and increases by 1 per teacher update. Required. |
| `createdAt` | TIMESTAMP | - | NOT NULL | Server timestamp on first send; preserved thereafter. Required. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Server timestamp of the latest teacher send. Required. |
| `readAt` | TIMESTAMP | - | YES | Null on teacher send; only the recipient can set it to the server time. It means marked as read, not demonstrated understanding. Optional, nullable. |

Table 21 presents the structure of the class feedback records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 22

**TEACHER SUPPORT NOTE**

Storage: `teacherSupportNotes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Deterministic classId_userId_missionId; one current private follow-up per student, class and mission. Required PK. |
| `classId` (FK) | STRING | Variable | NOT NULL | Owned active class; active student membership required for reading and writing notes. Required FK to classes. |
| `userId` (FK) | STRING | Variable | NOT NULL | Student discussed in the follow-up. Students cannot access these records. Required FK to users. |
| `teacherId` (FK) | STRING | Variable | NOT NULL | Approved owning teacher; other teachers cannot read this note. Required FK to users. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Active mission discussed in the note. Required FK to missions. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Active chapter containing the mission. Required FK to chapters. |
| `status` | STRING | Variable | NOT NULL | planned or discussed; teacher action, not student mastery or review resolution. Required. |
| `note` | STRING | 1-1500 | NOT NULL | Private teacher note; never stored in student-visible feedback. Required, 1-1500 chars. |
| `revision` | INTEGER | - | NOT NULL | Starts at 1 and increments on each save; prevents stale concurrent UI edits. Required. |
| `createdAt` | TIMESTAMP | - | NOT NULL | First server save time; preserved on updates. Required. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Latest server save time. Required. |
| `statusAt` | TIMESTAMP | - | NOT NULL | Server time when status was set or changed. Ordinary note edits preserve it. Later quiz evidence is compared to this boundary without asserting causation or mastery. Required. |

Table 22 presents the structure of the teacher support note records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 23

**TEACHER STUDENT LINK**

Storage: `teacherStudentLinks/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Report lookup; every read still checks live ownership and membership. Not a progress copy. PK; `{teacherId}_{userId}`. |
| `teacherId` (FK) | STRING | Variable | NOT NULL | Active approved teacher. Required; FK to `users`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Joined student whose learning records are requested. Required; FK to `users`. |
| `classId` (FK) | STRING | Variable | NOT NULL | Owned active class with active membership. Retaining this document does not retain access after the student leaves. Required; FK to `classes`. |
| `xpPerLevel` | INTEGER | - | NOT NULL | XP needed for each level. Required; positive. |
| `version` | INTEGER | - | NOT NULL | Policy version. Required; positive. |
| `reviewAfterDays` | INTEGER | - | YES | Interval used to schedule return-to-learn review. Optional; configured range 1–365. |
| `enabled` | BOOLEAN | - | NOT NULL | Whether AI assistance is enabled. Required in setup config. |
| `model` | STRING | Variable | CONDITIONAL | AI model identifier. Setup/config field. |
| `appCheckSiteKey` | STRING | Variable | CONDITIONAL | Client App Check site key; may be empty until configured. Setup/config field. |
| `maxMessageCharacters` | INTEGER | - | CONDITIONAL | Maximum message length. Setup/config field. |
| `welcomeMessage` | STRING | Variable | CONDITIONAL | Opening message shown by Bayani. Setup/config field. |
| `systemInstruction` | STRING | Variable | CONDITIONAL | Teaching and response policy text. Setup/config field. |

Table 23 presents the structure of the teacher student link records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 24

**ERA**

Storage: `eras/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique historical era. PK. |
| `title` | STRING | Variable | CONDITIONAL | Era name and overview. Display fields. |
| `description` | STRING | Variable | CONDITIONAL | Era name and overview. Display fields. |
| `order` | NUMBER | - | YES | Position in the learning sequence. Optional; used for sorting. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. `active` for accessible chapters. |
| `dateRange` | STRING | Variable | CONDITIONAL | Authored historical period label; not an inferred exact date. Observed in the dated catalog/authored metadata; not required on every document. |
| `name` | STRING | Variable | CONDITIONAL | Display name. Observed in the dated catalog/authored metadata; not required on every document. |
| `order ` | INTEGER | - | CONDITIONAL | Legacy key with a trailing space; distinct from order. Recorded for fidelity, not a recommended field. |
| `requiredChapterIds` | ARRAY | Variable | CONDITIONAL | Earlier chapter completions required by the progression path. Observed in the dated catalog/authored metadata; not required on every document. |
| `theme` | STRING | Variable | CONDITIONAL | Presentation theme identifier. Observed in the dated catalog/authored metadata; not required on every document. |
| `unlockMessage` | STRING | Variable | CONDITIONAL | Explanation of the era prerequisites. Observed in the dated catalog/authored metadata; not required on every document. |

Table 24 presents the structure of the era records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 25

**CHAPTER**

Storage: `chapters/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique chapter. PK. |
| `eraId` (FK) | STRING | Variable | YES | Parent era; some chapters can be ungrouped. Optional logical FK to `eras`. |
| `title` | STRING | Variable | CONDITIONAL | Chapter name and overview. Display fields. |
| `description` | STRING | Variable | CONDITIONAL | Chapter name and overview. Display fields. |
| `order` | NUMBER | - | YES | Position within an era/path. Optional; used for sorting. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` for learning access. |
| `contentReady` | BOOLEAN | - | YES | Whether chapter content is ready to access. Optional; defaults true in some checks. |
| `displayLabel` | STRING | Variable | CONDITIONAL | Short chapter label used for display. Observed in the dated catalog/authored metadata; not required on every document. |
| `requiredForProgression` | BOOLEAN | - | CONDITIONAL | Whether the chapter participates in required progression. Observed in the dated catalog/authored metadata; not required on every document. |

Table 25 presents the structure of the chapter records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 26

**MISSION**

Storage: `missions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique mission. PK. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Parent chapter. Required logical FK to `chapters`. |
| `title` | STRING | Variable | YES | Mission name and introductory text. Optional content/display fields. |
| `description` | STRING | Variable | YES | Mission name and introductory text. Optional content/display fields. |
| `introduction` | STRING | Variable | YES | Mission name and introductory text. Optional content/display fields. |
| `learningObjective` | STRING | Variable | YES | Main learning objective. Optional. |
| `learningObjectives` | LIST<STRING> | Variable | YES | Detailed learning objectives. Optional. |
| `lessonRecap` | STRING | Variable | YES | Mission summary. Optional. |
| `sourceUrls` | LIST<STRING> | Variable | YES | Sources associated with the learning content. Optional. |
| `order` | NUMBER | - | YES | Mission order within a chapter. Optional; used for sorting. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` for use. |
| `xpReward` | INTEGER | - | CONDITIONAL | XP awarded for first mission completion. Nonnegative; defaults to 0 in reward logic. |
| `learningGuide` | MAP | Variable | YES | Authored companion practice: central question, purpose, scenario, choices, answer index, feedback and curriculum/reference metadata. Not an official quiz result. |
| `contentReviewStatus` | STRING | Variable | CONDITIONAL | Editorial content review note, separate from publication status. Observed in the dated catalog/authored metadata; not required on every document. |
| `storyContent` | STRING | Variable | CONDITIONAL | Optional mission-level story text; ordered storyScenes remain the scene records. Observed in the dated catalog/authored metadata; not required on every document. |

Table 26 presents the structure of the mission records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 27

**STORY SCENE**

Storage: `storyScenes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique lesson scene. PK. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Parent mission. Required logical FK to `missions`. |
| `title` | STRING | Variable | CONDITIONAL | Scene title and narrative. Lesson content. |
| `content` | STRING | Variable | CONDITIONAL | Scene title and narrative. Lesson content. |
| `order` | NUMBER | - | CONDITIONAL | Position within the mission. Used for scene sequence. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` for supported workflows. |
| `imageUrl` | STRING | Variable | YES | Illustration path, display fit, alternative text, and caption. Optional presentation fields. |
| `imageFit` | STRING | Variable | YES | Illustration path, display fit, alternative text, and caption. Optional presentation fields. |
| `imageAlt` | STRING | Variable | YES | Illustration path, display fit, alternative text, and caption. Optional presentation fields. |
| `imageCaption` | STRING | Variable | YES | Illustration path, display fit, alternative text, and caption. Optional presentation fields. |
| `visualSymbol` | STRING | Variable | YES | Scene symbol/emoji. Optional. |
| `exploreIntroduction` | STRING | Variable | YES | Instructions for exploring scene clues. Optional. |
| `exploreItems` | LIST<MAP> | Variable | YES | Clue cards; observed item fields include `title`, `hint`, `discovery`, and `icon`. Journal records refer to these by list index. Optional. |
| `reviewTopics` | LIST<STRING> | Variable | YES | Topic IDs associated with review. Optional. |
| `learningHelp` | MAP | Variable | YES | Support content; observed children include `explanation`, `guidingQuestion`, `example`, and `vocabulary` (list of `{term, definition}` maps). Optional. |
| decisionSituation | STRING | Variable | YES | `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, `decisionExplanation`. Optional. |
| decisionQuestion | STRING | Variable | YES | `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, `decisionExplanation`. Optional. |
| decisionChoices | ARRAY OF STRINGS | Variable | YES | `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, `decisionExplanation`. Optional. |
| decisionCorrectAnswer | STRING | Variable | YES | `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, `decisionExplanation`. Optional. |
| decisionExplanation | STRING | Variable | YES | `decisionSituation`, `decisionQuestion`, `decisionChoices`, `decisionCorrectAnswer`, `decisionExplanation`. Optional. |
| discoveryTitle | STRING | Variable | YES | Observed fields include `discoveryTitle`, `discoveryText`, `keyTerm`, and `keyTermDefinition`. |
| discoveryText | STRING | Variable | YES | Observed fields include `discoveryTitle`, `discoveryText`, `keyTerm`, and `keyTermDefinition`. |
| keyTerm | STRING | Variable | YES | Observed fields include `discoveryTitle`, `discoveryText`, `keyTerm`, and `keyTermDefinition`. |
| keyTermDefinition | STRING | Variable | YES | Observed fields include `discoveryTitle`, `discoveryText`, `keyTerm`, and `keyTermDefinition`. |
| `sourceUrls` | LIST<STRING> | Variable | YES | References associated with the scene. Optional. |
| `checkChoices` | ARRAY | Variable | CONDITIONAL | Scene quick-check choices. Observed in the dated catalog/authored metadata; not required on every document. |
| `checkCorrectAnswer` | STRING | Variable | CONDITIONAL | Correct scene quick-check choice text. Observed in the dated catalog/authored metadata; not required on every document. |
| `checkExplanation` | STRING | Variable | CONDITIONAL | Quick-check feedback. Observed in the dated catalog/authored metadata; not required on every document. |
| `checkQuestion` | STRING | Variable | CONDITIONAL | Scene quick-check prompt. Observed in the dated catalog/authored metadata; not required on every document. |
| `clueHunt` | MAP | Variable | CONDITIONAL | Authored multi-clue investigation. Observed in the dated catalog/authored metadata; not required on every document. |
| `contentReviewStatus` | STRING | Variable | CONDITIONAL | Editorial content review note, separate from publication status. Observed in the dated catalog/authored metadata; not required on every document. |
| `exhibitActivity` | MAP | Variable | CONDITIONAL | Authored contribution-to-effect matching activity. Observed in the dated catalog/authored metadata; not required on every document. |
| `historicalInsight` | STRING | Variable | CONDITIONAL | Supporting historical interpretation or teaching insight. Observed in the dated catalog/authored metadata; not required on every document. |
| `routeActivity` | MAP | Variable | CONDITIONAL | Authored route investigation. Observed in the dated catalog/authored metadata; not required on every document. |
| `tradeActivity` | MAP | Variable | CONDITIONAL | Fictional exchange activity; quantities are teaching examples, not historical market prices. Observed in the dated catalog/authored metadata; not required on every document. |

Table 27 presents the structure of the story scene records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 28

**QUIZ**

Storage: `quizzes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique mission quiz. PK. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Mission assessed. Required logical FK to `missions`. |
| `title` | STRING | Variable | YES | Quiz name and learner-facing description. Optional display fields. |
| `description` | STRING | Variable | YES | Quiz name and learner-facing description. Optional display fields. |
| `order` | NUMBER | - | YES | Ordering when multiple quizzes belong to a mission. Optional. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` to start. |
| `questionCount` | INTEGER | - | NOT NULL | Number of questions in an attempt. Required by quiz-selection logic; 1–200. |
| `passingScore` | NUMBER | - | NOT NULL | Minimum percentage to pass. Required by quiz policy; 0–100. |
| `questionBlueprint` | LIST<MAP> | Variable | NOT NULL | Each entry has `topic` (string), `difficulty` (string), and `count` (positive integer); counts sum to `questionCount`. It defines scored topic quotas and baseline difficulty. Prior mastery selects the starting level, and answers can reroute later questions while preserving quotas. A separate follow-up adapts to answers without changing the mission score. Required by quiz-selection logic. |
| `practicePolicy` | MAP | Variable | YES | `difficultyLevels` is an ordered list; `startDifficulty` selects the initial level when no core topic was missed, and `reviewDifficulty` selects it when review topics were found. If absent, available `easy`/`medium`/`hard` practice levels are used. Optional adaptive-practice configuration. |

Table 28 presents the structure of the quiz records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 29

**QUESTION**

Storage: `questions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique quiz question. PK. |
| `quizId` (FK) | STRING | Variable | NOT NULL | Parent quiz/question bank. Required logical FK to `quizzes`. |
| `topic` | STRING | Variable | NOT NULL | Topic and level tags used to preserve topic coverage and select the next scored question. A varied active difficulty bank enables stronger adaptation. Required for initial blueprint selection and adaptive routing. |
| `difficulty` | STRING | Variable | NOT NULL | Topic and level tags used to preserve topic coverage and select the next scored question. A varied active difficulty bank enables stronger adaptation. Required for initial blueprint selection and adaptive routing. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` to be selected. |
| `order` | NUMBER | - | YES | Preferred question ordering. Optional display order. |
| `question` | STRING | Variable | NOT NULL | Prompt. Required by question UI. |
| `optionA` | STRING | Variable | NOT NULL | Answer option text. Required for four-choice items. |
| `optionB` | STRING | Variable | NOT NULL | Answer option text. Required for four-choice items. |
| `optionC` | STRING | Variable | NOT NULL | Answer option text. Required for four-choice items. |
| `optionD` | STRING | Variable | NOT NULL | Answer option text. Required for four-choice items. |
| `correctAnswer` | STRING | Variable | CONDITIONAL | Correct option. Answer key, commonly `A`–`D`. |
| `explanation` | STRING | Variable | YES | Answer explanation and supporting historical context. Optional. |
| `historicalClue` | STRING | Variable | YES | Answer explanation and supporting historical context. Optional. |
| `learningPoint` | STRING | Variable | YES | Short concept or skill reinforced by the question. Optional. |
| `answerExplanations` | MAP<STRING,STRING> | Variable | YES | Choice-specific feedback keyed by answer letter. Optional. |
| `contentReviewStatus` | STRING | Variable | CONDITIONAL | Editorial content review note, separate from publication status. Observed in the dated catalog/authored metadata; not required on every document. |
| `sourceUrls` | ARRAY | Variable | CONDITIONAL | Historical/teaching reference URLs. Observed in the dated catalog/authored metadata; not required on every document. |
| `topicLabel` | STRING | Variable | CONDITIONAL | Authored topic label. Observed in the dated catalog/authored metadata; not required on every document. |

Table 29 presents the structure of the question records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 30

**PRACTICE QUESTION**

Storage: `practiceQuestions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique practice item. PK. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Mission context. Required logical FK to `missions`. |
| `topic` | STRING | Variable | CONDITIONAL | Machine topic ID, learner-facing topic label, and difficulty level. Topic/difficulty metadata. |
| `topicLabel` | STRING | Variable | CONDITIONAL | Machine topic ID, learner-facing topic label, and difficulty level. Topic/difficulty metadata. |
| `difficulty` | STRING | Variable | CONDITIONAL | Machine topic ID, learner-facing topic label, and difficulty level. Topic/difficulty metadata. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` for practice. |
| `order` | NUMBER | - | YES | Bank ordering. Optional. |
| `question` | STRING | Variable | CONDITIONAL | Prompt, four answer choices, and answer key. Choice-question fields. |
| `optionA` | STRING | Variable | CONDITIONAL | Prompt, four answer choices, and answer key. Choice-question fields. |
| `optionB` | STRING | Variable | CONDITIONAL | Prompt, four answer choices, and answer key. Choice-question fields. |
| `optionC` | STRING | Variable | CONDITIONAL | Prompt, four answer choices, and answer key. Choice-question fields. |
| `optionD` | STRING | Variable | CONDITIONAL | Prompt, four answer choices, and answer key. Choice-question fields. |
| `correctAnswer` | STRING | Variable | CONDITIONAL | Prompt, four answer choices, and answer key. Choice-question fields. |
| `explanation` | STRING | Variable | YES | Feedback, key idea, and hint. Optional. |
| `learningPoint` | STRING | Variable | YES | Feedback, key idea, and hint. Optional. |
| `hint` | STRING | Variable | YES | Feedback, key idea, and hint. Optional. |
| `answerExplanations` | MAP<STRING,STRING> | Variable | YES | Per-answer explanation/hint keyed by choice letter. Optional. |
| `answerHints` | MAP<STRING,STRING> | Variable | YES | Per-answer explanation/hint keyed by choice letter. Optional. |
| `reviewEvidencePolicy` | MAP | Variable | YES | Review policy; observed fields include `version`, `minDistinctQuestions`, `requiredDifficulty`, and `minCleanSessions`. Optional. |
| `contentReviewStatus` | STRING | Variable | YES | Content review state/note. Optional editorial metadata. |
| `historicalClue` | STRING | Variable | CONDITIONAL | Authored historical clue. Observed in the dated catalog/authored metadata; not required on every document. |
| `sourceUrls` | ARRAY | Variable | CONDITIONAL | Historical/teaching reference URLs. Observed in the dated catalog/authored metadata; not required on every document. |

Table 30 presents the structure of the practice question records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 31

**CHAPTER CHALLENGE**

Storage: `chapterChallenges/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique chapter assessment. PK. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Parent chapter. Required logical FK to `chapters`. |
| `title` | STRING | Variable | YES | Challenge title. |
| `description` | STRING | Variable | YES | Learner instructions/description. |
| `order` | NUMBER | - | YES | Ordering when multiple challenge records exist. Optional. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` for completion. |
| `passingScore` | NUMBER | - | NOT NULL | Minimum percentage for chapter completion. Required by challenge policy; 0–100. |
| `contentReviewStatus` | STRING | Variable | CONDITIONAL | Editorial content review note, separate from publication status. Observed in the dated catalog/authored metadata; not required on every document. |
| `sourceUrls` | ARRAY | Variable | CONDITIONAL | Historical/teaching reference URLs. Observed in the dated catalog/authored metadata; not required on every document. |
| `xpReward` | INTEGER | - | CONDITIONAL | XP issued for this submission; zero on repeats. Observed in the dated catalog/authored metadata; not required on every document. |

Table 31 presents the structure of the chapter challenge records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 32

**CHAPTER CHALLENGE QUESTION**

Storage: `chapterChallengeQuestions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique question/task in a chapter challenge. PK. |
| `challengeId` (FK) | STRING | Variable | NOT NULL | Parent chapter challenge. Required logical FK to `chapterChallenges`. |
| `order` | NUMBER | - | CONDITIONAL | Position in the challenge. Used for question sequence. |
| `optionA` | STRING | Variable | CONDITIONAL | Choice text and answer key. Conditional on choice-question type. |
| `optionB` | STRING | Variable | CONDITIONAL | Choice text and answer key. Conditional on choice-question type. |
| `optionC` | STRING | Variable | CONDITIONAL | Choice text and answer key. Conditional on choice-question type. |
| `optionD` | STRING | Variable | CONDITIONAL | Choice text and answer key. Conditional on choice-question type. |
| `correctAnswer` | STRING | Variable | CONDITIONAL | Choice text and answer key. Conditional on choice-question type. |
| `evidenceTask` | MAP | Variable | CONDITIONAL | Nested evidence task configuration, including cards that point to scene clue indices and a correct evidence/conclusion. Conditional on evidence-decision type. |
| `answerExplanations` | MAP | Variable | CONDITIONAL | Choice-specific explanations keyed by A/B/C/D. Observed in the dated catalog/authored metadata; not required on every document. |
| `contentReviewStatus` | STRING | Variable | CONDITIONAL | Editorial content review note, separate from publication status. Observed in the dated catalog/authored metadata; not required on every document. |
| `explanation` | STRING | Variable | CONDITIONAL | Reasoning or feedback text. Observed in the dated catalog/authored metadata; not required on every document. |
| `gameType` | STRING | Variable | CONDITIONAL | matching, tradeSimulation or evidenceDecision, according to the task. Observed in the dated catalog/authored metadata; not required on every document. |
| `historicalClue` | STRING | Variable | CONDITIONAL | Authored historical clue. Observed in the dated catalog/authored metadata; not required on every document. |
| `learningPoint` | STRING | Variable | CONDITIONAL | Authored learning point. Observed in the dated catalog/authored metadata; not required on every document. |
| `matchingPairs` | ARRAY | Variable | CONDITIONAL | Correct left/right pairs for a matching task. Observed in the dated catalog/authored metadata; not required on every document. |
| `question` | STRING | Variable | CONDITIONAL | Authored question or central inquiry. Observed in the dated catalog/authored metadata; not required on every document. |
| `requiredQuantity` | INTEGER | - | CONDITIONAL | Correct trade quantity. Observed in the dated catalog/authored metadata; not required on every document. |
| `rewardGood` | STRING | Variable | CONDITIONAL | Good received in the trade simulation. Observed in the dated catalog/authored metadata; not required on every document. |
| `rewardQuantity` | INTEGER / STRING | Variable | CONDITIONAL | Quantity received for a correct simulated trade. Observed in the dated catalog/authored metadata; not required on every document. |
| `sourceMissionIds` | ARRAY | Variable | CONDITIONAL | Mission IDs supplying the assessment evidence. Observed in the dated catalog/authored metadata; not required on every document. |
| `sourceUrls` | ARRAY | Variable | CONDITIONAL | Historical/teaching reference URLs. Observed in the dated catalog/authored metadata; not required on every document. |
| `startingQuantity` | INTEGER | - | CONDITIONAL | Initial inventory quantity in a trade simulation. Observed in the dated catalog/authored metadata; not required on every document. |
| `status` | STRING | Variable | CONDITIONAL | Authored status. Observed in the dated catalog/authored metadata; not required on every document. |
| `tradeGood` | STRING | Variable | CONDITIONAL | Good offered in the trade simulation. Observed in the dated catalog/authored metadata; not required on every document. |

Table 32 presents the structure of the chapter challenge question records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 33

**DAILY CHALLENGE**

Storage: `dailyChallenges/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique daily question bank item. PK. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` to be selected. |
| `order` | NUMBER | - | YES | Position in daily rotation. Optional; used before document ID as sort tie-breaker. |
| `question` | STRING | Variable | NOT NULL | Prompt, choices, and answer key. Required by daily question flow. |
| `optionA` | STRING | Variable | NOT NULL | Prompt, choices, and answer key. Required by daily question flow. |
| `optionB` | STRING | Variable | NOT NULL | Prompt, choices, and answer key. Required by daily question flow. |
| `optionC` | STRING | Variable | NOT NULL | Prompt, choices, and answer key. Required by daily question flow. |
| `optionD` | STRING | Variable | NOT NULL | Prompt, choices, and answer key. Required by daily question flow. |
| `correctAnswer` | STRING | Variable | NOT NULL | Prompt, choices, and answer key. Required by daily question flow. |
| `xpReward` | INTEGER | - | CONDITIONAL | XP for correct first completion. Nonnegative; defaults to 0 in reward logic. |

Table 33 presents the structure of the daily challenge records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 34

**ARTIFACT**

Storage: `artifacts/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique collectible catalog item. PK. |
| `missionId` | STRING | Variable | NOT NULL | Mission that awards the artifact. Required for reward matching. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` to award. |
| `name` | STRING | Variable | YES | Collectible label, description, icon, and rarity. Optional display/reward fields. |
| `title` | STRING | Variable | YES | Collectible label, description, icon, and rarity. Optional display/reward fields. |
| `description` | STRING | Variable | YES | Collectible label, description, icon, and rarity. Optional display/reward fields. |
| `icon` | STRING | Variable | YES | Collectible label, description, icon, and rarity. Optional display/reward fields. |
| `rarity` | STRING | Variable | YES | Collectible label, description, icon, and rarity. Optional display/reward fields. |
| `learningDetails` | MAP | Variable | YES | Optional museum teaching details, including historicalUse when authored. |
| `chapterId` (FK) | STRING | Variable | YES | Optional authored chapter context; achievement views can supply this from owned reward context. |
| `emoji` | STRING | Variable | YES | Optional fallback display symbol read by the museum renderer. |

Table 34 presents the structure of the artifact records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 35

**BADGE**

Storage: `badges/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Unique badge catalog item. PK. |
| `chapterId` | STRING | Variable | NOT NULL | Chapter associated with the badge. Required for reward matching. |
| `status` | STRING | Variable | CONDITIONAL | Publication state. Must be `active` to award. |
| `name` | STRING | Variable | YES | Badge label, description, icon, and rarity. Optional display/reward fields. |
| `title` | STRING | Variable | YES | Badge label, description, icon, and rarity. Optional display/reward fields. |
| `description` | STRING | Variable | YES | Badge label, description, icon, and rarity. Optional display/reward fields. |
| `icon` | STRING | Variable | YES | Badge label, description, icon, and rarity. Optional display/reward fields. |
| `rarity` | STRING | Variable | YES | Badge label, description, icon, and rarity. Optional display/reward fields. |

Table 35 presents the structure of the badge records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 36

**MISSION PROGRESS**

Storage: `studentProgress/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | One mission completion record per student/mission. PK; `{userId}_{missionId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Record owner. Required; FK to `users` and must equal Auth UID. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Chapter, mission, and quiz completed. Required; logical FKs. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Chapter, mission, and quiz completed. Required; logical FKs. |
| `quizId` (FK) | STRING | Variable | NOT NULL | Chapter, mission, and quiz completed. Required; logical FKs. |
| `completed` | BOOLEAN | - | NOT NULL | Mission completion state. Required; true on creation. |
| `bestScore` | INTEGER | - | NOT NULL | Highest score. Replays may only increase this value. Required; 0–100. |
| `completedAt` | TIMESTAMP | - | NOT NULL | First completion and latest score update. Required on creation/update. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | First completion and latest score update. Required on creation/update. |
| `xpEarned` | INTEGER | - | NOT NULL | XP reward for first completion. The Admin callable writer does not currently include this field. Required by direct-client rules; nonnegative. |

Table 36 presents the structure of the mission progress records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 37

**QUIZ ATTEMPT**

Storage: `studentQuizAttempts/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | One quiz submission attempt. Current browser writer uses this shape; Admin callable writer has an alternate shape noted below. PK; `{userId}_{attemptId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Attempt owner and quiz context. Required by direct-client rules; logical FKs for content fields. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Attempt owner and quiz context. Required by direct-client rules; logical FKs for content fields. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Attempt owner and quiz context. Required by direct-client rules; logical FKs for content fields. |
| `quizId` (FK) | STRING | Variable | NOT NULL | Attempt owner and quiz context. Required by direct-client rules; logical FKs for content fields. |
| `attemptId` (FK) | STRING | Variable | NOT NULL | Attempt owner and quiz context. Required by direct-client rules; logical FKs for content fields. |
| `questionIds` | LIST<STRING> | Variable | NOT NULL | Scored questions in the order adaptively presented during this attempt. Required by direct-client rules; unique IDs. |
| `answers` | MAP | Variable | NOT NULL | Submitted response keyed by question ID. Values can be choice strings or structured maps for interactive tasks. Required by direct-client rules. |
| `score` | INTEGER | - | NOT NULL | Score percentage. Required; 0–100. |
| `correctAnswers` | INTEGER | - | NOT NULL | Number correct and number of questions. Required. |
| `totalQuestions` | INTEGER | - | NOT NULL | Number correct and number of questions. Required. |
| `passed` | BOOLEAN | - | NOT NULL | Whether score met quiz `passingScore`. Required. |
| `topicsForReview` | LIST<STRING> | Variable | NOT NULL | Unique missed core and adaptive follow-up topics, capped at `totalQuestions` for Firestore rule compatibility. Required. |
| `completedAt` | TIMESTAMP | - | NOT NULL | Submission time. Required. |
| `response` | MAP | Variable | NOT NULL | Cached result/reward response used for replay/idempotency. The browser mission-quiz writer may include `adaptiveFollowup` when tagged practice questions are available. Required by direct-client rules. |
| `response.adaptiveFollowup.questionIds` | LIST<STRING> | Variable | YES | Ordered IDs of up to three adaptive follow-up questions; these are separate from scored mission `questionIds`. Optional. |
| `response.adaptiveFollowup.answers` | MAP | Variable | YES | Follow-up answer choices keyed by practice-question ID. Optional. |
| `response.adaptiveFollowup.correctAnswers` | INTEGER | - | YES | Follow-up diagnostic result; it does not affect mission score, passing, completion, or XP. Optional. |
| `totalQuestions` | INTEGER | - | YES | Follow-up diagnostic result; it does not affect mission score, passing, completion, or XP. Optional. |
| `score` | INTEGER | - | YES | Follow-up diagnostic result; it does not affect mission score, passing, completion, or XP. Optional. |
| `response.adaptiveFollowup.items` | LIST<MAP> | Variable | YES | Per-question snapshot: `questionId`, `topic`, `difficulty`, `selectedAnswer`, `correctAnswer`, and `isCorrect`. Optional. |
| `answerFingerprint` | STRING | Variable | YES | Server-calculated fingerprint used to verify retries. Optional; Admin callable writer. |
| `xpReward` | INTEGER | - | YES | XP awarded for this attempt; commonly zero after prior completion. Optional; Admin callable writer. |
| `response` (callable variant) | MAP | Variable | CONDITIONAL | Callable result including progression and reward information. Present on successful Admin callable writes. |

Table 37 presents the structure of the quiz attempt records. The active browser writer records scored attempts and optional diagnostic follow-up. Callable-only fields are labelled; browser grading is not a server-verified exam.

### Table 38

**CHAPTER PROGRESS**

Storage: `studentChapterProgress/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | One chapter challenge completion record per student/chapter. PK; `{userId}_{chapterId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Owner, chapter, and challenge. Required; logical FKs. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Owner, chapter, and challenge. Required; logical FKs. |
| `challengeId` (FK) | STRING | Variable | NOT NULL | Owner, chapter, and challenge. Required; logical FKs. |
| `completed` | BOOLEAN | - | NOT NULL | Completion state. Required; true on creation. |
| `bestScore` | INTEGER | - | NOT NULL | Highest chapter challenge score. Required; 0–100. |
| `completedAt` | TIMESTAMP | - | NOT NULL | Completion and latest score update time. Required. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Completion and latest score update time. Required. |

Table 38 presents the structure of the chapter progress records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 39

**STUDENT DAILY CHALLENGE**

Storage: `studentDailyChallenges/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | One daily completion per user and Philippines date. PK; `{userId}_{dateKey}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Owner and selected daily challenge. Required; logical FKs. |
| `challengeId` (FK) | STRING | Variable | NOT NULL | Owner and selected daily challenge. Required; logical FKs. |
| `dateKey` | STRING | Variable | NOT NULL | Local challenge date. Required; `YYYY-MM-DD`, UTC+8. |
| `completed` | BOOLEAN | - | NOT NULL | Completion and correctness state. Required by completion flow; true for reward. |
| `correct` | BOOLEAN | - | NOT NULL | Completion and correctness state. Required by completion flow; true for reward. |
| `selectedAnswer` | STRING | Variable | NOT NULL | Selected option, normally `A`–`D`. Required; normalized answer key. |
| `xpEarned` | INTEGER | - | NOT NULL | XP issued for first correct completion. Required; nonnegative. |
| `bestScore` | INTEGER | - | NOT NULL | Daily question score. Required; 100 for correct daily completion. |
| `completedAt` | TIMESTAMP | - | NOT NULL | Completion and update time. Required. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Completion and update time. Required. |

Table 39 presents the structure of the student daily challenge records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 40

**PRACTICE SESSION**

Storage: `studentPracticeProgress/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Append-only practice session. PK; auto-generated. |
| `userId` (FK) | STRING | Variable | NOT NULL | Student and practice context. Required; owner FK and content references. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Student and practice context. Required; owner FK and content references. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Student and practice context. Required; owner FK and content references. |
| `completedAt` | TIMESTAMP | - | NOT NULL | Session completion time. Required. |
| `totalQuestions` | INTEGER | - | NOT NULL | Number of questions completed. Required; greater than 0. |
| `firstTryCorrectCount` | INTEGER | - | NOT NULL | Number answered correctly on the first attempt. Required; 0 through `totalQuestions`. |
| `questionResults` | LIST<MAP> | Variable | NOT NULL | Each result records `questionId`, `topic`, `difficulty`, `firstTryCorrect`, and `attempts`. Required; list length equals `totalQuestions`. |
| `topicsForReview` | LIST<STRING> | Variable | NOT NULL | Topics missed on first try. Required. |

Table 40 presents the structure of the practice session records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 41

**STUDENT ARTIFACT**

Storage: `studentArtifacts/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Student ownership of a mission artifact. PK; `{userId}_{artifactId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Owner and artifact/lesson context. Required; logical FKs. |
| `artifactId` (FK) | STRING | Variable | NOT NULL | Owner and artifact/lesson context. Required; logical FKs. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Owner and artifact/lesson context. Required; logical FKs. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Owner and artifact/lesson context. Required; logical FKs. |
| `earnedAt` | TIMESTAMP | - | NOT NULL | Award time. Required. |

Table 41 presents the structure of the student artifact records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 42

**STUDENT BADGE**

Storage: `studentBadges/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Student ownership of a chapter badge. PK; `{userId}_{badgeId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Owner and badge/challenge context. Required; logical FKs. |
| `badgeId` (FK) | STRING | Variable | NOT NULL | Owner and badge/challenge context. Required; logical FKs. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Owner and badge/challenge context. Required; logical FKs. |
| `challengeId` (FK) | STRING | Variable | NOT NULL | Owner and badge/challenge context. Required; logical FKs. |
| `earnedAt` | TIMESTAMP | - | NOT NULL | Award time. Required. |

Table 42 presents the structure of the student badge records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 43

**EVIDENCE JOURNAL**

Storage: `studentEvidenceJournal/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Saved reference to one explored clue. PK; `{userId}_{sceneId}_{clueIndex}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Owner and lesson context. Required; logical FKs. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Owner and lesson context. Required; logical FKs. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Owner and lesson context. Required; logical FKs. |
| `sceneId` (FK) | STRING | Variable | NOT NULL | Owner and lesson context. Required; logical FKs. |
| `clueIndex` | INTEGER | - | NOT NULL | Index of the saved clue in its scene. Required; zero-based and within `exploreItems`. |
| `savedAt` | TIMESTAMP | - | NOT NULL | Save time. Required. |

Table 43 presents the structure of the evidence journal records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 44

**LESSON REVIEW EVENT**

Storage: `studentReviewEvents/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Append-only event for lesson review. PK; auto-generated. |
| `userId` (FK) | STRING | Variable | NOT NULL | Owner and reviewed lesson context. Required; logical FKs. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Owner and reviewed lesson context. Required; logical FKs. |
| `missionId` (FK) | STRING | Variable | NOT NULL | Owner and reviewed lesson context. Required; logical FKs. |
| `topic` | STRING | 1-160 | NOT NULL | Topic reviewed. Required; 1–160 chars. |
| `sceneIds` | LIST<STRING> | Variable | NOT NULL | Scene IDs associated with the review. Required; 1–50 entries. |
| `kind` | STRING | Variable | NOT NULL | Review event type. Required; currently `lesson-review`. |
| `completedAt` | TIMESTAMP | - | NOT NULL | Review completion time. Required. |

Table 44 presents the structure of the lesson review event records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 45

**LEARNING DRAFT**

Storage: `studentLearningDrafts/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Resumable in-progress activity state. PK; `{userId}_{kind}_{missionId or chapterId}`. |
| `userId` (FK) | STRING | Variable | NOT NULL | Draft owner. Required; FK to `users` and must equal Auth UID. |
| `kind` | STRING | Variable | NOT NULL | Activity type. Required; `story`, `quiz`, `practice`, or `chapter`. |
| `chapterId` (FK) | STRING | Variable | NOT NULL | Chapter context. Required; logical FK to `chapters`. |
| `missionId` | STRING OR NULL | Variable | NOT NULL | Mission context when applicable. Required for story/quiz/practice; null for chapter challenge. |
| `state` | MAP | Variable | NOT NULL | Saved UI state. Shape depends on `kind`: story progress/plans, quiz answers and flags, practice queue/results, or chapter challenge answers/index. Required. |
| `updatedAt` | TIMESTAMP | - | NOT NULL | Last draft save time. Required. |

Table 45 presents the structure of the learning draft records. The primary identifier is the Firestore document ID; referenced IDs connect the related records.

### Table 46

**STUDENT COSMETIC**

Storage: `studentCosmetics/{uid}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Student UID, also a logical FK to users. |
| frameId | STRING | Allowed values | NOT NULL | none, bamboo, sunburst or guardian; eligibility checked against the saved level. |
| updatedAt | TIMESTAMP | -  | NOT NULL | Preference save time. |

Table 46 presents the structure of the equipped student frame. Eligibility derives from the saved level; equipping a frame does not issue additional XP.

### Table 47

**PROGRESSION CONFIGURATION**

Storage: `learningSettings/progression`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Fixed document ID progression. |
| xpPerLevel | INTEGER | - | NOT NULL | Positive XP interval per level. |
| version | INTEGER | - | NOT NULL | Policy version. |
| reviewAfterDays | INTEGER | 1-365 | YES | Return-to-learn review interval. |

Table 47 presents the structure of the shared learning configuration. These are configuration documents, not individual student records.

### Table 48

**BAYANI AI CONFIGURATION**

Storage: `learningSettings/bayaniAI`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Fixed document ID bayaniAI. |
| enabled | BOOLEAN | - | NOT NULL | Feature availability. |
| model | STRING | Variable | YES | Configured AI model. |
| appCheckSiteKey | STRING | Variable | YES | Public client App Check key, not an API secret. |
| maxMessageCharacters | INTEGER | - | CONDITIONAL | Configured input limit. |
| welcomeMessage | STRING | Variable | YES | Opening message. |
| systemInstruction | STRING | Variable | YES | Teaching and response instructions. |

Table 48 presents the structure of the shared learning configuration. These are configuration documents, not individual student records.

### Table 49

**JOURNEY FINALE CONFIGURATION**

Storage: `learningSettings/journeyFinale`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Fixed learningSettings document ID journeyFinale. |
| enabled | BOOLEAN | - | NOT NULL | Whether completion evaluation is enabled. |
| id | STRING | Variable | NOT NULL | Frozen definition version, philippine-history-journey-v1. |
| title | STRING | Variable | NOT NULL | Journey title. |
| chapters | ARRAY OF MAPS | Variable | NOT NULL | Required chapter entries: id, title and eraId. |
| missions | ARRAY OF MAPS | Variable | NOT NULL | Required mission entries: id and chapterId. |
| finalChapterId (FK) | STRING | Variable | NOT NULL | Final chapter destination. Completion derives from existing saved mission/chapter progress; no new reward collection. |

Table 49 presents the structure of the frozen journey ending definition. Completion celebration derives from existing progress; it is not a school certificate or a separate XP award.

## Nested catalog attributes

These tables expand the maps and arrays in the catalog tables above. Dot notation denotes a child attribute; [] denotes each array element. Answer-letter children A/B/C/D are authored feedback keys. These are embedded structures, not additional collections. Types are the union observed in the dated catalog plus hash-verified published overlays and the cited authored metadata. CONDITIONAL means an optional activity or item type supplies the attribute; an observed value does not establish universal requiredness. A trailing-space key is retained exactly when present.

### Table 50

**ERA - EMBEDDED ATTRIBUTES**

Storage: embedded in `eras/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `requiredChapterIds[]` | STRING | Variable | CONDITIONAL | Earlier chapter completions required by the progression path. |

Table 50 presents the structure of the embedded eras attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 51

**MISSION - EMBEDDED ATTRIBUTES**

Storage: embedded in `missions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `learningGuide.answer` | INTEGER | - | CONDITIONAL | Zero-based index of the correct application choice; this ungraded companion activity does not award XP. |
| `learningGuide.chapterId` | STRING | Variable | CONDITIONAL | Logical reference to the parent chapter. |
| `learningGuide.choices` | ARRAY | Variable | CONDITIONAL | Ordered answer choices. |
| `learningGuide.choices[]` | STRING | Variable | CONDITIONAL | Ordered answer choices. |
| `learningGuide.feedback` | ARRAY | Variable | CONDITIONAL | Explanation shown for the selected choice or activity outcome. |
| `learningGuide.feedback[]` | STRING | Variable | CONDITIONAL | Explanation shown for the selected choice or activity outcome. |
| `learningGuide.missionId` | STRING | Variable | CONDITIONAL | Logical reference to the parent mission. |
| `learningGuide.question` | STRING | Variable | CONDITIONAL | Authored question or central inquiry. |
| `learningGuide.referenceNote` | STRING | Variable | CONDITIONAL | Editorial qualification of curriculum references; not a claim of official certification. |
| `learningGuide.refs` | ARRAY | Variable | CONDITIONAL | Editorial curriculum quarter/row locators. |
| `learningGuide.refs[]` | STRING | Variable | CONDITIONAL | Editorial curriculum quarter/row locators. |
| `learningGuide.task` | STRING | Variable | CONDITIONAL | Application scenario or task prompt. |
| `learningGuide.why` | STRING | Variable | CONDITIONAL | Explanation of why the lesson matters. |
| `learningObjectives[]` | STRING | Variable | CONDITIONAL | Authored learning objectives entry. |
| `sourceUrls[]` | STRING | Variable | CONDITIONAL | Historical/teaching reference URLs. |

Table 51 presents the structure of the embedded missions attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 52

**STORY SCENE - EMBEDDED ATTRIBUTES**

Storage: embedded in `storyScenes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `checkChoices[]` | STRING | Variable | CONDITIONAL | Scene quick-check choices. |
| `clueHunt.choices` | ARRAY | Variable | CONDITIONAL | Ordered answer choices. |
| `clueHunt.choices[]` | STRING | Variable | CONDITIONAL | Ordered answer choices. |
| `clueHunt.correctAnswer` | STRING | Variable | CONDITIONAL | Exact correct clue-hunt choice text, not an A-D letter. |
| `clueHunt.correctExplanation` | STRING | Variable | CONDITIONAL | Feedback after a correct clue-hunt response. |
| `clueHunt.correctTitle` | STRING | Variable | CONDITIONAL | Heading for correct clue-hunt feedback. |
| `clueHunt.instructions` | STRING | Variable | CONDITIONAL | Instructions for carrying out the activity. |
| `clueHunt.question` | STRING | Variable | CONDITIONAL | Authored question or central inquiry. |
| `clueHunt.retryExplanation` | STRING | Variable | CONDITIONAL | Guidance after an incorrect clue-hunt response. |
| `clueHunt.retryTitle` | STRING | Variable | CONDITIONAL | Heading for retry guidance. |
| `clueHunt.title` | STRING | Variable | CONDITIONAL | Learner-facing title. |
| `decisionChoices[]` | STRING | Variable | CONDITIONAL | Authored decision choices entry. |
| `exhibitActivity.effects` | ARRAY | Variable | CONDITIONAL | Selectable historical effects. |
| `exhibitActivity.effects[]` | MAP | Variable | CONDITIONAL | Selectable historical effects. |
| `exhibitActivity.effects[].id` | STRING | Variable | CONDITIONAL | Identifier unique within the containing authored activity. |
| `exhibitActivity.effects[].label` | STRING | Variable | CONDITIONAL | Learner-facing label. |
| `exhibitActivity.eyebrow` | STRING | Variable | CONDITIONAL | Small activity section label. |
| `exhibitActivity.instructions` | STRING | Variable | CONDITIONAL | Instructions for carrying out the activity. |
| `exhibitActivity.matchPrompt` | STRING | Variable | CONDITIONAL | Instruction above the matching controls. |
| `exhibitActivity.pairs` | ARRAY | Variable | CONDITIONAL | Authored action/effect matches. |
| `exhibitActivity.pairs[]` | MAP | Variable | CONDITIONAL | Authored action/effect matches. |
| `exhibitActivity.pairs[].action` | STRING | Variable | CONDITIONAL | Action/contribution to explain. |
| `exhibitActivity.pairs[].effectId` | STRING | Variable | CONDITIONAL | Identifier of the matching entry in effects. |
| `exhibitActivity.pairs[].feedback` | STRING | Variable | CONDITIONAL | Explanation shown for the selected choice or activity outcome. |
| `exhibitActivity.pairs[].id` | STRING | Variable | CONDITIONAL | Identifier unique within the containing authored activity. |
| `exhibitActivity.pairs[].label` | STRING | Variable | CONDITIONAL | Learner-facing label. |
| `exhibitActivity.retryMessage` | STRING | Variable | CONDITIONAL | Guidance when the current matches are incomplete or incorrect. |
| `exhibitActivity.successMessage` | STRING | Variable | CONDITIONAL | Feedback after a valid activity solution. |
| `exhibitActivity.title` | STRING | Variable | CONDITIONAL | Learner-facing title. |
| `exploreItems[]` | MAP | Variable | CONDITIONAL | Authored scene clue cards. |
| `exploreItems[].discovery` | STRING | Variable | CONDITIONAL | Clue explanation revealed when explored. |
| `exploreItems[].hint` | STRING | Variable | CONDITIONAL | Hint that guides exploration or practice. |
| `exploreItems[].icon` | STRING | Variable | CONDITIONAL | Decorative symbol used for display. |
| `exploreItems[].title` | STRING | Variable | CONDITIONAL | Learner-facing title. |
| `learningHelp.example` | STRING | Variable | CONDITIONAL | Worked example. |
| `learningHelp.explanation` | STRING | Variable | CONDITIONAL | Reasoning or feedback text. |
| `learningHelp.guidingQuestion` | STRING | Variable | CONDITIONAL | Prompt to help reason through the concept. |
| `learningHelp.vocabulary` | ARRAY | Variable | CONDITIONAL | Vocabulary entries. |
| `learningHelp.vocabulary[]` | MAP | Variable | CONDITIONAL | Vocabulary entries. |
| `learningHelp.vocabulary[].definition` | STRING | Variable | CONDITIONAL | Child-friendly meaning of the term. |
| `learningHelp.vocabulary[].term` | STRING | Variable | CONDITIONAL | Vocabulary term. |
| `reviewTopics[]` | STRING | Variable | CONDITIONAL | Authored review topics entry. |
| `routeActivity.conditions` | ARRAY | Variable | CONDITIONAL | Travel constraints used to compare routes. |
| `routeActivity.conditions[]` | STRING | Variable | CONDITIONAL | Travel constraints used to compare routes. |
| `routeActivity.instructions` | STRING | Variable | CONDITIONAL | Instructions for carrying out the activity. |
| `routeActivity.mapDescription` | STRING | Variable | CONDITIONAL | Text description of the route setting. |
| `routeActivity.routes` | ARRAY | Variable | CONDITIONAL | Candidate routes. |
| `routeActivity.routes[]` | MAP | Variable | CONDITIONAL | Candidate routes. |
| `routeActivity.routes[].description` | STRING | Variable | CONDITIONAL | Learner-facing description. |
| `routeActivity.routes[].feedback` | STRING | Variable | CONDITIONAL | Explanation shown for the selected choice or activity outcome. |
| `routeActivity.routes[].id` | STRING | Variable | CONDITIONAL | Identifier unique within the containing authored activity. |
| `routeActivity.routes[].name` | STRING | Variable | CONDITIONAL | Display name. |
| `routeActivity.routes[].suitable` | BOOLEAN | - | CONDITIONAL | Whether the route meets the authored travel conditions. |
| `routeActivity.title` | STRING | Variable | CONDITIONAL | Learner-facing title. |
| `sourceUrls[]` | STRING | Variable | CONDITIONAL | Historical/teaching reference URLs. |
| `tradeActivity.agreement` | MAP | Variable | CONDITIONAL | Authored exchange ratio. |
| `tradeActivity.agreement.offerGoodId` | STRING | Variable | CONDITIONAL | Identifier of the good offered. |
| `tradeActivity.agreement.offerQuantity` | INTEGER | - | CONDITIONAL | Whole quantity offered per exchange/plan. |
| `tradeActivity.agreement.receiveGoodId` | STRING | Variable | CONDITIONAL | Identifier of the good received. |
| `tradeActivity.agreement.receiveQuantity` | INTEGER | - | CONDITIONAL | Whole quantity received per exchange/plan. |
| `tradeActivity.instructions` | STRING | Variable | CONDITIONAL | Instructions for carrying out the activity. |
| `tradeActivity.journalEntries` | ARRAY | Variable | CONDITIONAL | Evidence-journal references/instructions for the exchange activity. |
| `tradeActivity.journalEntries[]` | STRING | Variable | CONDITIONAL | Evidence-journal references/instructions for the exchange activity. |
| `tradeActivity.ownGoods` | ARRAY | Variable | CONDITIONAL | Goods available to the learner-side community. |
| `tradeActivity.ownGoods[]` | MAP | Variable | CONDITIONAL | Goods available to the learner-side community. |
| `tradeActivity.ownGoods[].id` | STRING | Variable | CONDITIONAL | Identifier unique within the containing authored activity. |
| `tradeActivity.ownGoods[].name` | STRING | Variable | CONDITIONAL | Display name. |
| `tradeActivity.ownGoods[].quantity` | INTEGER | - | CONDITIONAL | Selected trade quantity. |
| `tradeActivity.ownNeed` | MAP | Variable | CONDITIONAL | Learner-side community need. |
| `tradeActivity.ownNeed.goodId` | STRING | Variable | CONDITIONAL | Identifier of the required good. |
| `tradeActivity.ownNeed.quantity` | INTEGER | - | CONDITIONAL | Selected trade quantity. |
| `tradeActivity.partnerGoods` | ARRAY | Variable | CONDITIONAL | Goods available to the partner community. |
| `tradeActivity.partnerGoods[]` | MAP | Variable | CONDITIONAL | Goods available to the partner community. |
| `tradeActivity.partnerGoods[].id` | STRING | Variable | CONDITIONAL | Identifier unique within the containing authored activity. |
| `tradeActivity.partnerGoods[].name` | STRING | Variable | CONDITIONAL | Display name. |
| `tradeActivity.partnerGoods[].quantity` | INTEGER | - | CONDITIONAL | Selected trade quantity. |
| `tradeActivity.partnerNeed` | MAP | Variable | CONDITIONAL | Partner community need. |
| `tradeActivity.partnerNeed.goodId` | STRING | Variable | CONDITIONAL | Identifier of the required good. |
| `tradeActivity.partnerNeed.quantity` | INTEGER | - | CONDITIONAL | Selected trade quantity. |
| `tradeActivity.title` | STRING | Variable | CONDITIONAL | Learner-facing title. |

Table 52 presents the structure of the embedded storyScenes attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 53

**QUIZ - EMBEDDED ATTRIBUTES**

Storage: embedded in `quizzes/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `practicePolicy.demoteAccuracy` | NUMBER | - | CONDITIONAL | Accuracy threshold for selecting an easier practice level. |
| `practicePolicy.difficultyLevels` | ARRAY | Variable | CONDITIONAL | Ordered available difficulty levels. |
| `practicePolicy.difficultyLevels[]` | STRING | Variable | CONDITIONAL | Ordered available difficulty levels. |
| `practicePolicy.promoteAccuracy` | NUMBER | - | CONDITIONAL | Accuracy threshold for selecting a harder practice level. |
| `practicePolicy.questionLimit` | INTEGER | - | CONDITIONAL | Maximum questions selected for a practice session. |
| `practicePolicy.reviewDifficulty` | STRING | Variable | CONDITIONAL | Initial difficulty for a missed-topic review. |
| `practicePolicy.startDifficulty` | STRING | Variable | CONDITIONAL | Initial difficulty with no missed-topic priority. |
| `questionBlueprint[]` | MAP | Variable | CONDITIONAL | Scored topic quotas and baseline difficulties. |
| `questionBlueprint[].count` | INTEGER | - | CONDITIONAL | Number of questions allocated to this topic/difficulty slot. |
| `questionBlueprint[].difficulty` | STRING | Variable | CONDITIONAL | Authored or selected easy/medium/hard difficulty. |
| `questionBlueprint[].topic` | STRING | Variable | CONDITIONAL | Requested or assessed topic ID. |

Table 53 presents the structure of the embedded quizzes attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 54

**QUESTION - EMBEDDED ATTRIBUTES**

Storage: embedded in `questions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `answerExplanations.A` | STRING | Variable | CONDITIONAL | Explanation for choosing option A. |
| `answerExplanations.B` | STRING | Variable | CONDITIONAL | Explanation for choosing option B. |
| `answerExplanations.C` | STRING | Variable | CONDITIONAL | Explanation for choosing option C. |
| `answerExplanations.D` | STRING | Variable | CONDITIONAL | Explanation for choosing option D. |
| `sourceUrls[]` | STRING | Variable | CONDITIONAL | Historical/teaching reference URLs. |

Table 54 presents the structure of the embedded questions attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 55

**PRACTICE QUESTION - EMBEDDED ATTRIBUTES**

Storage: embedded in `practiceQuestions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `answerExplanations.A` | STRING | Variable | CONDITIONAL | Explanation for choosing option A. |
| `answerExplanations.B` | STRING | Variable | CONDITIONAL | Explanation for choosing option B. |
| `answerExplanations.C` | STRING | Variable | CONDITIONAL | Explanation for choosing option C. |
| `answerExplanations.D` | STRING | Variable | CONDITIONAL | Explanation for choosing option D. |
| `answerHints.A` | STRING | Variable | CONDITIONAL | Hint after choosing option A. |
| `answerHints.B` | STRING | Variable | CONDITIONAL | Hint after choosing option B. |
| `answerHints.C` | STRING | Variable | CONDITIONAL | Hint after choosing option C. |
| `answerHints.D` | STRING | Variable | CONDITIONAL | Hint after choosing option D. |
| `reviewEvidencePolicy.minCleanSessions` | INTEGER | - | CONDITIONAL | Required clean practice sessions. |
| `reviewEvidencePolicy.minDistinctQuestions` | INTEGER | - | CONDITIONAL | Minimum distinct practice items needed. |
| `reviewEvidencePolicy.requiredDifficulty` | STRING | Variable | CONDITIONAL | Required practice difficulty for review evidence. |
| `reviewEvidencePolicy.version` | INTEGER | - | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `sourceUrls[]` | STRING | Variable | CONDITIONAL | Historical/teaching reference URLs. |

Table 55 presents the structure of the embedded practiceQuestions attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 56

**CHAPTER CHALLENGE - EMBEDDED ATTRIBUTES**

Storage: embedded in `chapterChallenges/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `sourceUrls[]` | STRING | Variable | CONDITIONAL | Historical/teaching reference URLs. |

Table 56 presents the structure of the embedded chapterChallenges attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 57

**CHAPTER CHALLENGE QUESTION - EMBEDDED ATTRIBUTES**

Storage: embedded in `chapterChallengeQuestions/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `answerExplanations.A` | STRING | Variable | CONDITIONAL | Explanation for choosing option A. |
| `answerExplanations.B` | STRING | Variable | CONDITIONAL | Explanation for choosing option B. |
| `answerExplanations.C` | STRING | Variable | CONDITIONAL | Explanation for choosing option C. |
| `answerExplanations.D` | STRING | Variable | CONDITIONAL | Explanation for choosing option D. |
| `evidenceTask.cards` | ARRAY | Variable | CONDITIONAL | Evidence cards for the task. |
| `evidenceTask.cards[]` | MAP | Variable | CONDITIONAL | Evidence cards for the task. |
| `evidenceTask.cards[].clueIndex` | INTEGER | - | CONDITIONAL | Zero-based index into the referenced scene exploreItems. |
| `evidenceTask.cards[].id` | STRING | Variable | CONDITIONAL | Identifier unique within the containing authored activity. |
| `evidenceTask.cards[].label` | STRING | Variable | CONDITIONAL | Learner-facing label. |
| `evidenceTask.cards[].sceneId` | STRING | Variable | CONDITIONAL | Current scene document ID. |
| `evidenceTask.correctEvidenceId` | STRING | Variable | CONDITIONAL | ID of the evidence card that supports the conclusion. |
| `evidenceTask.instructions` | STRING | Variable | CONDITIONAL | Instructions for carrying out the activity. |
| `evidenceTask.version` | INTEGER | - | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `matchingPairs[]` | MAP | Variable | CONDITIONAL | Correct left/right pairs for a matching task. |
| `matchingPairs[].left` | STRING | Variable | CONDITIONAL | Left-side matching label. |
| `matchingPairs[].right` | STRING | Variable | CONDITIONAL | Corresponding correct right-side label. |
| `sourceMissionIds[]` | STRING | Variable | CONDITIONAL | Mission IDs supplying the assessment evidence. |
| `sourceUrls[]` | STRING | Variable | CONDITIONAL | Historical/teaching reference URLs. |

Table 57 presents the structure of the embedded chapterChallengeQuestions attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

### Table 58

**ARTIFACT - EMBEDDED ATTRIBUTES**

Storage: embedded in `artifacts/{documentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `learningDetails.collectibleNote` | STRING | Variable | CONDITIONAL | Clarification that the reward is a learning token, not an owned original heritage object. |
| `learningDetails.lessonConnection` | STRING | Variable | CONDITIONAL | Connection between the collectible and the learned concept. |
| `learningDetails.reflectionQuestion` | STRING | Variable | CONDITIONAL | Ungraded reflection prompt. |
| `learningDetails.represents` | STRING | Variable | CONDITIONAL | What the collectible represents. |
| `learningDetails.historicalUse` | STRING | Variable | YES | Optional historical-use text supported by the museum reader; not observed in every authored metadata record. |

Table 58 presents the structure of the embedded artifacts attributes. The parent table identifies ownership and relationships. Array membership and nested keys do not create independent database entities.

## Saved runtime structures

The following embedded state/result schemas are compiled from the current writers. A draft is resumable UI state, not proof of completion. A dynamic {sceneId}, {topic} or {questionId} denotes an authored ID used as a map key. Different draft kinds have different state shapes. Null selections and incomplete maps are valid while an activity is in progress.

### Table 59

**STUDENTLEARNINGDRAFTS: STORY STATE**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `version` | STRING | Variable | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `sceneId` | STRING | Variable | CONDITIONAL | Current scene document ID. |
| `completed` | BOOLEAN | - | CONDITIONAL | Whether the lesson reached its completed state. |
| `quickChecks` | ARRAY OF STRINGS | Variable | CONDITIONAL | Scene IDs with completed quick checks. |
| `decisions` | ARRAY OF STRINGS | Variable | CONDITIONAL | Scene IDs with completed explanation/decision checks. |
| `clueHunts` | ARRAY OF STRINGS | Variable | CONDITIONAL | Scene IDs with completed clue hunts. |
| `clueHuntVersions` | MAP | Variable | CONDITIONAL | Activity fingerprints keyed by scene ID. |
| `clueHuntVersions.{sceneId}` | STRING | Variable | CONDITIONAL | Authored clue hunt versions / {scene id}. |
| `explored` | MAP | Variable | CONDITIONAL | Explored clue indices keyed by scene ID. |
| `explored.{sceneId}` | ARRAY OF INTEGERS | Variable | CONDITIONAL | Authored explored / {scene id}. |
| `tradePlans` | MAP | Variable | CONDITIONAL | Saved exchange plans keyed by scene ID. |
| `tradePlans.{sceneId}.offerGoodId` | STRING | Variable | CONDITIONAL | Identifier of the good offered. |
| `tradePlans.{sceneId}.receiveGoodId` | STRING | Variable | CONDITIONAL | Identifier of the good received. |
| `tradePlans.{sceneId}.offerQuantity` | INTEGER | - | CONDITIONAL | Whole quantity offered per exchange/plan. |
| `tradePlans.{sceneId}.receiveQuantity` | INTEGER | - | CONDITIONAL | Whole quantity received per exchange/plan. |
| `tradePlans.{sceneId}.confirmed` | BOOLEAN | - | CONDITIONAL | Whether the saved activity plan has been confirmed. |
| `routePlans` | MAP | Variable | CONDITIONAL | Saved route choices keyed by scene ID. |
| `routePlans.{sceneId}.routeId` | STRING | Variable | CONDITIONAL | Authored route plans / {scene id} / route id. |
| `routePlans.{sceneId}.confirmed` | BOOLEAN | - | CONDITIONAL | Whether the saved activity plan has been confirmed. |
| `exhibitPlans` | MAP | Variable | CONDITIONAL | Saved exhibit matches keyed by scene ID. |
| `exhibitPlans.{sceneId}.matches` | MAP OF STRINGS | Variable | CONDITIONAL | Selected matching pairs, keyed by left-hand item. |
| `exhibitPlans.{sceneId}.confirmed` | BOOLEAN | - | CONDITIONAL | Whether the saved activity plan has been confirmed. |

Table 59 presents the structure of the studentLearningDrafts: story state structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 60

**STUDENTLEARNINGDRAFTS: QUIZ STATE**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `version` | STRING | Variable | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `quizId` | STRING | Variable | CONDITIONAL | Quiz document ID. |
| `attemptId` | STRING | Variable | CONDITIONAL | UUID identifying the current mission submission. |
| `questionIds` | ARRAY OF STRINGS | Variable | CONDITIONAL | Questions in presentation order. |
| `answers` | MAP OF STRINGS | Variable | CONDITIONAL | Submitted answers keyed by question ID. |
| `locked` | MAP OF BOOLEANS | Variable | CONDITIONAL | Confirmed-answer flags keyed by question ID. |
| `flagged` | ARRAY OF STRINGS | Variable | CONDITIONAL | Question IDs marked to revisit. |
| `started` | BOOLEAN | - | CONDITIONAL | Whether the scored quiz has started. |
| `index` | INTEGER | - | CONDITIONAL | Zero-based current activity/question index. |
| `adaptiveFollowupStarted` | BOOLEAN | - | CONDITIONAL | Whether the unscored follow-up has started. |
| `adaptiveQuestionIds` | ARRAY OF STRINGS | Variable | CONDITIONAL | Ordered follow-up practice question IDs. |
| `adaptiveAnswers` | MAP OF STRINGS | Variable | CONDITIONAL | Follow-up choices keyed by practice question ID. |
| `adaptiveQuestionIndex` | INTEGER | - | CONDITIONAL | Current follow-up question index. |
| `adaptiveSelectedAnswer` | STRING / NULL | Variable | CONDITIONAL | Current follow-up choice, or null before selection. |
| `adaptiveFeedbackVisible` | BOOLEAN | - | CONDITIONAL | Whether follow-up feedback is showing. |
| `adaptiveFollowupComplete` | BOOLEAN | - | CONDITIONAL | Whether the diagnostic follow-up is finished. |
| `adaptiveTargetDifficulty` | STRING / NULL | Variable | CONDITIONAL | Current target follow-up difficulty. |
| `adaptiveTopicWeights` | MAP OF NUMBERS | Variable | CONDITIONAL | Topic priorities for follow-up selection. |
| `adaptiveTopicAttempts` | MAP OF NUMBERS | Variable | CONDITIONAL | Follow-up attempts per topic. |
| `missionTopicMastery` | MAP | Variable | CONDITIONAL | Derived topic states cached for resume; not a separate authority or collection. |
| `missionTopicMastery.{topic}.attempted` | INTEGER | - | CONDITIONAL | Authored mission topic mastery / {topic} / attempted. |
| `missionTopicMastery.{topic}.correct` | INTEGER | - | CONDITIONAL | Authored mission topic mastery / {topic} / correct. |
| `missionTopicMastery.{topic}.missed` | INTEGER | - | CONDITIONAL | Authored mission topic mastery / {topic} / missed. |
| `missionTopicMastery.{topic}.state` | STRING | Variable | CONDITIONAL | Authored mission topic mastery / {topic} / state. |

Table 60 presents the structure of the studentLearningDrafts: quiz state structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 61

**STUDENTLEARNINGDRAFTS: PRACTICE STATE**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `version` | STRING | Variable | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `topic` | STRING / NULL | Variable | CONDITIONAL | Requested or assessed topic ID. |
| `sessionId` | STRING | Variable | CONDITIONAL | Practice session document ID, reused for safe submission retry. |
| `pool` | ARRAY OF STRINGS | Variable | CONDITIONAL | Question IDs in the practice pool. |
| `remaining` | ARRAY OF STRINGS | Variable | CONDITIONAL | Question IDs remaining in practice. |
| `questionId` | STRING | Variable | CONDITIONAL | Current or assessed question ID. |
| `index` | INTEGER | - | CONDITIONAL | Zero-based current activity/question index. |
| `answer` | STRING / NULL | Variable | CONDITIONAL | Current practice choice, or null before selection. |
| `attempts` | INTEGER | - | CONDITIONAL | Number of tries for the item. |
| `mastered` | BOOLEAN | - | CONDITIONAL | Whether the current practice item was answered successfully. |
| `lastIncorrectAnswer` | STRING / NULL | Variable | CONDITIONAL | Latest incorrect choice, or null. |
| `targetDifficulty` | STRING | Variable | CONDITIONAL | Next practice difficulty. |
| `results` | ARRAY OF MAPS | Variable | CONDITIONAL | Completed practice item results. |
| `results[].questionId` | STRING | Variable | CONDITIONAL | Current or assessed question ID. |
| `results[].topic` | STRING | Variable | CONDITIONAL | Requested or assessed topic ID. |
| `results[].difficulty` | STRING | Variable | CONDITIONAL | Authored or selected easy/medium/hard difficulty. |
| `results[].firstTryCorrect` | BOOLEAN | - | CONDITIONAL | Whether the item was correct on its first try. |
| `results[].attempts` | INTEGER | - | CONDITIONAL | Number of tries for the item. |

Table 61 presents the structure of the studentLearningDrafts: practice state structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 62

**STUDENTLEARNINGDRAFTS: CHAPTER STATE**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `version` | STRING | Variable | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `index` | INTEGER | - | CONDITIONAL | Zero-based current activity/question index. |
| `answers` | MAP | Variable | CONDITIONAL | Submitted answers keyed by question ID. |
| `partialQuestionId` | STRING / NULL | Variable | CONDITIONAL | ID for an unfinished chapter question, or null. |
| `choice` | STRING / MAP / NULL | Variable | CONDITIONAL | Current chapter choice or structured evidence answer. |
| `matches` | MAP OF STRINGS | Variable | CONDITIONAL | Selected matching pairs, keyed by left-hand item. |
| `quantity` | NUMBER | - | CONDITIONAL | Selected trade quantity. |

Table 62 presents the structure of the studentLearningDrafts: chapter state structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 63

**STUDENTQUIZATTEMPTS: RESPONSE**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `correctAnswers` | INTEGER | - | CONDITIONAL | Number of correct scored answers. |
| `score` | INTEGER | - | CONDITIONAL | Rounded percentage score. |
| `progressionPolicy` | MAP | Variable | CONDITIONAL | Progression policy snapshot. |
| `progressionPolicy.xpPerLevel` | INTEGER | - | CONDITIONAL | XP interval per level. |
| `progressionPolicy.version` | INTEGER | - | CONDITIONAL | Content/policy fingerprint or version used to reject incompatible saved state. |
| `passed` | BOOLEAN | - | CONDITIONAL | Whether the passing threshold was met. |
| `topicsForReview` | ARRAY OF STRINGS | Variable | CONDITIONAL | Missed topics selected for follow-up review. |
| `firstCompletion` | BOOLEAN | - | CONDITIONAL | Whether this is the first rewarded eligible completion. |
| `xpReward` | INTEGER | - | CONDITIONAL | XP issued for this submission; zero on repeats. |
| `totalXp` | INTEGER | - | CONDITIONAL | Saved total XP after submission. |
| `level` | INTEGER | - | CONDITIONAL | Level after reward evaluation. |
| `bestScore` | INTEGER | - | CONDITIONAL | Highest saved activity score. |
| `learningStreak` | INTEGER | - | CONDITIONAL | Saved daily learning streak. |
| `artifactResult` | MAP | Variable | CONDITIONAL | Artifact award outcome. |
| `artifactResult.artifact` | MAP / NULL | Variable | CONDITIONAL | Artifact catalog snapshot or null; uses the ARTIFACT schema. |
| `artifactResult.newlyEarned` | BOOLEAN | - | CONDITIONAL | Whether this submission newly issued the ownership record. |
| `badgeResult` | MAP | Variable | CONDITIONAL | Badge award outcome. |
| `badgeResult.badge` | MAP / NULL | Variable | CONDITIONAL | Badge catalog snapshot or null; uses the BADGE schema. |
| `badgeResult.newlyEarned` | BOOLEAN | - | CONDITIONAL | Whether this submission newly issued the ownership record. |
| `adaptiveFollowup` | MAP | Variable | CONDITIONAL | Unscored diagnostic result, separate from the mission score. |
| `adaptiveFollowup.questionIds` | ARRAY OF STRINGS | Variable | CONDITIONAL | Questions in presentation order. |
| `adaptiveFollowup.answers` | MAP OF STRINGS | Variable | CONDITIONAL | Submitted answers keyed by question ID. |
| `adaptiveFollowup.correctAnswers` | INTEGER | - | CONDITIONAL | Number of correct scored answers. |
| `adaptiveFollowup.totalQuestions` | INTEGER | - | CONDITIONAL | Number of follow-up items. |
| `adaptiveFollowup.score` | INTEGER | - | CONDITIONAL | Rounded percentage score. |
| `adaptiveFollowup.items` | ARRAY OF MAPS | Variable | CONDITIONAL | Per-question follow-up result snapshots. |
| `adaptiveFollowup.items[].questionId` | STRING | Variable | CONDITIONAL | Current or assessed question ID. |
| `adaptiveFollowup.items[].topic` | STRING | Variable | CONDITIONAL | Requested or assessed topic ID. |
| `adaptiveFollowup.items[].difficulty` | STRING | Variable | CONDITIONAL | Authored or selected easy/medium/hard difficulty. |
| `adaptiveFollowup.items[].selectedAnswer` | STRING | Variable | CONDITIONAL | Chosen answer letter. |
| `adaptiveFollowup.items[].correctAnswer` | STRING | Variable | CONDITIONAL | Authored correct answer letter. |
| `adaptiveFollowup.items[].isCorrect` | BOOLEAN | - | CONDITIONAL | Whether the selected answer matched the key. |

Table 63 presents the structure of the studentQuizAttempts: response structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 64

**STUDENTPRACTICEPROGRESS: QUESTIONRESULTS[]**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `questionId` | STRING | Variable | CONDITIONAL | Current or assessed question ID. |
| `topic` | STRING | Variable | CONDITIONAL | Requested or assessed topic ID. |
| `difficulty` | STRING | Variable | CONDITIONAL | Authored or selected easy/medium/hard difficulty. |
| `firstTryCorrect` | BOOLEAN | - | CONDITIONAL | Whether the item was correct on its first try. |
| `attempts` | INTEGER | - | CONDITIONAL | Number of tries for the item. |

Table 64 presents the structure of the studentPracticeProgress: questionResults[] structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 65

**INTERACTIVE ANSWERS (CHAPTER DRAFTS AND GRADING PAYLOADS)**

Storage: embedded structures; see `js/story.js`, `js/quiz.js`, `js/practice.js`, `js/chapter-challenge.js` and `js/student-rewards-client.js`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| `gameType` | STRING | Variable | CONDITIONAL | matching, tradeSimulation or evidenceDecision, according to the task. |
| `matches` | MAP OF STRINGS | Variable | CONDITIONAL | Selected matching pairs, keyed by left-hand item. |
| `quantity` | NUMBER | - | CONDITIONAL | Selected trade quantity. |
| `evidenceId` | STRING | Variable | CONDITIONAL | Chosen evidence card ID. |
| `conclusion` | STRING | Variable | CONDITIONAL | Chosen conclusion letter. |

Table 65 presents the structure of the Interactive answers (chapter drafts and grading payloads) structure. Story/quiz/practice/chapter draft paths are relative to state; quiz response paths are relative to response; practice result paths are relative to each questionResults entry. Interactive answer maps apply only to their matching task type. Chapter grading payloads are not persisted as a separate chapter-attempt collection.

### Table 66

**AUTHENTICATION IDENTITY**

Storage: Firebase Authentication managed user; not a Firestore collection.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| uid (PK) | STRING | Variable | NOT NULL | Identity shared with the users document ID. |
| email | STRING | Variable | NOT NULL | Authentication email; profile email is an application copy. |
| emailVerified | BOOLEAN | - | NOT NULL | Firebase-managed verification state; teacher submission checks the authenticated token. |
| password credential | AUTH-MANAGED | - | CONDITIONAL | Managed internally by Firebase Authentication for email/password login. No plaintext password or application password column is stored. |

Table 66 presents the structure of the authentication boundary. Credentials, refresh tokens and provider internals are managed by Firebase; they are not proposed application profile attributes.

### Table 67

**BROWSER PREFERENCES AND SESSION REFERENCES**

Storage: browser localStorage/sessionStorage; not Firestore.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| lakbay.reading-surface | STRING | paper / dark | YES | Local reading surface. |
| lakbay.discovery-wall.v1.{encoded uid} | STRING | JSON array | YES | Up to three kind/id pins; ownership checked when displayed. |
| lakbay.narrator-voice | STRING | Variable | YES | Browser voice URI. |
| lakbay.narration-enabled | STRING | on / off | YES | Narration preference. |
| lakbay.narration-volume | STRING | 0-100 | YES | Narration volume stored as text. |
| lakbay.lesson-effects | STRING | on / off | YES | Lesson feedback sound preference. |
| lakbay.lesson-effects-volume | STRING | 0-100 | YES | Lesson sound volume stored as text. |
| lakbay-ui-sounds | STRING | on / off | YES | Interface sound preference. |
| lakbay-ui-sound-volume | STRING | 0-100 | YES | Interface sound volume. |
| lakbay-background-music | STRING | on / off | YES | Background music preference. |
| lakbay-background-music-volume | STRING | 0-100 | YES | Background music volume. |
| lakbay-reduce-motion | STRING | on / off | YES | Reduced animation preference. |
| lakbay-high-contrast | STRING | on / off | YES | High contrast preference. |
| lakbay-focus-audio | STRING | on / off | YES | Background audio focus/ducking preference. |
| lakbay-reading-size | STRING | standard / large / larger | YES | Reading size preference. |
| lakbay-music-session-epoch-v4 | STRING | NUMBER AS TEXT | YES | Session music playback origin in milliseconds. |
| lakbay-content-v1:{JSON [uid,key]} | STRING | JSON map | YES | Tab-local instructional cache: at (millisecond time), rows[] with id and data. Default TTL 120 seconds; maximum 24 entries; not an access/progress cache. |
| bayaniAppCheckDebug | STRING | true | YES | Explicit localhost-only tab debug opt-in; no credential value. |
| lakbay.finale-reflection:{uid}:{definitionId} | STRING | 1000 | YES | Optional explicitly saved local reflection. |
| lakbay.level-rewards.seen:{uid} | STRING | INTEGER AS TEXT | YES | Session-only highest level celebration seen. |
| missionQuiz:{uid}:{quizId} | STRING | UUID | YES | Session reference to the active quiz attempt. |
| missionQuizSet:{uid}:{attemptId} | STRING | JSON array | YES | Session question order; not a scored result. |

Table 67 presents the structure of browser-held settings/references. Optional values can be absent; browser storage does not award XP or replace owned Firestore records. Additional accessibility and cache keys are listed in the source-backed inventory linked below. Firebase SDK internal storage is outside this application dictionary.

## Prepared alternate AI backend (inactive)

The repository contains an unpublished alternate backend. The following configuration extensions and quota records are documented to account for repository code, not as a claim that the backend or these records are deployed. They must remain separate from the current student data model. No chat transcript storage is introduced by these quota records.

### Table 68

**BAYANI BACKEND CONFIGURATION EXTENSION - INACTIVE**

Storage: prepared fields of `learningSettings/bayaniAI`; not an activation.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| provider | STRING | gemini / anthropic | YES | Client defaults to gemini when absent. |
| minorsUseApproved | BOOLEAN | - | CONDITIONAL | Explicit suitability prerequisite for the alternate provider; false in draft. |
| backendEndpoint | STRING | Variable | YES | HTTPS /api/bayani/chat endpoint; localhost HTTP allowed for local development. |
| maxOutputTokens | INTEGER | 1-1500 | CONDITIONAL | Backend output ceiling. |
| perMinuteLimit | INTEGER | 1-60 | CONDITIONAL | Per-user requests per minute. |
| perStudentDailyLimit | INTEGER | 1-10000 | CONDITIONAL | Per-student requests per Philippine date. |
| globalDailyLimit | INTEGER | 1-1000000 | CONDITIONAL | Global daily request ceiling. |

Table 68 presents the structure of the prepared backend extension. Existing enabled/model/systemInstruction/maxMessageCharacters fields remain shared; the alternate backend additionally limits model to 200 and instruction to 24000 characters. API keys and server credentials belong in server environment configuration, never student-readable Firestore fields.

### Table 69

**BAYANI USER USAGE - INACTIVE**

Storage: prepared `bayaniUsage/{uid_YYYY-MM-DD}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Account UID and Philippine day. |
| userId (FK) | STRING | Variable | NOT NULL | Quota owner. |
| date | STRING | 10 | NOT NULL | Philippine date YYYY-MM-DD. |
| requests | INTEGER | - | NOT NULL | Reserved daily requests, including failed provider calls. |
| minuteStartMillis | INTEGER | - | NOT NULL | Minute boundary in epoch milliseconds. |
| minuteRequests | INTEGER | - | NOT NULL | Requests reserved in that minute. |
| updatedAtMillis | INTEGER | - | NOT NULL | Last reservation time. |

Table 69 presents the structure of the inactive server-only per-user quota writer. No message text, answer, credential or official learning score is stored.

### Table 70

**BAYANI DAILY USAGE - INACTIVE**

Storage: prepared `bayaniUsageDaily/{YYYY-MM-DD}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Philippine date key. |
| date | STRING | 10 | NOT NULL | Philippine date YYYY-MM-DD. |
| requests | INTEGER | - | NOT NULL | Global daily request reservations. |
| updatedAtMillis | INTEGER | - | NOT NULL | Last reservation time. |

Table 70 presents the structure of the inactive global quota writer. Server transactions coordinate the user/day and global/day reservation; browser access is not granted.

## Potential teacher and administrator attributes (proposed only)

The following optional extensions are design proposals, not currently stored fields or granted permissions. They require an agreed purpose, UI, validation, access rules and retention policy before implementation. They do not require students to belong to a school. Proposed sizes are suggested design limits, not existing Firestore constraints.

### Table 71

**TEACHER PROFILE EXTENSION - PROPOSED**

Storage: proposed `teacherProfiles/{uid}`; not implemented.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Teacher UID; logical FK to users. |
| specialization | STRING | 150 proposed | YES | Teaching subject or specialization. |
| gradeLevels | ARRAY OF STRINGS | Variable | YES | Proposed supported grade levels. |
| bio | STRING | 500 proposed | YES | Optional professional introduction, with explicit audience controls. |

Table 71 presents the structure of a potential teacher profile extension. Existing legal name, institution and credential data remain in the private application; they should not be duplicated into a public profile.

### Table 72

**ADMINISTRATOR PROFILE EXTENSION - PROPOSED**

Storage: proposed `administratorProfiles/{uid}`; not implemented.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Administrator UID; logical FK to users. |
| positionTitle | STRING | 100 proposed | YES | Administrative responsibility title. |
| department | STRING | 100 proposed | YES | Optional operating team/department once an operator is selected. |
| appointedAt | TIMESTAMP | -  | YES | Trusted appointment date. |
| appointedBy (FK) | STRING | Variable | YES | Trusted appointing administrator reference, where applicable. |

Table 72 presents the structure of a potential administrator profile extension. Descriptive titles do not confer privileges. The current system has a single admin role; granular permission groups and an appointment workflow are not implemented.

## Classroom workflow additions — 5 November 2026

These entities are implemented in the local workflow and repository rules. This does not claim that the online rules or website have been published. Existing CLASS ASSIGNMENT records now represent shared class learning goals; they now also support a terminal status and server-written endedAt timestamp.

### Table 73

**CLASS REVIEW ASSIGNMENT**

Storage: `classReviewAssignments/{assignmentId}`. Fresh completion is derived from quiz attempts rather than stored in this document.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Auto-generated private review identifier. |
| classId (FK) | STRING | Variable | NOT NULL | Receiving class. |
| userId (FK) | STRING | Variable | NOT NULL | Intended student, a current class member when assigned. |
| assignmentType | STRING | Fixed value | NOT NULL | `targeted-review`. |
| reviewTopic | STRING | 0–150 | YES for legacy | Authored topic key; empty means whole lesson. |
| reviewSceneId (FK) | STRING | 0–150 | YES for legacy | Active story scene proving the topic-to-mission mapping; empty for whole-lesson review. |
| reflectionQuestion | STRING | 0–500 | YES for legacy | Teacher's short understanding question; immutable after first publication. |
| title | STRING | 1–120 | NOT NULL | Mission title shown in the activity. |
| instructions | STRING | Up to 1500 | NOT NULL | Teacher guidance; the review form requires nonempty guidance. |
| missionId (FK) | STRING | 1–150 in client | NOT NULL | Active mission to review. |
| chapterId (FK) | STRING | 1–150 in client | NOT NULL | Mission's active chapter. |
| status | STRING | Fixed values | NOT NULL | `draft`, `published`, `closed`, or `withdrawn`. |
| publishedAt | TIMESTAMP | — | NOT NULL | Server time of latest publication/edit write; not the fresh-work anchor. |
| updatedAt | TIMESTAMP | — | NOT NULL | Latest server update time. |
| endedAt | TIMESTAMP | - | CONDITIONAL | Server time of closing/withdrawal. Required for terminal states; absent/null for active work. Evidence after this time does not satisfy the ended activity. |
| dueAt | TIMESTAMP | — | YES | Optional deadline. |
| assignedAt | TIMESTAMP OR NULL | — | CONDITIONAL | First publication time, preserved across edits; null for a never-published draft. |

Table 73 records private review activities. A new passing quiz result saved strictly after assignedAt satisfies the review; for ended activities it must also be dated at or before endedAt. Older mission completion does not satisfy it. Create a new document for another round of assigned review.

### Table 74

**CLASS HELP REQUEST**

Storage: `classHelpRequests/{classId}_{userId}_{assignmentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK) | STRING | Variable | NOT NULL | Deterministic class, student and assignment key. |
| classId (FK) | STRING | Variable | NOT NULL | Class where help was requested. |
| userId (FK) | STRING | Variable | NOT NULL | Requesting student. |
| assignmentId (FK) | STRING | Variable | NOT NULL | Class goal or private review identifier. |
| assignmentKind | STRING | Fixed values | YES for legacy | `class-goal` or `targeted-review`; absent legacy values mean class goal. |
| chapterId (FK) | STRING | Variable | NOT NULL | Assignment chapter. |
| missionId (FK) | STRING | Variable | NOT NULL | Assignment mission. |
| reason | STRING | Fixed values | NOT NULL | `lesson`, `question`, or `next-step`. |
| message | STRING | 0–500 | NOT NULL | Optional explanatory text; empty string permitted. |
| status | STRING | Fixed values | NOT NULL | `open` or `answered`. |
| response | STRING | 0–1500 | NOT NULL | Empty while open; nonempty teacher reply when answered. |
| revision | INTEGER | — | NOT NULL | Starts at 1; increments for a follow-up after a reply. |
| createdAt | TIMESTAMP | — | NOT NULL | Initial server creation time. |
| updatedAt | TIMESTAMP | — | NOT NULL | Latest server request/reply time. |
| answeredAt | TIMESTAMP OR NULL | — | CONDITIONAL | Server reply time, reset to null on follow-up. |
| understanding | STRING | Fixed values | YES for legacy | Empty/unset, `understood`, or `needs-help`; student's response to current teacher guidance. |
| understandingAt | TIMESTAMP OR NULL | — | YES for legacy | Server response time; reset for a new reply or follow-up. |

Table 74 holds one current question and reply per assignment/student. A follow-up replaces the current content; this is not a conversation archive. Access is private to the student and owning teacher under applicable membership rules.

### Table 75

**CLASSMATE DISPLAY NAME**

Storage: nested `classes/{classId}/classmates/{studentId}`.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK, FK) | STRING | Variable | NOT NULL | Student UID; class relationship is encoded in the parent path. |
| displayName | STRING | 1–60 | NOT NULL | Student-chosen classroom name, required when this optional document exists. |

Table 75 describes the opt-in class roster projection. It stores no score, email, feedback or private profile fields. The entry is removed with membership when the student leaves or is removed.

### Table 76

**CLASS REVIEW REFLECTION**

Storage: `classReviewReflections/{reviewId}`. Current explanation and teacher guidance for a private review, not an automatically graded answer or conversation archive.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK, FK) | STRING | Variable | NOT NULL | Corresponding private review assignment ID. |
| classId (FK) | STRING | Variable | NOT NULL | Class relationship. |
| userId (FK) | STRING | Variable | NOT NULL | Intended student. |
| reviewId (FK) | STRING | Variable | NOT NULL | Same as the document ID. |
| question | STRING | 1–500 | NOT NULL | Matches the assignment's published reflectionQuestion. |
| body | STRING | 1–600 | NOT NULL | Student explanation in their own words. |
| attemptId (FK) | STRING | Variable | NOT NULL | studentQuizAttempts document ID for a matching fresh passing review attempt. |
| revision | INTEGER | — | NOT NULL | Starts at 1 and increments when the student revises their explanation. |
| submittedAt | TIMESTAMP | — | NOT NULL | Server time of current explanation. |
| response | STRING | 0–1500 | NOT NULL | Empty until private teacher guidance is sent. |
| respondedAt | TIMESTAMP OR NULL | — | CONDITIONAL | Server guidance time; null when not yet answered or when student revises. |

Table 76 links a student's explanation to a fresh passing review attempt. Updating the explanation clears prior guidance. Rules prevent the student writing teacher responses; teacher guidance requires current membership and transactions reject stale revisions. Explanations do not alter grades, XP or mission completion.

## Reconciliation with the old dictionary

- USER, STUDENT, TEACHER and ADMINISTRATOR now share Firebase Auth UID identity. The three role tables above are explanatory views, not additional collections. Passwords remain in Firebase Authentication.
- The old LESSON is represented by ERA, CHAPTER, MISSION and STORY SCENE. Do not invent a separate lessons collection or Lessn_ID.
- ENROLLMENT maps to classMembers; rotating/expiring invitations have their own CLASS JOIN CODE records.
- Old REWARD/STUDENT_REWARD are represented by mission/daily XP, catalog artifacts/badges and student ownership records. No generic rewards/studentRewards collection is claimed. Level titles, community visuals and the finale badge can be derived instead of stored separately.
- The old AI_INTERACTION table is not an implemented persistent chat log. Generated Bayani practice is transient and does not become official quiz, mastery or reward evidence. No student conversation history collection is invented.
- Adaptive topic mastery is calculated from attempts, practice sessions and review events, not a separate stored mastery table.
- Browser-local reading preference, discovery-wall pins, narration voice and optional finale reflection are local preferences, not Firestore tables. Authored detective/then-and-now/explain-to-Bayani interactions are transient unless an existing journal save is used.
- Saved narration audio and its manifests are static assets, not student voice recordings or database rows. The inactive trusted-assessment backend proposal is excluded from current tables.

## Implementation references

See [technical field reference](data-dictionary.md), [Firestore access rules](../firestore.rules), [teacher application validation](../js/teacher-application-policy.js), [application writer](../js/teacher-application-client.js), [administrator decision writer](../js/teacher-application-review.js), [class validation](../js/teacher-class-policy.js) and [class writer](../js/teacher-class-client.js). Requiredness may differ for legacy documents or alternate server writers; the technical reference explains these variants. This document changes documentation only.

## Coverage and maintenance

The [field audit](validation/data-dictionary-audit-2026-11-03.json) records exact observed catalog paths/types, runtime schemas, publication provenance and source hashes. Run `node functions/prepare-data-dictionary.cjs` followed by `node functions/audit-data-dictionary.cjs` after schema changes. The audit checks explicit rule/client collection references, rule-listed field names, observed catalog paths, documented runtime paths, table numbering and five-column formatting. It does not prove semantic correctness of every writer or discover fields that exist only in an unexported live document.

The data model is documented at three levels: actual Firestore collections/configuration documents; embedded maps/arrays and browser state; and separately labelled inactive/proposed extensions. Therefore the number of numbered tables is not the number of physical collections. Parent record ownership and permissions also apply to its embedded fields. No current teacher can author the main curriculum, no administrator self-promotion workflow is implied, and membership remains optional for students.

### Table 77

**CLASS REVIEW PUBLICATION STATE**

Storage: `classReviewPublicationState/{classId}`. Implemented locally; matching rules and frontend publication are required.

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| document ID (PK, FK) | STRING | Variable | NOT NULL | Class document identifier; one coordination record per classroom. |
| classId (FK) | STRING | Variable | NOT NULL | Same class identifier as the document ID. |
| revision | INTEGER | Positive | NOT NULL | Starts at 1 and advances by exactly 1 per updated-client review publication transaction. Rejects stale duplicate checks across tabs/devices. |
| updatedAt | TIMESTAMP | - | NOT NULL | Server timestamp of the last coordination update. |

Table 77 stores publication coordination metadata, not a student result or an exclusive held lock. It does not prohibit intentional additional review rounds. Updated clients change this record atomically with review writes; legacy/direct writes are not forced through that protocol. Read/write access is limited to the owning qualified teacher, with writes requiring an active class; list/delete are denied.

### Practice result and draft attribute addition - 6 November 2026

| Column Name | Data Type | Field Size | Null | Description |
| --- | --- | --- | --- | --- |
| questionResults[].hintRequested | BOOLEAN | - | YES; absent in historical rows | Nested studentPracticeProgress question result: true = recorded in-app hint request before a correct answer; false = no recorded request for a newly tracked question; null/absent = unknown. Not proof of hint delivery or unaided understanding. Browser-reported; not individually validated by current rules. |
| state.hintRequested | BOOLEAN | - | YES; absent in older drafts | Current practice question's hint-request state in studentLearningDrafts; restored on reload. Completed rows inside state.results retain their question-level attribute. |

These extend existing practice/draft records without a new entity. Implemented locally, not yet published. First-try scoring and rewards are unchanged; see docs/practice-hint-evidence.md.
