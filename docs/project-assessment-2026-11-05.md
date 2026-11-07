# LakbayPanahon project assessment — 5 November 2026

Implementation follow-up: the [mission companion Firestore boundary](validation/mission-companion-firestore-2026-11-05.md) is fixed locally and verified. The [three detective cases](validation/discovery-cases-firestore-2026-11-05.md) are also migrated, published to their mission documents and read back. Item 3 below records the original findings. The updated frontend has not been deployed to Hosting; the other assessment findings remain open.

## Judgment and scope

The repository contains a substantial learning application, including student, teacher and administrator workflows. The main remaining work is consolidating the implementation and establishing release, learning and operational evidence. Adding more game features is not the highest priority.

This assessment inspected current frontend modules, page composition, assessment and review policies, Firestore rules, backend preparation, content sources, release records and acceptance evidence. It is not a penetration test, a fresh production inspection, a full rendered-page review or a learner study. No Firebase records, rules, provider settings, billing or deployments were changed.

## Already present

- Student account access, profile/preferences, normal progression, lessons, interactive activities, quizzes, adaptive review/practice, retry and saved drafts.
- XP/reward consistency controls, badges/artifacts, journal, timeline, daily challenges and journey finale.
- Bayani interface, Firebase AI Logic client, optional backend preparation, narration/audio and motion preferences.
- Optional classroom membership, assignments, announcements, help and teacher feedback.
- Teacher qualification, classes/invitations, student reports, learning follow-up and exports.
- Administrator qualification/account review with paired decision records.
- Scoped content caching, recoverable failures, extensive local test fixtures, guarded content publishers and an allowlisted website packaging process.

## Prioritized gaps

### 1. Resolve the student AI provider decision before learner rollout

`js/bayani-client.js` still defaults an absent provider to Gemini. It checks `minorsUseApproved` for the alternative Anthropic route, not the Gemini route. `server/bayani/package.json` describes the alternative backend as inactive preparation.

The Gemini Developer API terms checked during this assessment prohibit API clients directed toward or likely to be accessed by under-18 users. Firebase's governance page confirms that the selected provider's terms apply. A restored connection and restrictive harm filters do not resolve that audience issue.

Completion evidence: an explicitly selected eligible service/account arrangement, operational backend if required, reviewed handling of student information and actual response evaluation. Evaluate historical accuracy, lesson grounding, inappropriate/off-topic requests, prompt injection and failure recovery. Keep authored help available when AI is unavailable. No provider was switched by this assessment.

