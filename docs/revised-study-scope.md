# Revised study scope and role boundaries

Confirmed from the user's supplied revised study summary on 7 November 2026. This records study requirements, not a claim that every feature is implemented or validated.

**LakbayPanahon: An AI-Powered Gamified Philippine History Learning System for Grade 5 Students.** Selected relevant Grade 5 Araling Panlipunan topics; supplementary learning, not a replacement for classroom instruction.

## Core flow

- Student: register/sign in, set up profile/avatar, learn independently through interactive lessons and story missions, answer quizzes, receive feedback/adaptive review, use Bayani AI, earn configured rewards and track progress.
- Classroom participation is optional. Joining, leaving or not having a class must not prevent independent learning or erase personal progress. Historical prerequisites still apply.
- Teacher: register, verify email and submit teaching details in the current unified setup, await admin verification, then create classes with unique codes, monitor joined students' progress/results/achievements and post optional announcements. Existing assignments and private guidance support facilitation; they do not make the core learning journey classroom-dependent.
- Administrator: sign in, manage users, verify/approve teacher accounts, manage account status, monitor platform activity and perform bounded administrative/system functions. Reasons and decision history support accountability.
- Admin accounts are provisioned through trusted setup, not public registration. Student/teacher signup cannot grant admin privileges. Admin uses the existing sign-in flow with an active admin profile; no credentials belong in frontend source.

## Content ownership boundary

Neither the teacher nor administrator application role creates, edits, publishes or unpublishes the system's core lessons or main quizzes. Do not add a content-management workflow to either dashboard. Development/maintenance of verified learning content is separate from these application roles. Do not assign a new content-author role without a confirmed requirement.

Prior restricted-editor/publication-authority experiments are infrastructure investigations, not requirements for the admin user journey. Preserve their evidence and stop/go findings; do not use them to expand role permissions. The current secured assessment transport remains on hold independently of admin feature scope.

## Evaluation and delivery boundaries

- Intended learners are Grade 5 students generally; selected participants in Cebu define pilot evaluation location, not application eligibility.
- Evaluate functionality, usability, satisfaction, acceptance and participant experience. Long-term learning gains, nationwide effectiveness and superiority over traditional instruction are not required claims. Extra learning studies must not become invented graduation requirements for this capstone.
- AI is supportive and potentially fallible. AI review generation/recommendation in the study is a requirement to reconcile with actual implementation, not proof that generated items are suitable for scored assessments.
- Free independent student learning is central. Institutional/premium features and optional rewarded ads are business-model considerations, not automatic authorization to implement billing or advertising.
- The supplied summary mentions Flutter/Dart student Android/web and React teacher/admin as an earlier proposed approach. Current repository interfaces are HTML/CSS/JavaScript. This is a documentation/implementation difference to reconcile explicitly, not authorization for a framework rewrite. iOS remains future scope.

## Immediate admin work

Complete account/qualification save recovery, polish the review interface and build only a bounded platform-administration overview backed by actual available data. Verify cross-role access and recovery. Do not introduce curriculum editing, score/XP editing, content publication, billing or infrastructure privileges into admin UI.
