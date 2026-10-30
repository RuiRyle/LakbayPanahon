# Current student implementation status

Reviewed 27 October 2026. The tracked core student workflow is implemented locally. The normal desktop learning journey now passes against live Firestore; broader acceptance and curriculum approval remain outstanding.

## Learning journey

| Stage | Current behavior |
| --- | --- |
| Entry | Active student profile, optional profile setup and eligible next activity on the dashboard. |
| Chapter/mission | Firestore catalog, era/chapter prerequisites, saved-completion unlocks and missing-content recovery. |
| Lesson | Exploration, decisions, quick checks, previous/next scenes, objectives and recap. |
| Main quiz | Current policy is five questions and 60% passing; UI and grading read the configured policy. |
| Failure | Attempt saved without mission rewards; feedback, optional targeted practice, lesson review and retry. |
| Practice | Separate questions, topic/difficulty adaptation, hints, explanations, saved evidence and next steps. |
| Retry | Equivalent configured coverage, unseen questions preferred, repeat disclosure for finite banks. |
| Pass | Mission completion, one-time XP and configured artifact; remaining topics may still be reviewed. |
| Chapter challenge | Mission prerequisites, multiple activity types, completion/badge saving, save retry and eligible next-chapter navigation. |
| Collections | Achievements contains separate chapter badges and mission artifacts, earned counts/dates and independent read/retry states. Dashboard links to the page. |
| Bayani AI | Replaces Daily Challenge; chat UI and Firebase AI Logic adapter implemented. Provider/App Check activation and real reply verification pending. |

## Saved state

Lessons, main quizzes, practice and chapter challenges have Firestore drafts, refresh recovery, saving/retry status and unsaved-leave protection where browsers support it. Changed assessment content invalidates stale quiz answers. Completed progress and rewards are separate from drafts. Lesson recap and chapter challenge restoration now avoid saving a temporary fresh-attempt state over the restored record.

Practice drafts preserve their question pool, attempts, results and difficulty; lesson/main quiz also offer confirmed restart. Chapter challenge drafts also restore current questions and partial choice/matching/trade interactions, with scores recalculated from submitted answers. Their completed records remain saved. Simultaneous-tab draft editing uses last-write-wins behavior.

## Data and deployment

- Runtime learning content, progression settings and learner state come from Firestore.
- All 50 main/retry questions have answer explanations and learning points.
- All 54 active practice questions have topic hints and learning points.
- Five quiz-backed missions have authored recaps and objective lists.
- Supporting Firestore rules are deployed to the original project.
- The latest frontend changes are local; Firebase Hosting has not been deployed.
- Maintenance JSON files are reviewed migration artifacts, not runtime data sources.

## Acceptance still outstanding

The [live desktop website walkthrough](validation/student-desktop-2026-10-27.md) passed the normal journey from registration through practice, mission/chapter completion, next-chapter access, replay XP protection and logout/login. The extended run also verified all four activity refreshes, chapter/artifact replay protection, profile/collection persistence, daily behavior, missing-content recovery and offline/reconnected/slow-network saving. Manual desktop visual review, live server-expiry edge cases, independent curriculum review and physical-phone checks remain outstanding. Phone work is deferred at the user's request.

Grading remains client-side under the accepted free-plan design. Firestore rules protect ownership and supported reward invariants but cannot prove an honest browser score. Bayani AI provider setup is pending; the timeline and teacher/admin implementation remain separate scope.

## Local verification

On 27 October 2026, all 59 local unit tests and all 13 headless Chrome fixture suites passed after the Achievements and offline-draft changes. These checks cover the lesson, assessment, practice, challenge, account, dashboard and collection behavior without writing live learner data or using emulators. The legacy emulator-only security suite was excluded.

## Remaining release work

Complete the remaining manual desktop visual/server-expiry checks and independent curriculum review before declaring full desktop acceptance. Phone checks remain deferred. Deploy the frontend to Hosting when ready to release it; the latest frontend is still local. No additional collection or manual Firestore input is required for these refresh fixes.

The live walkthrough found and verified a Firestore field-order draft-version fix. After that change, all 58 unit tests and the four affected local browser suites passed.

Achievements now has recoverable errors/partial catalog states and session-safe concurrent reads. Offline drafts explicitly distinguish pending local changes from acknowledged Firestore saves. No manual Firestore collection changes are needed.

Collection layout update: artifact ownership/catalog reads now live on Achievements, using the existing Firestore collections. No Firestore migration or manual content entry is required. See [collection layout verification](validation/student-collections-2026-10-27.md).

My Journey now has a dedicated personal progress page, distinct from Home and Explore Chapters: saved next step, chapter/mission path and review topics. See [implementation and verification](my-journey.md).

Daily Challenge is retired from the current student UI. See [Bayani AI connection status and setup](bayani-ai-setup.md).

Student My Class is implemented with Firestore invitation codes, owned memberships and published assignments. Completion reuses saved mission progress; independent learning remains available. Supporting rules are deployed, and original-project permission checks passed with temporary fixtures removed. Teacher authoring/roster tools remain pending. See [My Class setup](student-class-flow.md).

Roadmap expansion: Chapter 2 Mission 3 retains its scenes and gains authored support/scenario assessments. Chapters 3 and 4 are playable through existing prerequisites, with all eight missions, forty scenes and final challenges. The data-only original-project migration is verified; no learner records changed. See [scope and verification](roadmap-chapters3-4.md). Independent teacher and student review remain pending.