Sources checked: [Gemini API terms](https://aistudio.google.com/docs/terms), [Firebase AI Logic governance](https://firebase.google.com/docs/ai-logic/data-governance).

### 2. Distinguish access protection from trusted assessment

The website already has role guards and database ownership/reward constraints. However, `firestore.rules` explicitly describes browser grading; active students can read question catalogs, and `studentQuizAttempts` validates submitted score consistency rather than independently grading the answers. `server/assessment/package.json` explicitly requires answer-key migration, client integration, rules cutover and hosting.

Completion evidence for stronger anti-cheating: private answer keys, server-issued attempts, authoritative prerequisite checks, server grading and idempotent rewards, with negative tests against forged submissions and replay. Until then, describe scores as browser-graded and retain the existing controls. This does not authorize activating paid services or imply that ordinary student accounts can access other students' private records.

### 3. Finish the Firestore content boundary

There is a concrete mismatch with the requested data architecture:

- `js/mission-learning-guides.js` embeds the 66 companion guides, questions, choices and feedback.
- `js/mission-learning-companion.js` imports that local catalog directly to render activities.
- `js/discovery-cases.js` embeds detective cases, clues, questions and explanations; `js/mission-discovery.js` imports it directly.
- `functions/apply-all-mission-learning.cjs` publishes a `learningGuide` field, but that does not make the companion renderer consume the published field.

Completion evidence: runtime activities consume validated Firestore content through shared loaders; local authoring files are inputs to reviewed migrations rather than a second runtime content authority. Reuse already-loaded mission content where possible and preserve access/error handling. Verify that an approved content edit appears without a JavaScript deployment. Ordinary interface labels and behavioral validation can remain in code.

### 4. Establish a current, complete cross-role release result

The latest full student acceptance record reports 416 passing checks and 17 browser fixtures from 31 October. Hash comparison during this review found five of its 64 recorded sources changed: `js/student-class-client.js`, `js/my-class.js`, `js/page-transition.js`, `firestore.rules` and `css/student-layout.css`. Newer focused teacher/student evidence exists; this is not a claim that the old tests now fail.

The 5 November rules publication record reports successful activation/readback of the candidate with 175 permission checks. The readiness note records that the subsequent real-project interaction test did not run because automatic approval review required explicit authorization for temporary live test data. Older release notes still describe that candidate as inactive.

Completion evidence: one source-matched regression/package report, an approved bounded real teacher/student cycle and hosted asset/auth/recovery verification. Clearly identify the current preview, current source, current rules and intended release. Do not treat a prepared package or historical preview as proof that the latest frontend is hosted.

### 5. Complete independent educational and learner review

The content records cover 66 missions, 388 scenes and 330 topic slots. Automated mapping and question-quality improvements are valuable, but are not evidence of student understanding. The current content record still distinguishes 20 deeper-revised missions in Chapters 3–7 from 46 outside that specific deeper revision, and retains 13 partial curriculum areas. This does not establish that all 46 missions are defective.

The November playtest plan states that no teacher/student group has yet completed the human review. Review the selected-topic scope with a history/Grade 5 educator, including image relevance, explanations, distractors and equivalent retry difficulty. Then observe supervised learners finding the next action, explaining an answer, using review and returning later. Mission passing at 3/5 and comprehensive mastery are distinct claims; retain the separate topic-practice evidence already present.

Completion evidence: documented reviewer decisions and observed comprehension/usability results, followed by fixes to demonstrated problems. Do not claim complete national-curriculum coverage or learning effectiveness from structural tests.

### 6. Make account and privacy support operational

`pages/settings.html` explicitly says that deletion requests are not sent or completed. `pages/register.html` says the final notices and contact are still being prepared. The learning-data export exists and correctly describes its limited scope; it is not a complete administrative request/removal service.

Completion evidence: an assigned operator and monitored contact, agreed retention and school/guardian arrangements, a verified request process, and a tested procedure covering Authentication, linked Firestore records and applicable retained copies. Decisions remain the operator's responsibility; do not invent them in the interface.

### 7. Consolidate the visual implementation before another redesign

The current Story page references 14 stylesheets; Home references 11 and My Class nine. `css/navy-gold-theme.css` is approximately 244 KB, while `css/teacher-workspace.css` is approximately 128 KB and contains 135 `!important` declarations. These figures are maintainability signals, not measured browser performance or proof of a visible defect.

Consolidate colors, spacing, typography, component states, buttons and dialogs into an intentional shared system. Remove superseded overrides incrementally with screenshot comparisons for populated, loading, empty, error and long-text states. Retain readable focus, contrast and reduced-motion behavior. Judge each simplification by whether the student's next action becomes clearer, rather than by adding decoration.

### 8. Measure quota and operational reliability at realistic usage

Caching and scoped queries exist, but `js/mission-assessment-client.js` still fetches a student's full quiz/practice/review history before filtering by mission. `js/teacher-class-client.js` paginates its generic loader in batches of 100 but accumulates records up to its safety limit; its dashboard can request seven collections per selected class. These are candidates for measurement, not a fresh attribution of quota exhaustion.

Completion evidence: a documented read budget for a normal lesson/retry/classroom session and realistic class sizes; targeted queries or summaries where warranted; clear handling of quota/network failures; and an assigned operational process for errors, usage and recovery. Preserve the freshness of security and reward checks. Review backup restoration and rollback as well as backup creation. Repository evidence of an external monitoring or scheduled restore process was not established here.

### 9. Make verification and project status reproducible

There is no `.github/workflows` directory in this checkout. Tests and guarded release tools already exist, but a single routine automated gate would reduce regressions. Large modules such as `js/quiz.js` and `js/teacher-workspace.js` combine many responsibilities and deserve gradual extraction behind existing tests, not a framework rewrite.

Several current-status documents prepend updates while retaining contradictory older instructions. Examples include the retired exploration mode, previously unpublished content now published, and rules now activated. Preserve dated evidence, but maintain one concise current-status document listing implementation, publication, verification and open decisions separately.

Completion evidence: a documented repeatable local command and, if the repository host supports it, continuous checks for syntax, core behavior, packaging and content/schema validity. Maintain one source-matched release record. Do not delete backups or historical evidence merely to make the folder look cleaner.

## Useful later addition, not an immediate release blocker

An operator/editor content workspace could make corrections easier: validate a draft, preview the lesson and quiz, approve a version, publish and roll back. The current administrator workspace intentionally manages accounts rather than curriculum, and reviewed scripts already support publication. This should be a separate scoped enhancement; teachers need not become curriculum authors.

## Verification performed in this assessment

66 focused local checks passed with zero failures across authentication/role guards, class joining/session isolation, teacher policy/reports/insights, admin account policy, content cache, practice save recovery and public-package boundaries. These were local tests, not production or complete browser acceptance.

Command:

```powershell
node --test --test-isolation=none tests/student-auth-guard.test.cjs tests/student-class-client.test.cjs tests/teacher-class-policy.test.cjs tests/teacher-support-policy.test.cjs tests/teacher-report-export.test.cjs tests/teacher-quiz-insights.test.cjs tests/admin-accounts.test.cjs tests/content-cache.test.cjs tests/practice-save-recovery.test.cjs tests/web-release-boundary.test.cjs
```

## Recommended next implementation

Fix the runtime Firestore content boundary first: make the mission companion consume the published guide and move discovery-case data behind a validated Firestore loader. This is a concrete mismatch with the agreed architecture, can reuse existing content, and requires no new paid backend. Prepare and verify the exact changes before any database publication. In parallel as decisions become available, resolve the AI, assessment-backend and operator arrangements; those cannot be closed by UI polishing.
