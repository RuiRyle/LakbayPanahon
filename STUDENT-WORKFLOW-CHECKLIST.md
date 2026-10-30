# Student workflow checklist

Chapter 2–4 desktop Story review: [aligned reading column and reduced-motion scrolling fixed](docs/validation/chapters234-desktop-review-2026-10-30.md). Fifty-eight candidate scenes pass desktop layout/help checks; three chapter captures were inspected. Thirteen unit checks and five browser scenarios pass. No Firebase or preview changes; the help drafts remain unpublished.

Chapters 2–4 offline review: [55-topic trace, four guarded help drafts and reviewer packet](docs/chapters234-learning-review-current.md). No structural gaps remain in the candidate trace; 34 focused checks and two browser fixtures pass. New help is unpublished. No Firebase, emulator, learner-code, preview or activation change; human learning review remains open.

Latest live retry: [security/save check still stopped by quota](docs/validation/student-live-security-retry-2026-10-30.md). HTTP 429 occurred before quiz submission; temporary account/records were cleaned. No further live requests or publication. Local evidence is retained; preview/backend activation are unchanged.

Shell/audio acceptance: [25 real Web Audio continuity checks pass locally](docs/validation/student-shell-audio-acceptance-2026-10-30.md) with simulated child authentication. Populated Home lesson rows/guidance also passed long-text/lock checks and visual inspection; ten related unit checks pass. No runtime changes, Firebase calls or preview changes. Actual listening, other populated/hosted states and the existing live/human gates remain open.

Learning-flow clarity: [current local review](docs/validation/student-learning-clarity-2026-10-30.md) simplifies instructions and makes pass counts/practice-score boundaries clear. The five-topic Chapter 1 authored trace has no structural gaps; 57 focused tests and three mocked browser fixtures pass. No Firebase, curriculum publication or new mechanic. Human and live acceptance remain pending.

Settings keyboard/reload acceptance: [13 native Chrome checks passed](docs/validation/student-settings-keyboard-reload-2026-10-30.md). Preference restoration, keyboard controls and non-destructive reset are locally verified. Actual audio listening and signed-in-shell continuity remain pending; no Firebase or runtime changes.

Desktop follow-up: [Settings, focus-message and Journey-contrast fixes](docs/validation/student-desktop-acceptance-2026-10-30.md). Seven Settings scenarios and long-text fixtures pass; the latest report records 281 unit checks and 12 browser fixtures, including a successful targeted Story retry. Real listening and populated/hosted checks remain open. No Firebase access; preview unchanged.

**Fixed finish line:** [Student workflow acceptance criteria](docs/student-acceptance-checklist.md). Use its A01–A18 criteria and recorded local/live/manual outcomes to close the student scope. No new features are required by that checklist. Teacher development remains deferred until the independent student implementation is frozen; shared classroom integration is tracked separately.

Latest audit: 281 local checks and 11 mocked Chrome fixtures pass; see [recorded acceptance results](docs/validation/student-acceptance-local.json). No Firebase requests. The next local acceptance work is desktop Settings/audio and final layout checks, followed by the separately recorded live/human gates.

Latest finish preparation (30 October 2026): [current evidence and remaining gates](docs/student-finish-preparation-2026-10-30.md). Exploration preview stays available locally by user request. Trusted grading, its candidate rules and paid AI activation stay inactive. The combined suite passes 201 local checks; learner acceptance and Chapter 2 publication are still pending after HTTP 429. Privacy decisions and supervised learning review remain open. Local preparation is not a completed public release.

**Current finish list:** [Student release checklist](docs/student-release-checklist.md). It consolidates current status and supersedes stale pending claims in the dated history below.

Updated 29 October 2026. Development uses the original `lakbaypanahon-1797e` Firebase project on the free plan. Frontend changes are in this workspace; the latest recorded curriculum and rules changes were published to Firestore. Firebase Hosting has not been deployed. Dated sections below record the state at that point in development; later entries supersede older pending items.

## Current student status

- 30 October security pass: fresh server authorization and learning-access checks, locked Settings errors, restored-page revalidation and saved-quiz response consistency fixes are local. Draft/attempt/practice rules are published and read back after 32 server synthetic cases; 92 local checks and six offline Chrome fixtures pass. Bounded live quiz acceptance stopped at HTTP 429, and temporary records/account were removed. Browser grading remains forgeable by a modified client. See [scope, evidence and remaining limits](docs/student-security-hardening-2026-10-30.md).

- 30 October: Settings now includes Account & Data Help with links to profile editing, saved-clue removal and class membership, plus logout/reset explanations. Desktop and extra-large-text local browser checks passed. No additional Firestore reads or writes. The operator, support contact and privacy arrangements remain undecided; account-copy/deletion requests are clearly unavailable. See [current privacy status](docs/student-access-privacy-audit.md). No privacy signoff or website deployment.

- Task 2 (Bayani): user chose local preparation with paid activation disabled. Prepared an opt-in authenticated Anthropic backend/bridge, Firestore-authored settings, private durable usage counters and bounded transport. Fifty-seven focused local checks plus mocked chat Chrome passed; no live requests, installation, settings writes or deployment. Existing Gemini routing remains unchanged and is not approved for Grade 5. Privacy/provider/account decisions and real response acceptance remain open. The release dry run also fixed missing Settings/student-shell entries; 22 pages/427 files now pass with private server files excluded. See [preparation](docs/bayani-backend-preparation.md) and [evidence](docs/validation/bayani-backend-preparation-2026-10-29.md).

- Student access/privacy source audit fixed ignored Remember me persistence and leftover UID-scoped tab state on logout/account changes. Ten focused local checks and the mocked registration recovery browser check pass. No Firebase calls, emulator, rules change or deployment. Readable policies and account-data assistance still need actual operator/contact/retention decisions; unpublished drafts are review material. See [audit and remaining work](docs/student-access-privacy-audit.md). Browser-submitted assessment trust limits remain accepted; no complete security signoff is claimed.

- Bayani provider review on 29 October found that the current Gemini Developer API and standard Google Cloud generative terms exclude under-18-directed apps. The user authorized research; the Anthropic commercial API is the first conditional candidate, with under-13 privacy/safeguards and paid backend arrangements unresolved. No provider, billing or live settings changed. See [comparison](docs/bayani-provider-options.md). Local Bayani reliability now handles connection/reply deadlines, retained failed questions and known response failures; these fixes do not establish provider suitability.

- Offline Chapter 5 review found explanations for 20 main topic areas and two stale build-status endings. Prepared body-only continuation wording with active later-mission/challenge prerequisites. Both affected six-scene browser checks, queue review and candidate audit passed. No Firebase calls, publication or new historical-source verification. See docs/chapter5-learning-review.md.

- Offline Chapter 4 review prepared simpler writing wording, two reasoning-focused scene decisions and worked help examples, including a definition for firing used by its craft quiz. Existing correct answers/progress rules retained. Forty-scene browser and queue checks passed; no Firebase access/publication or independent factual/learner approval. See docs/chapter4-learning-review.md.

- Offline Chapter 3 review compared 20 main topic areas with the candidate lessons and drafted improvements to three scene decisions with trivial distractors. Correct answers and progress rules are preserved. Forty-scene roadmap browser fixture, candidate audit and queue compatibility passed; no Firebase access or publication. See docs/chapter3-learning-review.md.

- Offline review of the complete pending queue passed: 13 curriculum documents plus one Bayani instruction field, no conflicting queued fields or changed practice-evidence policies. Explicit local prerequisite lessons recorded; current Firestore compatibility remains unverified. Candidate content audit now also includes the pending feedback revision. No publication. See docs/validation/student-publication-queue-local.json.

- Prepared an ignored local staging package at build/student-web-56lhuk/public: 412 files copied and SHA-256 verified, with manifest outside the public folder. Exact file inventory and development-directory exclusions passed. No Firebase access, Hosting configuration or deployment. See docs/web-release-inventory.md.

- Broad offline integration pass: all 440 non-emulator unit checks and nine core Chrome fixtures passed. Refreshed static release and candidate content audits remain clear. No live Firebase, emulator, deployment or curriculum certification. See docs/validation/student-offline-regression-2026-10-29.md.

- Prepared a local website release inventory: 20 entry pages and 412 existing files; no missing static references. Backups, authoring data, tests, functions and preview/audit tools are excluded. Dynamic URLs, remote assets and Firestore metadata remain outside this check. No Hosting configuration or deployment. See docs/web-release-inventory.md.

- Chapter 2 interaction review inspected 18 scene records and selected visuals, found a duplicate harvest-ritual distractor, and prepared a guarded one-choice correction. Candidate audit now checks duplicate/missing-correct scene options across 388 scenes and passes with the correction included. No publication or independent historical/learner approval. See docs/chapter2-interaction-review.md.

- Chapter 2 offline reading review found explanations for all 15 main topic areas in the selected candidate. Prepared three content-only scene simplifications (179?149, 179?130, 173?140 words) while retaining source limits, community variation and fictional-story attribution. Local scope/guard checks passed; no live publication or independent accuracy/comprehension approval. See docs/chapter2-reading-review.md.

- Profile editor review: preserved existing name/avatar validation and failed edits; added busy announcement and explicit opener-focus restoration. Save responses from a changed account cannot overwrite the displayed identity or show old-account save feedback. Save failures now distinguish unconfirmed persistence. Five profile policy checks plus local browser recovery/focus/delayed-session checks passed. No Firebase calls or deployment.

- Unified narrow-window sidebar behavior through the shared native-navigation script across all 12 sidebar student pages. Fixed Home mobile-open versus theme open mismatch and missing page menu handlers. Menu now announces expanded state, focuses its first link when opened, closes with Escape/outside click and returns focus on Escape. Local browser regression passed including legacy-toggle isolation and unchanged native navigation. No Firebase calls or deployment.

- Shared learning drafts now skip obsolete queued snapshots before a write starts, retaining the latest activity state and existing serialized/in-flight saves. Usage-limit save failures explicitly say the latest place is unsaved and keep manual retry available. Ten focused draft/resume checks passed, including rapid changes, quota failure, newest-state retry, offline status and leave protection. No Firebase calls or deployment.

- Loading/error polish: My Class, My Journey and Achievements now distinguish quota/service outages from generic read failures using safe UI messages. Class joining no longer blames the invitation code for a recognized service outage; failed input remains available. Local class/journey/collection browser checks passed, including a quota-to-refresh recovery check. No Firebase calls or deployment.

- Local visual/accessibility pass added keyboard skip links on all 12 sidebar student screens and removed closed narrow-sidebar links from focus. Desktop/narrow fixtures found no horizontal overflow or flagged leaf-text contrast issues; native skip focus and navigation checks passed. This is local fixture validation, not full accessibility certification. See docs/navy-gold-design.md.

- Quiz recovery cards now label the recommended sequence as ?1. Review the lesson? and ?2. Try practice?, explain returning to the quiz when ready, and provide topic-specific accessible link names. Themed action contrast improved. Local fail/retry/pass and topic-routing checks passed. Bayani instruction publication was retried and stopped at initial HTTP 429; no live changes.

- Reviewed six Chapter 2 main/retry feedback entries for leadership, social roles and oral traditions. Drafted misconception-specific explanations and fixed broken punctuation; feedback-only guards and local validation passed. Existing lesson-review links preserve mission/topic context. No live publication; see docs/chapter2-feedback-review.md.

- Drafted three Chapter 2 beginner practice questions for community leadership, social roles and oral traditions. Local prompt/feedback/policy validation passed; candidate audit now reports zero structural topic gaps. Firestore publication and independent teaching review remain pending. Existing evidence requirements are preserved. See docs/student-content-review-current.md.

- User reports completing the suggested student journey walkthrough. Offline candidate content review now covers 66 missions, 388 scenes and 330 quiz topic slots: no missing local candidate images or lesson mappings, but three additional requested-easy practice gaps remain (Chapter 2 leadership, social roles and oral traditions). This does not establish live publication or semantic teaching adequacy. See docs/student-content-review-current.md.

- User confirmed a real Bayani reply through the website. New Grade 5 teaching instructions are prepared in data/bayani-teaching-policy.json; publication stopped on HTTP 429 before any write. Response quality/boundary checks remain pending; see docs/bayani-response-review.md.

- Completion focus: core student features are implemented, but release acceptance remains open. Finish real Bayani conversation checks, authenticated normal progression through later chapters, independent curriculum review, Grade 5 comprehension checks, final visual acceptance and restoration of normal locks after personal exploration. Avoid treating local fixture checks as live acceptance.
- Bayani now provides separate connection, usage-limit and secure-connection guidance while retaining failed questions and hiding raw provider details. Local Chrome checks passed offline/quota recovery, reconnect, duplicate-send prevention and session isolation; real Gemini replies remain unverified.

- Bayani setup check on 29 October confirmed enabled settings and both required AI APIs enabled. Browser App Check and real Gemini replies remain unverified; begin with the actual conversation check in docs/bayani-ai-setup.md. A settings lookup succeeded, but the subsequent temporary Chapter 5 cleanup query still returned 429, so its owned-record cleanup remains pending.

- Prepared a supervised Grade 5 website playtest plan covering first-mission discovery, story comprehension, quiz recovery, My Journey status, Chapter 15 evidence reasoning and a naturally due Remember This card. No child study has been conducted yet; the plan keeps observations anonymous and does not change learner records. See [playtest plan](docs/validation/grade5-student-playtest-plan.md).
- Adult Chapter 15 website dry run found a low-contrast source-type caption on the first illustrated scene. Updated the shared story caption style to readable light text and added a computed-style browser assertion; the Chapter 15 scene/interaction check passed. Authenticated preview kept rewards untouched and removed its temporary account. Grade 5 learner comprehension remains untested. See [playtest plan](docs/validation/grade5-student-playtest-plan.md).

- My Journey now explains topic learning stages from saved quiz, lesson-review and practice evidence, including a distinct “Practice goal reached” state without claiming permanent mastery. The existing Chrome journey check passed a goal-reached fixture, prerequisites, loading recovery and session changes. No Firestore schema or read change; frontend Hosting remains undeployed. See [topic learning status](docs/topic-learning-status.md).
- Authenticated original-project prologue acceptance confirmed that a failed quiz creates an actionable My Journey lesson-review status; the student then completed mapped scene review, targeted practice, a fresh quiz retry, all four missions and the chapter challenge. The temporary account and owned records were removed. See [topic learning status](docs/topic-learning-status.md).

- Home now includes a Return to Learn reminder for eligible topics from completed missions. It presents one Firestore-authored recall question with immediate feedback, another due clue after answering, then story and targeted-practice links. The three-day interval lives in `learningSettings/progression.reviewAfterDays` in the original Firestore project. Eight focused local checks and the dashboard browser check passed. Frontend Hosting remains undeployed. See [Return to Learn](docs/return-to-learn.md).
- Authenticated original-project Home check passed with a temporary student: an aged owned mission displayed a due authored topic, the one-question recall interaction gave answer feedback, Another Memory Clue advanced to a different topic, and recent owned practice postponed the original topic. The account and records were removed. See [Return to Learn](docs/return-to-learn.md).

- The latest recorded curriculum publication reaches Chapter 15, with five missions and a final evidence challenge. Independent history, teacher and Grade 5 comprehension review remains pending.
- The temporary local exploration preview opens published chapters and missions for personal testing. Normal prerequisite locks must be restored after that testing; preview quiz results do not save completion or rewards.
- Home keeps Daily Challenge and Bayani AI as separate actions. Daily Challenge has no sidebar navigation item. Bayani AI settings and required APIs are enabled; browser App Check and a real student reply still need verification.
- Recent local checks cover the completed-journey flow, review guidance, reduced duplicate reads and browser-return refresh. The latest local unit suite has 427 passing checks; live student acceptance remains pending.

## Bayani AI and Home Daily Challenge

- [x] Keep Daily Challenge on Home with its question flow, saved result and reward; remove its separate sidebar navigation item. Keep Bayani AI as a separate learning companion.
- [x] Add Bayani AI chat with Firebase AI Logic client, Firestore-authored settings, session isolation and retry.
- [x] Create disabled starter settings and deploy active-student read-only access.
- [x] Confirm enabled Firestore AI settings and both required AI APIs (29 October read-only check).
- [ ] Resolve an eligible provider and data handling for Grade 5, then verify actual replies and teaching boundaries. A real Gemini reply was supplied, but its standard age restriction remains. See [provider review](docs/bayani-provider-options.md); the old [setup guide](docs/bayani-ai-setup.md) is historical.

Earlier notes about removing Daily Challenge from Home are historical and superseded by the current Home implementation.

## Accounts and independent learning

- [x] My Journey opens a dedicated personal learning page with existing resume/review recommendations, Firestore progress, expandable era/chapter/mission paths and prerequisite-aware links. Student navigation now points to this page. See [My Journey implementation](docs/my-journey.md).

- [x] Student registration creates an active student profile.
- [x] Login, logout and protected-page guards exist.
- [x] Student profile-read failures show a retry dialog without signing out or revealing protected content.
- [x] Guard ignores stale profile responses after a session change; missing/inactive profiles still sign out and incorrect roles redirect.
- [x] Independent learning has no classroom requirement.
- [x] Profile editing is available on protected student pages.
- [x] Offer optional first-login profile guidance with Firestore completion/dismissal state.
- [x] Add Start Learning / Continue Mission actions that open the eligible lesson directly from saved progress.
- [x] Dashboard uses eligible Firestore drafts for Resume Lesson / Resume Quiz and ignores submitted quiz drafts and locked missions.
- [x] After a failed quiz, dashboard prioritizes Practise Weak Topics, retaining lesson review and direct retry; an active quiz draft retains Resume Quiz priority.
- [x] Dashboard combines current quiz diagnoses and saved practice evidence; resolved review topics switch the main action to Retry Mission Quiz without marking mission completion.
- [x] Optional dashboard draft/practice failures retain mission access with a guidance refresh action; unavailable evidence does not imply resolved topics. Prerequisite-read failures still block recommendations.
- [x] Overlapping dashboard journey requests accept only the newest response; sign-out invalidates pending journey requests and clears the action panel.
- [x] Dashboard profile and mission/badge counts reject earlier-session responses; Achievements clears badge/artifact collections on session changes.
- [x] Move artifact collection from the dashboard to Achievements, with separate badge/artifact summaries, sections, dates, empty states and independent loading/retry controls. Dashboard links to the collection page without reading artifact ownership/catalog data.
- [x] Artifact names/descriptions/icons render as text; partial/missing catalog details and read failures are distinguished from a genuinely empty collection and offer retry.
- [x] Artifact details load concurrently, duplicate ownership IDs do not inflate counts/reads, and late results remain session-scoped.
- [x] Initial dashboard read failures offer Retry Loading Dashboard; unavailable progression policy offers Retry Level Settings without a page refresh.
- [x] Independent dashboard journey/count sections load concurrently with isolated failures; badge/artifact collection details load on the Achievements page.
- [x] Automatic practice selection reads saved history before filtering, targets unresolved review topics and allows general practice once resolved; explicit topic choices remain available.

## Mission lesson, main quiz and recovery

- [x] Mission journey opens the selected lesson with chapter/mission parameters.
- [x] Lesson, main quiz and practice share accessible Chapters ? Mission Journey ? current activity navigation, preserving chapter context during loading/errors.
- [x] Shared student styles enforce hidden states across flex/grid components; Chrome checks verify computed visibility of quiz results, reinforcement links and practice completion/save controls.
- [x] Keyboard focus survives quiz option re-rendering and moves to new question/scene headings during navigation; quiz results receive focus after rendering.
- [x] Practice mistakes focus feedback, Choose Another Answer returns focus to available choices, and question/completion navigation focuses the new heading.
- [x] Mission selection exposes its selected state and focuses the introduction heading; era chapter loading focuses the selected-era heading.
- [x] Story loading waits for Firebase authentication restoration.
- [x] Story opens the selected mission quiz.
- [x] Lesson completion recaps Firestore objectives and optional authored summary, shows configured quiz/pass requirements, and offers lesson review or quiz entry with loading retry.
- [x] Populate recaps and concise objective lists for the five quiz-backed missions in Firestore; remove the stray copied-objective placeholder with backup/source checks.
- [x] Mission introduction displays Firestore objective lists with legacy single-objective fallback and uses description when introduction is absent; objectives render as safe text.
- [x] Completed lesson drafts restore the recap only when content and all scene requirements still match; review/restart invalidates pending quiz-detail responses.
- [x] Lesson recap and chapter challenge restoration save only the restored state, without transiently overwriting completion or submitted answers with fresh-attempt state.
- [x] Lesson and quiz loading failures provide a retry action without reloading the page.
- [x] Lesson loads from a previous session cannot overwrite a fresh session for the same account.
- [x] Learning entry points check chapter prerequisites within an era and mission prerequisites.
- [x] Dashboard, review recommendations and direct learning access respect inactive/missing parent eras, matching the chapter map's availability policy.
- [x] Chapter map, mission page and main quiz query catalog records by selected era/chapter/mission rather than loading unrelated records.
- [x] Main quiz selects five questions using Firestore topic/difficulty coverage.
- [x] Three correct answers pass; zero to two correct answers fail.
- [x] Both failed and passed attempts are saved to Firestore.
- [x] Passing awards mission XP once and records mission completion for unlocking.
- [x] Passing returns to the mission journey.
- [x] Passing quiz results distinguish completion from remaining topic reinforcement, offer optional practice, and preserve Continue Journey as the main action.
- [x] Failed attempts identify weak topics and recommend personalized practice.
- [x] Quiz review supports Firestore answer-specific explanations and key learning points, with lesson/topic-practice links on missed questions.
- [x] Author and apply answer-specific explanations and learning points to all 50 main/retry questions; independent review is tracked separately below.
- [x] Draft the first ten question-feedback entries (community roles, including retry variants) and verify their source content against live Firestore without writes.
- [x] Draft ten beliefs/cultural-traditions feedback entries; validate the combined 20-entry draft against live Firestore without writes.
- [x] Apply the first 20 feedback entries to original Firestore with backup; verify zero remaining changes.
- [x] Author and apply the remaining 30 feedback entries; all 50 main/retry questions now have answer feedback and learning points.
- [ ] Complete independent curriculum review of the authored feedback.
- [x] Practice uses different questions, explanations and adjustable difficulty.
- [x] Practice supports Firestore-authored option hints, correct-answer explanations and key ideas; successful retries retain first-try failure tracking.
- [x] Practice completion summarizes first-try results and topics needing another attempt without claiming mission mastery or completion.
- [x] Practice completion also shows remaining mission-wide review topics with targeted links after saving; unavailable history/save failures do not claim readiness.
- [x] Author and apply topic hints and learning points for all 54 active practice questions across 28 topics, with source checks and backup.
- [ ] Independently review practice hints and key ideas with the curriculum reviewer.
- [x] Practice covers weak topics before repeating one; session settings are in Firestore.
- [x] Students may review the lesson, practise or retry when ready.
- [x] Retry preserves equivalent topic/difficulty coverage and prefers unseen questions.
- [x] Limited banks disclose when questions must repeat.
- [x] Retry submissions reuse the attempt ID after a lost response.
- [x] Quiz authentication refreshes preserve unfinished answers; session changes discard pending page responses.
- [x] Quiz sign-out clears loaded questions/results before redirecting to login.
- [x] Artifact and badge ownership use deterministic IDs and transactions.
- [x] Practice shows save progress, reports failures and supports retrying the same session ID.
- [x] Practice ignores pending loads/history/save responses after a session change and reloads after fresh sign-in.
- [x] Practice prevents overlapping save retries and uses a separate record after a new sign-in.
- [x] Practice content failures and empty topic banks offer load retry while preserving lesson/quiz navigation.
- [x] Dashboard and practice recommendations combine quiz diagnoses with saved practice evidence.
- [x] Quiz-only recommendations are labeled as quiz diagnoses rather than invented first-try practice statistics; dashboard distinguishes mission completion from topics to strengthen.
- [x] Dashboard review clears on sign-out, reloads for a fresh session and ignores stale success/error responses; focused session regression check passes.
- [x] Later first-try practice successes can resolve earlier weak-topic recommendations.

See [mission quiz flow](docs/mission-quiz-flow.md).

## Configurable progression

- [x] Firestore owns `learningSettings/progression`.
- [x] Dashboard, quiz, daily challenge and reward calculations use the configured XP spacing.
- [x] Reward transactions and Firestore rules read the same progression policy.
- [x] Level displays derive from XP rather than trusting a stale cached level.
- [x] Missing/invalid settings do not silently use a hardcoded threshold.
- [x] Quiz introduction derives question/pass counts from loaded policy; dashboard placeholders and mission instructions no longer display fixed XP spacing or question counts.
- [x] Existing students were audited; XP was preserved and no level reconciliation was needed.

See [student progression](docs/student-progression.md).

## Firestore avatar catalog and profile

- [x] Firestore `avatars` documents own avatar names, symbols, order, availability and default selection.
- [x] Initialize the nine existing choices in the original database without modifying students.
- [x] Remove the runtime avatar list and duplicated ID allowlist in security rules.
- [x] Load available choices from Firestore with preview and retry after loading failure.
- [x] Preserve saved inactive/removed selections instead of forcing a replacement.
- [x] Keep name editing available when the catalog is empty or unavailable.
- [x] Save only name/avatar fields and timestamp; protect roles, status and rewards.
- [x] Show email as read-only.
- [x] Refresh saved identity through the existing profile listener.
- [x] Preserve cancel, validation, failed-save and pending-save behavior.
- [x] Deploy catalog-backed avatar selection rules.
- [x] Verify active/invalid/inactive selection behavior and fresh-sign-in persistence with a temporary live student.
- [x] Verify catalog loading failure, name-only saving, catalog recovery and dynamic choices in Chrome.
- [ ] Check the editor visually on a phone.

Profile/avatar selection remains optional. See [avatar catalog](docs/student-avatar-catalog.md).

## Registration and story navigation

- [x] Prevent duplicate student registration submissions.
- [x] Recover failed profile saves using the existing authenticated account.
- [x] Confirm saved profiles after a lost write acknowledgement.
- [x] Offer a dashboard link after registration.
- [x] Review previous scenes while preserving completed checks during the session.
- [x] Clear story state on sign-out and discard pending scene responses.

See [registration and story verification](docs/student-registration-story.md).

## Firestore resume

- [x] Chapter challenges restore question position, submitted answers, and partial choice/matching/trade interactions; restored scores are recalculated from answers.
- [x] Chapter draft partial inputs are tied to a question ID; advancing questions clears old inputs before saving the new state.
- [x] Dashboard offers Resume Chapter Challenge; successful completion clears its draft and owner-only chapter draft rules are deployed.

- [x] Resume unfinished practice question pools, selected answers, retry counts, correct-question state, results and adaptive difficulty using Firestore drafts.
- [x] Practice resume restores the last wrong choice's authored hint without adding attempts/results; older drafts keep a neutral resume message.
- [x] Preserve the practice record ID, clear drafts after acknowledged completion and route dashboard Resume Practice to the saved topic.
- [x] Deploy owner-only practice draft rules; focused browser checks cover restoration and completed-draft cleanup.

- [x] Save main quiz question position, answers, locked answers and issued question IDs in owner-only learning drafts.
- [x] Save lesson scene, explored clues, completed decisions and quick checks.
- [x] Restore matching drafts after refresh; invalidate lesson checks when content changes.
- [x] Quiz drafts also invalidate saved answers when wording, choices, answer keys or assessment policy change; feedback-only edits preserve valid answers.
- [x] Resumed lessons/quizzes offer confirmed Start Over controls that clear unfinished drafts while preserving completed progress and rewards.
- [x] Resumed practice/chapter challenges also offer confirmed Start Over; practice creates a fresh session and chapter restart returns to challenge entry without deleting completion/rewards.
- [x] Draft save status reflects only the latest queued change; abandoned cleanup cannot delete newer work. Focused checks cover restart cancellation and failed-reset interaction recovery.
- [x] Failed lesson/quiz draft saves offer Retry Saving Your Place without requiring another answer/scene interaction; duplicate retries and closed-session writes are blocked.
- [x] Unchanged restored/queued draft snapshots skip redundant Firestore writes, independent of map-field order; failed snapshots remain retryable.
- [x] Unsaved lesson/quiz drafts request browser leave confirmation; successful saves and closed sessions remove the listener.
- [x] Remove submitted quiz drafts and preserve reward idempotency.
- [x] Show saving/saved/failure status; deploy draft security rules.
- [x] Verify live refresh recovery for completed lessons, unfinished quiz answers, mastered practice and partial chapter decision/matching/trade inputs.

See [learning resume](docs/student-learning-resume.md).

## Verification completed

- [x] Chapter map Chrome test: prerequisites, saved chapter unlocks, rapid era switching and sign-out during a delayed load.
- [x] Old chapter-map responses cannot overwrite a newer era selection or restore signed-out content.
- [x] Chapter map offers separate era/chapter load retries without a page refresh; selected-era retry preserves its route context and blocks duplicate clicks.

- [x] Quiz-based review ignores removed/inactive practice topics and malformed diagnoses; current Firestore labels determine recommendations.

- [x] Ran all ten student Chrome regression scripts together successfully: registration, guard, profile, dashboard, mission journey, story, quiz, practice, daily challenge and chapter challenge.
- [x] Chapter load recovery: failed catalog reads disable Begin, offer Try Loading Again, and recover without a page reload.

- [x] Student guard Chrome test: connection retry, visible recovery dialog, hidden protected content, late response after sign-out, role redirect and missing/inactive profiles.

- [x] Mission journey Chrome test: saved completion unlocks the next mission, Back navigation refreshes progress, completed mission review works, and all missions are required for the chapter challenge.
- [x] Mission journey recovery: load retry, safe catalog title rendering, sign-out during a delayed load and fresh sign-in.

- [x] Registration Chrome test: validation, duplicate submissions, profile retry, lost acknowledgement and dashboard link.
- [x] Story Chrome test: exploration, wrong/correct responses, previous/next navigation, completion and sign-out.
- [x] Expanded story Chrome test: failed reads, empty scenes, successful retries and delayed responses across same-account sign-out/sign-in.
- [x] Expanded quiz Chrome test: failed catalog read and successful retry before fail/retry/pass assessment.
- [x] Automated horizontal-overflow checks for both pages in a narrow desktop viewport; physical phone acceptance remains pending.

- [x] 48 local unit tests passed across access, quizzes, rewards, progression, profiles and review.
- [x] Mission quiz Chrome test: five questions, failure feedback, new retry set, passing result, XP and artifact display.
- [x] Expanded quiz Chrome test: same-user auth refresh, sign-out during delayed loading/submission, fresh sign-in and replay without duplicate XP.
- [x] Practice Chrome test: targeted questions, labels, saved history, resolved topics, review links and loading failure.
- [x] Practice Chrome test: sign-out during a delayed load and clean restart after fresh sign-in.
- [x] Practice Chrome test: question-bank failure, empty bank, successful load retry and preserved chapter/mission navigation.
- [x] Practice save unit check: overlapping retries and late responses after sign-out.
- [x] Expanded profile Chrome test: initial catalog outage, name-only save, recovery, dynamic choices, retired selection, focus, preview, cancel and pending-save dismissal.
- [x] Dashboard Chrome test: Start/Continue routing, encoded IDs, safe content rendering, review/challenge/complete states and retry.
- [x] Optional setup Chrome test: completion, dismissal, failed dismissal and preserved access to profile editing.
- [x] Chapter challenge Chrome test: choice/decision, matching, trade, failure/retry, badge and replay.
- [x] Expanded chapter challenge Chrome test: same-user auth refresh preserves the attempt, pending loads/saves cannot reveal content after sign-out, and fresh sign-in recovers.
- [x] Passing chapter challenges retry failed completion saves without retaking questions; overlapping save retries are blocked and answers are preserved.
- [x] Chapter success Continue opens the chapter map; Back to Missions preserves the current chapter. Success does not promise a nonexistent next chapter.
- [x] Chapter success now offers direct continuation to the next eligible ready chapter in the same era, with active-mission checks and Explore Chapters fallback.
- [x] Daily challenge Chrome test: rollover, stale answers, saved completion, loading retry and sign-out.
- [x] Firebase compiled and deployed the current Firestore rules.
- [x] Expanded live journey test: mission recovery, chapter prerequisites/completion, badge replay and next-chapter access.
- [x] Verify daily answer correctness, one-time XP/streak and fresh-sign-in persistence against live Firestore.
- [x] Refresh daily content at Philippines midnight and reject stale answers from the previous day.
- [x] Live profile test: catalog reads, selection permissions, protected fields, setup timestamps and persistence after fresh sign-in.
- [x] Verify a fresh live student receives a valid learning action from the real Firestore catalogs.
- [x] Remove temporary test accounts, learning records and catalog test entries after live checks.

These automated checks do not establish that every manual journey, mobile layout or curriculum review is complete. Current tests use mocks or temporary live accounts; no emulator is required for the current workflow.

## Desktop live website walkthrough

The normal journey passed against the original Firestore project using actual pages and controls in headless desktop Chrome on 27 October 2026. This includes registration, first lesson/recap refresh, fail -> practice -> fresh retry/pass, next mission, chapter challenge/next chapter, mission replay XP protection and logout/login. The temporary student and owned records were removed. See [evidence and scope](docs/validation/student-desktop-2026-10-27.md).

## Browser acceptance coverage

- [x] Register through the actual UI; verify required fields, terms, mismatched passwords and successful login.
- [x] Complete the first story and every interactive check through the actual desktop website.
- [ ] Complete manual desktop keyboard/visual review of long answers, icons and navigation across target screen sizes.
- [ ] Physical-phone layout/interaction review (deferred; desktop website is the current focus).
- [x] Exercise fail -> practice -> retry -> pass through the actual desktop application navigation.
- [x] Confirm the next mission becomes available in the actual mission journey after passing.
- [x] Replay the same mission through the UI and verify no extra XP or artifact ownership.
- [x] Complete both first-chapter missions and its ten-question challenge; verify badge display and next-chapter UI access.
- [x] Replay a chapter challenge through the UI and retain exactly one earned badge.
- [x] Refresh all four learning activities and verify saved answers/position/session recovery.
- [x] Log out and back in through the actual UI; verify saved profile/avatar, XP/streak and progress/collection records.
- [x] Verify live offline/reconnection and slower-network quiz saving; missing mission links show recovery in lesson, quiz and practice.
- [ ] Verify server-revoked-token expiry and remaining live server-error cases; local session-race/recovery suites pass.
- [x] Verify live daily content, wrong/correct answers, saved XP/streak and completed-state replay protection.
- [ ] Have the curriculum reviewer check the added question variants and difficulty labels.

Lesson and main quiz drafts now save to Firestore and restore after refresh once the save status confirms success. Practice now also resumes unfinished questions, attempt counts and adaptive state from Firestore. Chapter challenges now also restore unfinished questions and partial interactions from Firestore. Completed attempts and rewards remain separate from drafts.

## Current implementation and next work

The core student journey is implemented locally: onboarding, chapter/mission access, interactive lessons, main quizzes, adaptive practice, progression, rewards, review, lesson/quiz resume, restart and recovery controls. See [current student status](docs/student-implementation-status.md).

Firestore contains quiz/practice feedback, mission recaps and configurable progression. Supporting security rules are deployed. Frontend Hosting is not deployed.

The extended desktop live journey, refresh/replay/collection persistence and connectivity checks have passed. Remaining manual desktop visual and server-expiry checks are listed above. Phone testing stays deferred; independent curriculum review remains pending.

Firestore practice resume is now implemented, including dashboard topic routing and original session ID preservation. Unfinished chapter challenge resume is now implemented, including partial choice/matching/trade interactions and dashboard routing. Completed session records, chapter completions and rewards remain saved. Bayani AI chat is implemented with provider setup pending; timeline and teacher/admin work remain separate scope.

## Deferred and accepted limits

Browser prerequisite checks and full quiz grading remain client-side on the accepted free plan. Rules protect ownership, reward amounts and duplicate awards, but cannot prove honest browser scores. Bayani AI provider/App Check setup remains pending. The historical timeline and teacher/admin workflows remain separate work.

Achievements recovery now distinguishes empty, partial/missing catalog and read-failure states, offers retry and rejects stale session/request responses. Shared draft saving explains offline pending changes and confirms only acknowledged Firestore saves. Current local verification: 59 unit tests and 13 browser suites pass.

- [x] Achievement collection summaries act as exclusive toggles: both initially closed, selected collection shown, other hidden, and clicking the selected button closes both. Accessible expanded state and background-read stability verified in Chrome.

- [x] Redesign Bayani AI as a discovery companion with exploration links, distinct chat bubbles, connection feedback, reduced-motion support and a personal-information reminder. UI-only: no XP or provider activation; minors/data-use review remains pending.

- [x] Remove the forced navigation delay/fade-out; preserve native navigation and Back/Forward behavior. Add a neutral authentication loading shell, inert protected roots and reduced-motion-aware content entrance. Focused guard/navigation and four activity browser suites pass. See [navigation behavior](docs/student-navigation.md).

- [x] Student My Class: code joining/leaving, published mission assignments, Philippine-time due dates, existing completion and prerequisite routing. Original-project permission checks passed and temporary fixtures were removed. Teacher authoring remains pending. See [class setup and integration contract](docs/student-class-flow.md).
- [x] My Class verification: 66 local unit tests passed, plus the focused desktop Chrome class suite and original-project class permission checks. Frontend Hosting remains undeployed.

- [x] Home retains Daily Challenge alongside a separate Bayani AI companion card. Daily Challenge is absent only from sidebar navigation. Restored Firestore loading/rotation, saved completion and rewards; flexible cards and long-answer modal layout. Focused Chrome flow/retry/replay checks and daily calendar/rotation tests pass. This supersedes earlier notes describing Daily Challenge as retired from the entire student UI.

- [x] Home redesigned as an explorer hub: navy welcome/XP header, compact progress strip, full-width next mission, separate Daily Challenge and Bayani AI discovery cards, and chapter/class destinations. Removed hardcoded era previews from Home. Dashboard and daily-flow browser checks pass; runtime curriculum and rewards remain Firestore-driven.

- [x] Review recommendations now open learning scenes before practice. Firestore storyScenes.reviewTopics maps topics to authored scenes; unmapped topics explicitly fall back to the full lesson. Review preserves ordinary lesson drafts and existing scene checks, then offers targeted practice. Chrome story/practice suites passed. Curriculum scene tagging remains to be authored; see docs/topic-scene-review.md.

- [x] Applied reviewed topic-to-scene mappings to original Firestore: 29 assessed topics across five missions, 29 scene documents tagged and read back. Pre-write backup retained; no learner records changed. This supersedes the earlier pending initial scene-tagging note. Future topics and independent curriculum review remain separate.

- [x] Roadmap 1.1 scoped expansion applied: Chapter 2 Mission 3 help/scenario assessments and complete Chapters 3–4, with eight new missions, forty interactive scenes, mapped review/practice, collectibles and final challenges. All 277 planned documents verified in original Firestore; backups retained. Seven roadmap unit checks and all-scene/all-challenge Chrome checks passed. See docs/roadmap-chapters3-4.md for scope, sources and remaining teacher/student acceptance. Era prologue and Eras 2–4 are not implemented by this package.

- [x] Original-project Chapter 3 desktop journey passed: all four lessons/quizzes, failure to mapped lesson review/practice/fresh retry, four artifacts, ten-activity challenge/badge, Chapter 4 continuation and replay XP protection. Found and fixed cold-start quiz briefing/resume regression; fixture coverage strengthened. All three temporary runs cleaned up their accounts and records. See docs/validation/chapter3-live-2026-10-27.md.

- [x] Trade and Livelihood investigation pilot: collect evidence, choose goods/quantities, evaluate needs/stocks/agreement, revise and explain. Firestore-authored scenario, refresh-safe normal lesson draft and no activity XP costs. Four logic checks, focused Chrome investigation checks and an original-project lesson-to-quiz walkthrough passed; temporary records removed. See docs/trade-investigation-pilot.md.

- [x] Stronger adaptive evidence: Firestore-configured distinct questions/two successful sessions/harder evidence; separate lesson-revisited state and practice-goal summary. Policy verified on 148 active questions/69 topics, owner-only append-only review rules deployed. 85 unit tests and affected browser suites pass; original-project evidence walkthrough and permission checks passed with temporary account cleanup. See docs/adaptive-review-evidence.md.

- [x] Seafaring route investigation: Firestore-authored symbolic board and keyboard-friendly route choices, clue gating, specific feedback, required explanation, revision and saved route plans. Original scene update backed up/read back. 87 local unit tests and route/story/exchange Chrome checks pass. Complete live route walkthrough and teacher/student review remain pending; see docs/seafaring-route-investigation.md.

- [x] Read-only learning-content audit against roadmap v1.1: 17 live missions, 90 scenes and 89 mission/topic pairs mapped. Identified shallow examples, repeated clues, missing instructional visuals, four extra practice topics outside main-quiz tags and absent Chapters 5-14. Editorial expansion priorities documented; no curriculum or learner records changed. See docs/student-content-coverage-audit.md and docs/validation/learning-topic-matrix.md.
- [x] Prologue Mission 1 pilot: six teaching scenes with three sourced locator illustrations, worked directions, independent map report, livelihood/climate explanation, recap and revised quiz/practice prompts. All 27 curriculum updates verified in original Firestore; completions/rewards preserved. 95 unit tests and pilot/story/route browser checks pass. Teacher/current-curriculum and Grade 5 comprehension review remain pending; see docs/geography-learning-pilot.md.

- [x] Prologue Mission 2 expanded to six process-model scenes with four labelled SVG diagrams, worked volcanic accumulation, shelf/channel comparison, evidence/source questions and recap. Ten quiz variants and ten separate practice prompts revised; 27 documents verified in original Firestore. 98 unit tests and six-scene Chrome checks passed. Teacher/Grade 5 review and authenticated walkthrough remain pending. See docs/formation-learning-pilot.md.

- [x] Student Evidence Journal: optional Save Opened Clues in lessons, persistent deduplicated Firestore references, My Journey mission filter, relevant lesson links and owner removal. Journal-only rules compiled/deployed/read back; live ownership/query/schema checks passed and temporary records/accounts cleaned. 101 unit tests and focused save/retry/journal Chrome checks passed. No XP/mastery changes; citing evidence in chapter tasks remains future work. See docs/evidence-journal.md.

- [x] Evidence-supported prologue chapter investigation: choose an authored clue and conclusion for one point; journal markers optional, source cards available to everyone. Shared grading, draft restoration and final review support both parts. Original-project full prologue workflow passed through fail/review/practice/fresh retry, four artifacts, 100% challenge, badge, Chapter 1 continuation and replay protection; temporary accounts/records removed. 105 unit tests and focused challenge Chrome checks passed. See docs/evidence-challenge-pilot.md.

- [x] Prologue Mission 3 archaeology expansion: six scenes, four illustrations, Tabon/Callao locator and evidence comparison, distinct research dates and fictional age-range exercise, respectful-care task, recap and plain vocabulary help. Ten quiz variants and ten separate practice prompts revised. All 27 documents verified in original Firestore; progress/rewards preserved. 108 unit tests and six-scene Chrome checks passed. Revised authenticated walkthrough and teacher/Grade 5 review remain pending. See docs/archaeology-learning-pilot.md.

- [x] Prologue Mission 4 expanded: six scenes and four illustrations comparing language dispersal/population history, selected language-family members, Batanes objects and a labelled model locator, multi-source claims and respectful identity. Ten quiz variants and ten separate practice prompts revised; 27 documents verified in original Firestore. 111 unit tests and six-scene Chrome checks passed.
- [x] Full expanded-prologue original-project walkthrough: all 24 teaching scenes, journal saves, fail/review/practice/fresh retry, four mission artifacts, 100% evidence-supported chapter challenge, badge, actual Chapter 1 continuation and replay reward protection. Temporary account and all owned records removed. This supersedes the pending authenticated walkthrough for revised archaeology/population content. Teacher/current-curriculum and Grade 5 learning review remain pending. See docs/population-learning-pilot.md and docs/validation/prologue-expanded-live-2026-10-27.json.

- [x] Chapter 1 Trade and Livelihood teaching expanded: resources/work/products, fishing preparation, both-side trade needs and craft processes, authored help and all-topic recap. Investigation now precedes recap. Seven existing documents verified; illustrations, banks, trade rules and rewards preserved. 114 unit tests, focused teaching/trade browser checks and authenticated original-project lesson-to-quiz/reward walkthrough passed. Temporary account/records removed. See docs/livelihood-learning-expansion.md.

- [x] Chapter 2 Mission 1 social-comparison expansion: three existing scenes revised with a source-labelled 1589 Tagalog comparison, two fictional choice cases, two accessible diagrams, vocabulary and all-topic recap. Four documents verified; other scenes, order, banks and rewards preserved. 117 unit tests and Chrome checks passed; original-project six-scene/quiz/refresh/replay walkthrough passed and temporary accounts/records were removed. Teacher/Grade 5 review remains pending. See docs/social-roles-learning-expansion.md.

- [x] Chapter 2 Mission 2 strengthened: invented bird tale labelled explicitly, named Hudhud transmission/continuity comparison, Manunggul Jar taught before its existing quiz questions, and observation/interpretation/limit task with two accessible illustrations. Four documents verified; first three scenes, order, banks and rewards preserved. 120 unit tests, focused Chrome checks and authenticated six-scene/quiz/refresh/replay acceptance passed; temporary account/records removed. See docs/beliefs-learning-expansion.md.

- [x] Chapter 2 Mission 3 strengthened: approximate Mindanao/Jolo/Simunul locator, connected contribution investigation, religious-milestone versus political-development timeline, and all-topic recap leading to Chapter 3. Five documents verified in original Firestore; encounter/belief scenes, order, banks and rewards preserved. 123 unit tests, focused Chrome checks and authenticated six-scene/quiz/refresh/replay acceptance passed. Temporary account/records removed. Teacher/Grade 5 review pending; see docs/islam-exchange-learning-expansion.md.

- [x] Chapter 3 Mission 1 boat-teaching expansion: three scenes revised with Butuan evidence/source comparison, labelled dowel versus lug/frame/binding diagram, vocabulary and all-topic recap. Four documents verified in original Firestore; route investigation, order, banks and rewards preserved. 125 unit tests and revised-scene/route Chrome checks passed. Revised authenticated walkthrough and teacher/Grade 5 review remain pending. See docs/balangay-learning-expansion.md.

- [x] Chapter 3 Mission 2 expanded: named Changsha/Mt. Kamhantik/Belitung comparisons, fictional multi-stop network model, two accessible illustrations and all-topic recap. Four documents verified in original Firestore; other scenes, order, banks and rewards preserved. 127 unit tests and revised-scene Chrome checks passed. Revised authenticated walkthrough and teacher/Grade 5 review pending. See docs/trade-networks-learning-expansion.md.

- [x] Chapter 3 Mission 3 expanded: worked material/technique/product example, clearly fictional local-adaptation case, alternative explanations and all-topic recap with two accessible SVGs. Four documents verified in original Firestore; other scenes, order, banks and rewards preserved. 129 unit tests and revised-scene Chrome checks passed. Revised authenticated walkthrough and teacher/Grade 5 review pending. See docs/goods-exchange-learning-expansion.md.

- [x] Chapter 3 Mission 4 expanded: fictional harbor relationship model, Butuan evidence-category comparison, supporting work and all-topic chapter recap with two accessible SVGs. Four documents verified in original Firestore; other scenes, order, banks and rewards preserved. 131 unit tests and revised-scene Chrome checks passed. Full revised-chapter authenticated walkthrough and teacher/Grade 5 review pending. See docs/maritime-centers-learning-expansion.md.

- [x] Full revised Chapter 3 original-project acceptance passed: all 20 scenes/four quizzes, fail to mapped review/practice/fresh retry, journal saves and My Journey display, four artifacts, 100% ten-activity challenge, badge, actual Chapter 4 continuation, refresh and replay reward protection. Temporary account and owned records removed. 131 unit tests passed. Supersedes pending revised-Chapter 3 authenticated checks; teacher/Grade 5 review remains pending. See docs/validation/chapter3-revised-live-2026-10-27.md.

- [x] Chapter 4 Mission 1 expanded: verified modern Baybayin ka example, Kawi/copperplate comparison, script versus language, source-reading task and all-topic recap with two accessible SVGs. Four documents verified in original Firestore; other scenes, order, banks and rewards preserved. 133 unit tests and revised-scene Chrome checks passed; glyph visually inspected. Authenticated walkthrough and teacher/script-specialist/Grade 5 review pending. See docs/writing-learning-expansion.md.

- [x] Chapter 4 Mission 2 expanded: fictional material-choice task, worked prepare/make/check sequence, continuity/change and all-topic recap with two accessible SVGs. Four documents verified in original Firestore; other scenes, order, banks and rewards preserved. 135 unit tests and revised-scene Chrome checks passed. Revised Chapter 4 authenticated walkthrough and teacher/Grade 5 review pending. See docs/craft-learning-expansion.md.

- [x] Chapter 4 Mission 3 expanded: named Hudhud and Mindoro script examples, broad locator, source comparison and all-topic recap. Four documents verified in original Firestore; other scenes, order, banks and rewards preserved. 137 unit tests and revised-scene Chrome checks passed. Full Chapter 4 authenticated acceptance and teacher/community-source/Grade 5 review pending. See docs/diversity-learning-expansion.md.

- [x] Chapter 4 Mission 4 expanded with a named-source portfolio, guided claim/two-source-links/limit task, two accessible SVGs and all-topic recap. Four documents verified; banks, order, rewards and progress preserved. 139 unit tests and revised-scene Chrome checks passed.
- [x] Full revised Chapter 4 authenticated acceptance passed (28 October 2026, Asia/Manila): 20 scenes/four quizzes, mapped fail/review/practice/fresh retry, journal saves/display, four artifacts, 100% ten-activity challenge, badge, available-content continuation, refresh and replay protection. Temporary accounts and owned records removed. Supersedes pending Chapter 4 live checks; teacher/current-curriculum and Grade 5 comprehension review remain pending. See docs/validation/chapter4-revised-live-2026-10-28.md.

## Era 2 / Chapter 5 Mission 1 - 28 October 2026

- [x] Published 31 new curriculum documents to the original Firestore project; atomic creation and readback verified, no learner changes.
- [x] Six interactive exploration lessons with local illustrations, five-topic quiz blueprint, two variants per topic, separate easy/hard practice and mapped lesson review.
- [x] Preserved existing reward behavior; one mission collectible and 50 XP. No premature chapter challenge or badge.
- [x] 142 non-emulator unit checks and six-scene Chrome fixture passed.
- [ ] Real signed-in student walkthrough of the new mission.
- [ ] Independent teacher/content/curriculum and Grade 5 review.
- [ ] Chapter 5 Missions 2-4 and final challenge; the chapter is explicitly partial.

Implementation and source notes: `docs/chapter5-mission1.md`. Hosting was not deployed.

## Chapter 5 Mission 2 - 28 October 2026

- [x] Added Magellan's Expedition and Early Encounters: six illustrated scenes covering Homonhon, Limasawa, Cebu, communication and source viewpoints.
- [x] Added a five-topic main quiz with two variants per topic, ten separate easy/hard practice questions, and mapped lesson review.
- [x] Published 29 new content documents and two guarded catalog description updates; original Firestore readback verified and a repeat dry run reports zero changes.
- [x] All 145 non-emulator unit checks and the new six-scene Chrome fixture passed.
- [ ] Independent teacher, historical, curriculum alignment and Grade 5 review.
- [ ] Chapter 5 Missions 3-4 and final challenge; the chapter remains partial.

Details and source notes: `docs/chapter5-mission2.md`. Website Hosting was not deployed.

- [x] Real signed-in Chapter 5 Missions 1-2 walkthrough: illustrated lessons, refresh restoration, passing quizzes, one-time rewards, replay protection and no premature chapter completion/badge. Temporary learner and owned records removed. Report: `docs/validation/chapter5-live-2026-10-28.json`. This also completes the signed-in Mission 1 walkthrough listed as pending above.

## Chapter 5 Mission 3 - locally ready, publication blocked (28 October 2026)

- [x] Authored six non-graphic Mactan scenes: authority, causes/coercion, local conditions, outcome, source limits and supported explanation.
- [x] Added four local instructional SVGs, five-topic quiz with retry variants, separate easy/hard practice, mapped review and a symbolic collectible.
- [x] 148 non-emulator unit checks and the six-scene Chrome fixture passed.
- [x] Prepared a guarded 31-change Firestore migration and an isolated real-student walkthrough for Missions 1-3.
- [ ] Publish Mission 3: Firestore returned HTTP 429 RESOURCE_EXHAUSTED (Quota exceeded) during preflight and a confirming single-document read. No commit occurred.
- [ ] Verify published fields and repeat dry run; run the signed-in Mission 3 walkthrough after database availability is restored.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Mission 4 and the Chapter 5 challenge remain unfinished.

Current live content is still Missions 1-2. Instructions and source notes: `docs/chapter5-mission3.md`.

## Chapter 5 Mission 4 - locally ready, awaiting database availability

- [x] Rechecked Mission 3 publication availability: original Firestore still returns HTTP 429 Quota exceeded; no commit attempted after the failed preflight.
- [x] Authored six Mission 4 scenes comparing the continued voyage, selected later expeditions, aims/constraints, naming and colonial rule.
- [x] Added four local SVG learning diagrams, five-topic main quiz with retry variants, separate adaptive practice, review mapping and a symbolic collectible.
- [x] Prepared a guarded 31-change migration; Mission 3 must be published before Mission 4.
- [x] 151 non-emulator unit checks and the six-scene Mission 4 browser fixture passed.
- [ ] Publish Missions 3-4, verify readback and idempotence, and run the prepared real-student walkthrough once Firestore availability returns.
- [ ] Independent teacher, historical, curriculum alignment and Grade 5 review.
- [ ] Build the Chapter 5 challenge, badge and chapter continuation. Chapter 5 is not complete yet.

Current live content remains Missions 1-2. Instructions and source notes: `docs/chapter5-mission4.md`.

## Chapter 5 challenge - locally ready, publication pending

- [x] Authored ten activities: six supporting-clue plus conclusion decisions and four matching/sequence activities covering all four missions.
- [x] Configured 70% pass threshold, First Encounters Investigator badge, 0 additional chapter XP and existing one-time reward behavior.
- [x] Prepared guarded 14-write migration with 16 prerequisites for published active missions and unchanged lesson clues. Publish Mission 3, then Mission 4, then the challenge.
- [x] All 154 non-emulator unit checks passed. Chrome verified all-four-mission gate, ten authored activities, saved evidence selections, 60% fail/70% pass, one-time badge and no promise of unavailable Chapter 6 content.
- [x] Prepared a real-student full Chapter 5 walkthrough including the new evidence interactions and reward replay checks.
- [ ] Publish/read back and run the real-student walkthrough: original Firestore still returns HTTP 429 Quota exceeded during Mission 3 preflight. No challenge commit occurred.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.

Live content remains Missions 1-2. Missions 3-4 and the challenge are implemented locally, not yet deployed to Firestore. See `docs/chapter5-challenge.md` for publication order and validation limits.

## Firestore read quota investigation and reduction

- [x] Read Cloud Monitoring without consuming database document reads: 49,367 successful reads, 3,333 writes and 576 deletes since the current Pacific midnight at audit time. Daily read exhaustion is strongly suggested, not definitively identified by a quota ID.
- [x] Scoped chapter challenge mission/challenge/question queries to the relevant chapter or challenge.
- [x] Removed full practice-bank reads from dashboard/review: only distinct missions in this learner's saved quiz/practice history are queried; new students make no practice-bank reads.
- [x] Narrowed pending Chapter 5 live test catalogs to avoid repeatedly fetching all questions/scenes.
- [x] All 158 non-emulator unit checks plus Chapter 5 and existing evidence-challenge browser fixtures passed.
- [ ] Confirm database availability after the applicable quota reset, then publish Missions 3-4 and the Chapter 5 challenge and run the narrowed live walkthrough.

Audit and limitations: `docs/firestore-read-usage.md`; metrics: `docs/validation/firestore-usage-audit.json`. No billing upgrade, emulator, student-data migration or Hosting deployment was performed.

## Chapter 6 Mission 1 - locally ready, unpublished

- [x] Authored Legazpi's Expedition with six interactive scenes, four accessible teaching diagrams, chronology, participant roles, local responses, settlement and return connection.
- [x] Prepared five-topic main quiz with two variants per topic, ten separate easy/hard practice questions, mapped lesson review and a symbolic collectible.
- [x] Prepared a guarded 31-change migration with seven publication prerequisites. Publish Chapter 5 Missions 3-4 and its challenge first.
- [x] All 162 non-emulator unit checks and the six-scene browser fixture passed. Owned Chapter 5 completion gates Chapter 6; no Chapter 6 badge or challenge is invented.
- [x] Chapter 5 browser completion offers Explore Chapters when unavailable and Continue to Next Chapter when Chapter 6 Mission 1 is available.
- [ ] Live publication/readback and signed-in Chapter 6 walkthrough remain pending. No live database requests or test accounts were used during this local task.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 6 Missions 2-4 and its chapter challenge/badge remain unfinished.

Details and sources: `docs/chapter6-mission1.md`. Hosting was not deployed.

## Chapter 6 Mission 2 - locally ready, unpublished

- [x] Six interactive Cebu-Manila comparison scenes with four accessible instructional SVGs: dates, earlier communities, trade, different local responses and institutional reach.
- [x] Five-topic main quiz with retry variants, separate easy/hard practice, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with eight prerequisites; publish earlier Chapter 5 content and Chapter 6 Mission 1 first.
- [x] All 166 non-emulator unit checks and the six-scene Chrome fixture passed. Mission 2 requires owned Mission 1 completion; no premature chapter badge or completion.
- [ ] Live publication, readback and signed-in Chapter 6 walkthrough. No live database requests were made during this task; availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Missions 3-4 and Chapter 6 challenge/badge remain unfinished.

Details and sources: `docs/chapter6-mission2.md`. Hosting was not deployed.

## Instructional navigation cache

- [x] Added two-minute tab-local cache for eras, era-scoped chapters and chapter-scoped missions; duplicate in-flight requests share a result.
- [x] Added Refresh Learning Content; account changes clear cached entries. Account, progress, eligibility and rewards remain fresh.
- [x] 170 non-emulator unit checks plus chapter and mission navigation browser fixtures passed.
- [ ] Measure live read reduction once database access returns. Story and assessment caching remains outside this increment.

See `docs/firestore-read-usage.md`. Local changes only; no database or Hosting deployment.

## Chapter 6 Mission 3 - locally ready, unpublished

- [x] Six illustrated interactive scenes on connections, coercion, local choices, uneven reach, distinct Ifugao/Sulu examples and supported explanation.
- [x] Five-topic main quiz with retry variants, ten separate easy/hard practice questions, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with nine prerequisites; publish prior Chapter 5 content and Chapter 6 Missions 1-2 first.
- [x] All 174 non-emulator unit checks and the six-scene Chrome fixture passed. Both owned prior-mission completions gate Mission 3; no chapter badge or completion is invented.
- [ ] Publication, readback and signed-in student verification. No live Firestore calls were made for this task; availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 6 Mission 4 and final challenge remain unfinished.

Source notes and publication instructions: `docs/chapter6-mission3.md`. Hosting was not deployed.

## Chapter 6 Mission 4 - locally ready, unpublished

- [x] Six illustrated interactive scenes on colonization's meaning, motives, methods, effects, source viewpoints and supported explanation.
- [x] Five-topic quiz with retry variants, ten separate easy/hard practice questions, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with ten prerequisites; earlier Chapter 5 releases and Chapter 6 Missions 1-3 must be published first.
- [x] All 178 non-emulator unit checks and the six-scene browser fixture passed. All three owned prior missions gate Mission 4. No chapter challenge, badge or completion was invented.
- [ ] Live publication/readback and signed-in verification. No Firestore requests were used in this task, and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 6 challenge and badge remain unfinished.

Details and sources: `docs/chapter6-mission4.md`. Hosting was not deployed.

## Chapter 6 challenge and badge - locally ready, unpublished

- [x] Ten activities connect all four missions: six supporting-clue plus conclusion decisions and four matching tasks.
- [x] Configured 70% passing score, Colonial History Investigator badge, 0 extra chapter XP and existing one-time reward behavior.
- [x] Prepared guarded 14-write migration with 16 prerequisites for published active missions and unchanged source clues. Publish Chapter 6 Missions 1-4 after earlier Chapter 5 releases first.
- [x] All 181 non-emulator unit checks and the challenge Chrome fixture passed: four-mission gate, ten tasks, partial draft restoration, 60% fail/70% pass, one-time badge, unchanged XP and no promise of unavailable Chapter 7.
- [ ] Publication/readback and actual signed-in full-chapter walkthrough remain pending. No Firestore calls were made during this local task; availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.

Chapter 6's four missions and challenge are authored locally, not yet available in the live database. See `docs/chapter6-challenge.md`. Hosting was not deployed.

## Chapter 7 Mission 1 - locally ready, unpublished

- [x] Six interactive central-government lessons and four accessible SVG guides: Crown/office, duties, implementation, Audiencia, source limits and synthesis.
- [x] Five-topic quiz with retry variants, ten separate adaptive practice questions, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with seven publication prerequisites. Publish earlier Chapter 5 and Chapter 6 content first.
- [x] All 185 non-emulator unit checks and six-scene Chrome fixture passed. Owned Chapter 6 completion gates Chapter 7; continuation requires an available active mission. No chapter challenge or badge is invented.
- [ ] Live publication/readback and signed-in verification. No Firestore calls were made and database availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 7 Missions 2-4 and final challenge remain unfinished.

Details and sources: `docs/chapter7-mission1.md`. Hosting was not deployed.

## Chapter 7 Mission 2 - locally ready, unpublished

- [x] Six illustrated interactive lessons and four accessible guides on levels, gobernadorcillo, earlier leadership/colonial roles, intermediaries, requests and source limits.
- [x] Five-topic quiz with retry variants, separate easy/hard practice, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with eight prerequisites; earlier releases and Chapter 7 Mission 1 must be published first.
- [x] All 189 non-emulator unit checks and six-scene browser fixture passed. Owned Mission 1 completion gates Mission 2; no chapter badge/completion is invented.
- [ ] Publication/readback and signed-in verification. No live Firestore calls were made and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 7 Missions 3-4 and final challenge remain unfinished.

Details and sources: `docs/chapter7-mission2.md`. Hosting was not deployed.

## Chapter 7 Mission 3 - locally ready, unpublished

- [x] Six illustrated interactive scenes on encomienda, required tribute, duties versus practice, household effects and source limits.
- [x] Five-topic quiz with retry variants, ten separate easy/hard practice questions, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with nine prerequisites; publish earlier content and Chapter 7 Missions 1-2 first.
- [x] All 193 non-emulator unit checks and six-scene browser fixture passed; both owned prior missions gate Mission 3 and no chapter completion/badge is invented.
- [ ] Live publication/readback and signed-in verification. No Firestore calls were made and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 7 Mission 4 and final challenge remain unfinished.

Details and sources: `docs/chapter7-mission3.md`. Hosting was not deployed.

## Chapter 7 Mission 4 - locally ready, unpublished

- [x] Six interactive settlement-reorganization scenes, a fictional proposed-layout SVG and two accessible evidence guides.
- [x] Five-topic quiz with retry variants, ten separate easy/hard practice items, mapped review and symbolic collectible.
- [x] Guarded 31-change migration with ten prerequisites. Earlier pending releases and Chapter 7 Missions 1-3 must be published first.
- [x] All 197 non-emulator unit checks and six-scene browser fixture passed. Three owned prior-mission completions gate Mission 4; no chapter badge/completion is invented.
- [ ] Publication/readback and signed-in verification. No Firestore calls were made and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 7 challenge and badge remain unfinished.

Details and sources: `docs/chapter7-mission4.md`. Hosting was not deployed.

## Chapter 7 challenge and badge - locally ready, unpublished

- [x] Ten activities cover all four missions: six supporting-clue plus conclusion decisions and four matching tasks.
- [x] Configured 70% pass threshold, Government and Community Investigator badge and 0 extra chapter XP through existing one-time reward behavior.
- [x] Guarded 14-write migration with 18 prerequisites for active missions and unchanged lesson clues. Publish earlier releases and Chapter 7 Missions 1-4 first.
- [x] All 200 non-emulator unit checks and challenge browser fixture passed: mission gate, ten tasks, partial draft restoration, 60% fail/70% pass, one-time badge, unchanged XP and unavailable-next-chapter fallback.
- [ ] Publication/readback and signed-in full-chapter verification. No Firestore calls were made; availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.

All four Chapter 7 missions and its challenge are authored locally, not published. Details: `docs/chapter7-challenge.md`. Hosting was not deployed.

## Chapter 8 Mission 1 - locally ready, unpublished

- [x] Six illustrated missionary-history scenes and four accessible guides: aims, arrival sequence, language materials, colonial context, responses and evidence limits.
- [x] Five-topic quiz with retry variants, ten separate adaptive practice items, mapped review and symbolic collectible. No prayer, profession of belief or disclosure of religion is required.
- [x] Guarded 31-change migration with seven prerequisites; earlier chapters and Chapter 7 challenge must be published first.
- [x] All 204 non-emulator unit checks and six-scene Chrome fixture passed. Owned Chapter 7 completion gates Chapter 8; no premature challenge or badge is invented.
- [ ] Live publication/readback and signed-in verification. No Firestore calls were made and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 8 Missions 2-4 and final challenge remain unfinished.

Details and sources: `docs/chapter8-mission1.md`. Hosting was not deployed.

## Chapter 8 Mission 2 - locally ready, unpublished

- [x] Six illustrated lessons on royal patronage, support, formal roles, jurisdictional disagreements, source limits and local effects; three accessible teaching SVGs.
- [x] Five-topic quiz with retry variants, ten separate adaptive practice items, mapped review and symbolic collectible. No religious practice or disclosure is required.
- [x] Guarded 31-change migration with eight prerequisites; earlier content and Chapter 8 Mission 1 must be published first.
- [x] All 208 non-emulator unit checks and six-scene browser fixture passed. Owned Mission 1 completion gates Mission 2; no premature chapter badge/completion.
- [ ] Publication/readback and signed-in verification. No Firestore calls were made and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 8 Missions 3-4 and final challenge remain unfinished.

Details and sources: `docs/chapter8-mission2.md`. Hosting was not deployed.

## Chapter 8 Mission 3 - locally ready, unpublished

- [x] Six illustrated community-change lessons and five accessible teaching guides: belief/practice, parish and building dates, makers, continuity/change and dated heritage evidence.
- [x] Five-topic quiz with retry variants, ten separate adaptive practice items, mapped review and symbolic collectible. No religious practice or disclosure is required.
- [x] Guarded 31-change migration with nine prerequisites; earlier releases and Chapter 8 Missions 1-2 must be published first.
- [x] All 212 non-emulator unit checks and six-scene Chrome fixture passed. Both owned prior missions gate Mission 3; no premature chapter badge/completion.
- [ ] Publication/readback and signed-in verification. No Firestore calls were made and availability was not rechecked.
- [ ] Independent historical, teacher, curriculum alignment and Grade 5 review.
- [ ] Chapter 8 Mission 4 and final challenge remain unfinished.

Details and sources: `docs/chapter8-mission3.md`. Hosting was not deployed.


## Chapter 8 Mission 4 - locally ready, unpublished

- [x] Six illustrated scenes cover different responses, adaptation and continuity, Tamblot in Bohol, living heritage and evidence-supported reports.
- [x] Ten main-bank variants, ten separate easy/hard practice questions and mapped lesson review; 50 XP and symbolic journal use existing one-time reward behavior.
- [x] Guarded 31-change migration requires earlier releases; no learner records or premature chapter reward.
- [x] All 216 non-emulator unit checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Teacher/historical/Grade 5 review and authenticated live publication remain pending.
- [ ] Build the Chapter 8 final evidence challenge.

Details: docs/chapter8-mission4.md. Hosting was not deployed.


## Chapter 8 evidence challenge - locally ready, unpublished

- [x] Six clue-and-conclusion decisions and four matching tasks connect all four missions.
- [x] Seven of ten passes; Community and Belief Investigator badge once, zero additional chapter XP.
- [x] Guarded 14-change migration with four mission and ten scene-clue prerequisites; no learner writes.
- [x] All 219 non-emulator checks and Chapter 8 Chrome challenge fixture passed without Firestore requests.
- [ ] Independent historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter8-challenge.md. Next roadmap content: Era 3 Chapter 9.


## Era 3 Chapter 9 Mission 1 - locally ready, unpublished

- [x] Six illustrated scenes cover required tribute, payment forms, household resources, collection evidence and changing tax systems.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] New era and partial Chapter 9 follow independent-era access; Missions 2-5, challenge and final badge remain pending.
- [x] Prepared 31-create migration with seven publication-order prerequisites; no learner writes or existing catalog overwrites.
- [x] All 223 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter9-mission1.md. Next content: Polo y Servicios and Bandala.


## Chapter 9 Mission 2 - locally ready, unpublished

- [x] Six illustrated scenes distinguish polo, time burdens, bandala, delivery/payment evidence and Sumuroys named protest.
- [x] Ten main-bank variants, ten separate easy/hard practice items and mapped lesson review; configured 50 XP and symbolic journal use existing one-time reward behavior.
- [x] Prepared 31 changes with eight publication prerequisites and guarded catalog descriptions; no learner writes or premature chapter reward.
- [x] All 227 non-emulator checks and the six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter9-mission2.md. Next content: Agriculture, Monopolies, and Economic Policies.


## Chapter 9 Mission 3 - locally ready, unpublished

- [x] Six illustrated scenes cover crop uses, economic policy, the tobacco monopoly, costs and choices, and policy change.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with nine publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] All 231 non-emulator checks and the six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter9-mission3.md. Next: The Manila-Acapulco Galleon Trade.


## Chapter 9 Mission 4 - locally ready, unpublished

- [x] Six illustrated scenes cover the Pacific connection, goods, workers, voyage evidence and uneven effects; route schematic distinguishes ports and flow directions.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with ten publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] All 235 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter9-mission4.md. Next: Effects of Colonial Economic Policies on Communities.


## Chapter 9 Mission 5 - locally ready, unpublished

- [x] Six illustrated scenes connect household resources, time, choices, uneven effects and recorded responses across the chapter.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with eleven publication prerequisites and guarded descriptions; no learner writes or premature chapter completion.
- [x] All 239 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.
- [ ] Build the Chapter 9 evidence challenge across all five missions.

Details: docs/chapter9-mission5.md.


## Chapter 9 evidence challenge - locally ready, unpublished

- [x] Five clue-and-conclusion decisions and five matching activities give each mission one of each task.
- [x] Seven of ten passes; Community Economy Investigator badge once, zero additional chapter XP.
- [x] Guarded 14-write migration with five mission and twelve exact scene-clue prerequisites; no learner writes.
- [x] All 242 non-emulator checks and Chapter 9 Chrome challenge fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter9-challenge.md. Next roadmap content: Chapter 10, Social and Cultural Transformation.


## Chapter 10 Mission 1 - locally ready, unpublished

- [x] Six illustrated scenes cover settlement layouts, combined materials, ventilation, daily use and dated building changes; diagrams are labelled teaching models.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with eight publication prerequisites and a guarded era description; no learner writes or premature chapter reward.
- [x] Owned Chapter 9 completion gates the new chapter; continuation requires actual ready content.
- [x] All 246 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter10-mission1.md. Next: Education, Language, and Religious Life.


## Chapter 10 Mission 2 - locally ready, unpublished

- [x] Six illustrated scenes distinguish learning settings, teaching materials, language, school policy and religious life.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with nine publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] No prayer, profession of faith or personal religion disclosure required; source production and policy remain separate from actual learning and belief.
- [x] All 250 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter10-mission2.md. Next: Social Hierarchies and Everyday Experiences.


## Chapter 10 Mission 3 - locally ready, unpublished

- [x] Six illustrated scenes distinguish power, local roles, tax categories, opportunities and a named Bacolor petition.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with ten publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] No ancestry ranking or family-income disclosure; colonial labels do not determine human worth or a complete biography.
- [x] All 254 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter10-mission3.md. Next: Arts, Architecture, and Cultural Practices.


## Chapter 10 Mission 4 - locally ready, unpublished

- [x] Six illustrated scenes cover makers, event/painting dates, architectural adaptation, a dated textile story and source purpose.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with eleven publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] No graphic painting reproduction, alcohol use, religious practice or conflict reenactment required.
- [x] All 258 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter10-mission4.md. Next: Continuity and Change in Filipino Society.


## Chapter 10 Mission 5 - locally ready, unpublished

- [x] Six illustrated scenes connect continuity, dated comparison, implementation, agency and living heritage.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with twelve publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] All 262 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.
- [ ] Build Chapter 10 evidence challenge across all five missions.

Details: docs/chapter10-mission5.md.


## Chapter 10 evidence challenge - locally ready, unpublished

- [x] Five clue-and-conclusion decisions and five matching tasks give each mission one of each activity.
- [x] Seven of ten passes; Social and Cultural Investigator badge once, zero additional chapter XP.
- [x] Guarded 14-write migration requires five active missions and twelve exact scene-clue lists; no learner writes.
- [x] All 265 non-emulator checks and Chapter 10 Chrome challenge fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter10-challenge.md. Next roadmap content: Chapter 11, Indigenous Autonomy and the Limits of Colonial Rule.


## Chapter 11 Mission 1 - locally ready, unpublished

- [x] Six illustrated scenes distinguish territorial claims, actual control, local decisions, contact, connected change and source perspectives.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with eight publication prerequisites and guarded era description; no learner writes or premature chapter reward.
- [x] Owned Chapter 10 completion gates the partial chapter; four-mission roadmap is preserved.
- [x] All 269 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter11-mission1.md. Next: Muslim Polities and Communities in Mindanao and Sulu.


## Chapter 11 Mission 2 - locally ready, unpublished

- [x] Six illustrated scenes distinguish Muslim polities, dated leadership, trade/work, diplomacy and varied community/source perspectives.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with nine publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] Harm is acknowledged without graphic reenactment or stereotypes; religious identity is not a universal occupation, motive or measure of worth.
- [x] All 273 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter11-mission2.md. Next: Cordillera Communities and Indigenous Autonomy.


## Chapter 11 Mission 3 - locally ready, unpublished

- [x] Six illustrated scenes distinguish regional diversity, Ifugao strategies, landscape context, connections and collaborative evidence.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with ten publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] Layer diagram is fictional; no universal terrace age, terrain-only explanation or identity/ritual requirement.
- [x] All 277 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter11-mission3.md. Next: Diplomacy, Adaptation, Conflict, and Resistance.


## Chapter 11 Mission 4 - locally ready, unpublished

- [x] Six illustrated scenes distinguish diplomacy, adaptation, resistance, constrained choices and outcome evidence.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic portfolio use existing one-time rewards.
- [x] Prepared 31 changes with eleven publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] No attack reenactment, prescribed fighting/surrender/faith change or points for harm; uncertain outcomes remain uncertain.
- [x] All 281 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.
- [ ] Build Chapter 11 evidence challenge across all four missions.

Details: docs/chapter11-mission4.md.


## Chapter 11 evidence challenge - locally ready, unpublished

- [x] Six clue-and-conclusion decisions and four matching tasks connect all four missions.
- [x] Seven of ten passes; Autonomy and Community Response Investigator badge once, zero additional chapter XP.
- [x] Guarded 14-write migration with four active mission and fourteen exact scene-clue prerequisites; no learner writes.
- [x] All 284 non-emulator checks and Chapter 11 Chrome challenge fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter11-challenge.md. Era 3 Chapters 9-11 are authored locally; review and publication remain pending. Next roadmap content: Era 4 Chapter 12.


## Era 4 Chapter 12 Mission 1 - locally ready, unpublished

- [x] Six illustrated scenes distinguish grievances, policies, forms of opposition, participation and outcomes through named cases.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 creates with seven publication-order prerequisites; no learner writes or existing catalog overwrites.
- [x] New Era 4 follows existing independent-era access; Missions 2-5, challenge and final badge remain pending.
- [x] All 288 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter12-mission1.md. Next: Early Regional Uprisings.


## Chapter 12 Mission 2 - locally ready, unpublished

- [x] Six illustrated scenes compare selected Tamblot, Sumuroy and Basi cases with a labelled chronology and source limits.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with eight publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] Similar concerns and date order do not imply universal participation, identical motives or one coordinated event.
- [x] All 292 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter12-mission2.md. Next: Religious and Political Revolts.


## Chapter 12 Mission 3 - locally ready, unpublished

- [x] Six illustrated scenes compare religious concerns, political organization, the Dagohoy movement and the Cofradia case.
- [x] Movement-span timeline does not turn 1744-1829 into a personal lifetime or continuous personal leadership.
- [x] Ten main-bank variants and ten separate easy/hard practice questions map to lesson review; configured 50 XP and symbolic journal use existing one-time rewards.
- [x] Prepared 31 changes with nine publication prerequisites and guarded descriptions; no learner writes or premature chapter reward.
- [x] All 296 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter12-mission3.md. Next: Leaders, Communities, and Regional Participation.


## Chapter 12 Mission 4 - locally ready, unpublished

- [x] Six illustrated scenes distinguish leadership, Gabrielas continuation, regional reach, roles and source scope.
- [x] Ten main-bank variants and ten separate practice questions map to review; configured one-time 50 XP and journal.
- [x] Prepared 31 changes with ten prerequisites and guarded descriptions; no learner writes or chapter reward.
- [x] All 300 non-emulator checks and six-scene Chrome fixture passed without Firestore requests.
- [ ] Historical/teacher/Grade 5 review, ordered publication and authenticated walkthrough remain pending.

Details: docs/chapter12-mission4.md. Next: Outcomes and Historical Significance of Early Revolts.


## Chapter 12 Mission 5 - local progress (2026-10-28)

- [x] Six scenes on outcomes and historical significance, with modern teaching diagrams and authored help.
- [x] Five-topic quiz, equivalent retry variants and separate adaptive practice bank.
- [x] Guarded 31-write publication plan; own four prior mission completions required by journey flow.
- [x] 304 local unit checks and six-scene Chrome check passed without Firestore.
- [ ] Teacher/curriculum review and authenticated live verification.
- [ ] Ordered Firestore publication and Hosting deployment.
- [ ] Chapter 12 final challenge across all five missions.

Details: [Mission 5](docs/chapter12-mission5.md).


## Chapter 12 final challenge - local progress (2026-10-28)

- [x] Five evidence decisions and five matching activities cover all five missions.
- [x] Supporting clue and conclusion count together; passing threshold is 7 of 10.
- [x] Existing five-mission gate, resumable draft and one-time chapter badge checked.
- [x] Fourteen-write publication plan guards catalog updates and 19 prerequisites.
- [x] 307 local unit checks and mocked Chrome challenge walkthrough passed.
- [ ] Independent teacher/curriculum review, publication and authenticated live verification.

Details: [Chapter 12 challenge](docs/chapter12-challenge.md). Next content: Chapter 13 Mission 1.


## Chapter 13 Mission 1 - local progress (2026-10-28)

- [x] Six scenes introduce 18th-century chronology, trade, occupation, production rules and policy stages.
- [x] Five-topic quiz, retry variants, separate adaptive practice and modern labelled illustrations.
- [x] Guarded 31-change publication plan; learner-owned Chapter 12 completion gate verified.
- [x] 311 local checks and six-scene mocked Chrome walkthrough passed.
- [ ] Independent source/teacher review, publication and authenticated live verification.

Details: [Chapter 13 Mission 1](docs/chapter13-mission1.md). Next: Colonial Reforms and Their Effects.


## Chapter 13 Mission 2 - local progress (2026-10-28)

- [x] Six scenes compare reform aims, methods, supported effects and evidence limits.
- [x] Economic society, monopoly and charter examples with modern teaching diagrams and authored help.
- [x] Five-topic main quiz, retry variants and separate adaptive practice.
- [x] Guarded 31-change plan and learner-owned Mission 1 completion gate checked.
- [x] 315 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, publication and authenticated live verification.

Details: [Chapter 13 Mission 2](docs/chapter13-mission2.md). Next: International Events and the Spread of New Ideas.


## Chapter 13 Mission 3 - local progress (2026-10-28)

- [x] Six scenes connect reason, rights, international documents and evidence of circulation or response.
- [x] French declaration, Cadiz Constitution and Philippine print outlet examples retain dates and source limits.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Guarded 31-write plan and learner-owned two-prior-mission gate checked.
- [x] 319 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, publication and authenticated live verification.

Details: [Chapter 13 Mission 3](docs/chapter13-mission3.md). Next: Local Grievances and Growing Political Awareness.


## Chapter 13 Mission 4 - local progress (2026-10-28)

- [x] Six scenes connect grievances, recorded responses and evidence of political awareness.
- [x] Earlier Bacolor comparison, production complaints and Basi case retain chronology and limits.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Guarded 31-change plan and learner-owned three-prior-mission gate checked.
- [x] 323 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, ordered publication and authenticated live verification.
- [ ] Chapter 13 final challenge.

Details: [Chapter 13 Mission 4](docs/chapter13-mission4.md).


## Chapter 13 final challenge - local progress (2026-10-28)

- [x] Six evidence decisions and four matching tasks cover all four missions.
- [x] Supporting clue and conclusion count together; pass at 7 of 10 activities.
- [x] Existing four-mission gate, draft resume and one-time chapter badge verified.
- [x] Fourteen-write publication plan guards catalog descriptions and 18 prerequisites.
- [x] 326 local checks and mocked Chrome challenge walkthrough passed.
- [ ] Independent teacher/curriculum review, ordered publication and authenticated live verification.

Details: [Chapter 13 challenge](docs/chapter13-challenge.md). Next: Chapter 14 Mission 1.


## Chapter 14 Mission 1 - local progress (2026-10-28)

- [x] Six scenes distinguish contributions, outcomes, organization, continuity and remembrance.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Modern teaching diagrams and explicit limits on broader national-program claims.
- [x] Guarded 31-change plan and learner-owned Chapter 13 completion gate checked.
- [x] 330 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, ordered publication and authenticated live verification.

Details: [Chapter 14 Mission 1](docs/chapter14-mission1.md). Next: Participation of Different Regions and Communities.


## Chapter 14 Mission 2 - local progress (2026-10-28)

- [x] Six scenes compare regional settings, distinct movements, reported reach and recorded participation.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Modern teaching diagrams and evidence portfolio distinguish residents from participants.
- [x] Guarded 31-write plan and learner-owned Mission 1 completion gate checked.
- [x] 334 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, ordered publication and authenticated live verification.

Details: [Chapter 14 Mission 2](docs/chapter14-mission2.md). Next: Women and Indigenous Peoples in the Struggle.


## Chapter 14 Mission 3 - local progress (2026-10-28)

- [x] Six scenes examine named contributions, Ifugao agency, cultural roles and collaborative history.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Modern teaching diagrams avoid universal identity-based roles and invented historical records.
- [x] Guarded 31-write plan and learner-owned two-prior-mission gate checked.
- [x] 338 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, ordered publication and authenticated live verification.

Details: [Chapter 14 Mission 3](docs/chapter14-mission3.md). Next: Unity, Division, and Collective Identity.


## Chapter 14 Mission 4 - local progress (2026-10-28)

- [x] Six scenes distinguish shared aims, coordination, belonging, disagreement and changing identity.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Fictional models are labelled; historical claims preserve source scope and community differences.
- [x] Guarded 31-change plan and learner-owned three-prior-mission gate checked.
- [x] 342 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, ordered publication and authenticated live verification.

Details: [Chapter 14 Mission 4](docs/chapter14-mission4.md). Next: Early Developments Toward Filipino National Consciousness.


## Chapter 14 Mission 5 - local progress (2026-10-28)

- [x] Six scenes trace earlier concerns, later remembrance and dated wider public arguments.
- [x] Five-topic quiz, retry variants, separate adaptive practice and authored help.
- [x] Gomburza and Rizal references preserve chronology, source limits and non-graphic presentation.
- [x] Guarded 31-write plan and learner-owned four-prior-mission gate checked.
- [x] 346 local checks and mocked six-scene Chrome walkthrough passed.
- [ ] Teacher/curriculum review, ordered publication and authenticated live verification.
- [ ] Chapter 14 final challenge.

Details: [Chapter 14 Mission 5](docs/chapter14-mission5.md).


## Chapter 14 final challenge - local progress (2026-10-28)

- [x] Five evidence decisions and five matching activities cover all five missions.
- [x] Supporting clue and conclusion count together; pass at 7 of 10.
- [x] Five-mission gate, draft resume and one-time chapter badge verified.
- [x] Fourteen-write plan guards catalog descriptions and 18 prerequisites.
- [x] 349 local checks and mocked Chrome challenge walkthrough passed.
- [ ] Independent teacher/curriculum and cross-chapter review.
- [ ] Ordered publication, authenticated live verification and Hosting deployment.

Details: [Chapter 14 challenge](docs/chapter14-challenge.md). Chapter 14 content is authored locally; this does not mark the live project complete. Next: cross-chapter review and publication inventory.


## Cross-chapter offline publication review (2026-10-28)

- [x] Added a local-only publication audit; no Firebase import, authentication or network calls.
- [x] Chapters 5-14: 54 plans, 44 missions and 10 challenges resolve internally without structural errors.
- [x] Checked ordered prerequisites, description guards, references, quiz mappings and local assets.
- [x] 352 local checks passed, including deliberate guard and forbidden-write failures.
- [x] Publication sequence documents exact scope and avoids blindly rerunning older plans.
- [ ] Review Chapters 1-4 and supplementary migrations against the selected chain.
- [ ] Teacher/source review and authenticated production verification.
- [ ] Bounded live preflight, ordered publication and Hosting deployment.

See [publication sequence](docs/publication-sequence.md) and [machine-readable report](docs/validation/publication-local.json).


## Early-chapter and supplementary review (2026-10-28)

- [x] Added offline dated-snapshot comparison for prologue, Chapters 1-4 and 32 supplementary curriculum inputs.
- [x] One quiz per mission and topic-to-lesson mapping checked in the saved baseline.
- [x] Identified 59 absent snapshot image paths; 44 have existing authored replacement candidates, 15 remain unresolved.
- [x] Recorded field-level overlap across 176 documents without treating intentional revisions as automatic conflicts.
- [x] 354 local checks passed; no Firestore requests or migrations executed.
- [ ] Inspect and resolve 15 remaining scene image gaps.
- [ ] Reconcile overlapping revisions and their intended publication dependencies.
- [ ] Teacher review and bounded authenticated live verification.

See [early-content review](docs/early-content-review.md) and [detailed report](docs/validation/early-content-local.json).


## Early-scene image repair authoring (2026-10-28)

- [x] Authored 15 scene-specific modern SVG teaching diagrams.
- [x] Prepared image-metadata-only updates guarded against the saved scene text and old image URL.
- [x] Refreshed audit: all 59 absent snapshot image paths now have local authored replacement candidates.
- [x] 356 local checks passed; Chrome loaded all 15 diagrams without text overflow.
- [ ] Teacher/visual review and reconciliation with current scene metadata.
- [ ] Asset deployment, guarded Firestore publication and authenticated verification.

See [image repairs](docs/early-scene-image-repairs.md). Next: reconcile supplementary migration overlaps.


## Supplementary field-history mapping (2026-10-28)

- [x] Added offline expected-to-desired field history analysis with no deployment output.
- [x] Mapped 2,305 overlapping fields; 292 disconnected and 221 differing field-unguarded cases remain review items.
- [x] Documented why field terminals cannot safely select a whole canonical lesson.
- [x] 359 local checks passed, including branches, cycles and stale histories.
- [ ] Resolve flagged whole-document histories and explicit publication dependencies.
- [ ] Teacher review and bounded live verification before publication.

See [reconciliation review](docs/content-reconciliation.md). No existing guards were bypassed or overwritten.


## Prologue and feedback revision review (2026-10-28)

- [x] All 27 archaeology expected document states match the preserved pre-glossary authored revision.
- [x] Preserved current guards; no rebase to the older snapshot or historical-backup replay.
- [x] Identified 20 snapshot-matching feedback/wording overlaps with no replay justified by the baseline.
- [x] Marked 30 nonmatching feedback documents for whole-question review.
- [x] 362 local checks passed; no database calls or content overwrites.
- [ ] Resolve the remaining 30 feedback documents against later lesson revisions.
- [ ] Teacher review, current live-state verification and publication.

See [prologue and feedback reconciliation](docs/prologue-feedback-reconciliation.md).


## Thirty-question feedback dispositions (2026-10-28)

- [x] Retained complete coherent review sets for all 30 nonmatching older feedback documents.
- [x] Ten later roadmap matches and twenty simpler snapshot scenario sets identified.
- [x] Scenario answer keys preserved; older partial-feedback replays marked superseded in the review bundle.
- [x] 364 local checks passed; review bundle is non-executable with teacher/live review pending.
- [ ] Verify retained questions against intended lesson scenes and adaptive practice.
- [ ] Reconcile remaining supplementary whole-document overlaps and verify actual live state.

See [question reconciliation](docs/question-reconciliation.md).


## Retained question alignment (2026-10-28)

- [x] Thirty questions map to fifteen topics across three missions with teaching scenes and retry variants.
- [x] Separate active practice exists for every topic; no exact normalized main-prompt reuse found.
- [x] Review-topic scene filtering and practice continuation inspected in runtime code.
- [x] 367 local checks passed, including broken-map and duplicate-prompt cases.
- [ ] Fill six requested-easy review catalog gaps without merely relabelling harder questions.
- [ ] Teacher check of whether scene content fully teaches the retained answers.
- [ ] Recheck intended final catalog and authenticated live flow before publication.

See [alignment review](docs/retained-question-alignment.md).


## Lesson-first recovery and easy review (2026-10-28)

- [x] Failed-quiz primary action opens the first diagnosed lesson topic; no-topic fallback opens the lesson.
- [x] Passing navigation and optional retry remain intact.
- [x] Six new easy practice items fill the intended catalog gaps without relabelling existing questions.
- [x] Preserved hard evidence requirements and existing mastery policy.
- [x] 370 local checks and mocked quiz browser verification passed.
- [ ] Teacher review, live catalog comparison, publication and deployment.

See [easy review and recovery](docs/easy-review-recovery.md).


## Home and My Journey next-step guidance (2026-10-28)

- [x] Shared failed-quiz recommendation opens a diagnosed lesson topic before practice.
- [x] Saved lesson-revisit evidence advances the recommendation to targeted practice.
- [x] Quiz/practice resume actions and verified retry readiness retain their existing behavior.
- [x] 373 local checks and mocked My Journey Chrome verification passed.
- [ ] Code deployment and authenticated end-to-end recovery verification.

See [next-step recovery](docs/student-next-step-recovery.md).


## Recovery handoff verification (2026-10-28)

- [x] Fixed explicit topic review to use configured review difficulty when saved history is unavailable.
- [x] Valid practice drafts still restore saved adaptive state.
- [x] Story save-failure fallback and chapter/mission/topic practice handoff verified.
- [x] Practice topic filtering and original mission quiz retry link verified.
- [x] Story and practice Chrome suites passed; 373 non-emulator checks passed.
- [ ] Code deployment, easy-question publication and authenticated production walkthrough.

See [recovery handoff verification](docs/recovery-handoff-verification.md).

### 2026-10-28 — Clearer result saving messages
- Quiz submission now shows persistent accessible saving, saved, and unconfirmed-save messages instead of a failure pop-up.
- Practice explains how to retry saving and that leaving may omit the session from progress.
- No extra Firestore requests; no publication. Local unit checks: 373 passed. Mocked quiz and practice browser suites passed.


### 2026-10-28 — Home progress loading recovery
- Home displays Loading while reading profile progress; unavailable profile data displays Not loaded.
- Failed mission/badge counts display Not loaded with separate retry buttons. Retry reads only that count; confirmed empty results still display zero.
- Missing student profiles now show a retry/help message instead of silently stopping.
- 374 local checks passed, including failed-count recovery and scoped retry reads. No live Firestore requests or publication.


### 2026-10-28 — Student learning loop local verification
- Six mocked browser suites passed across Home, My Journey, missions, story, practice, and quiz.
- Updated outdated Home direct-practice assertions; added lesson-first recovery and next-mission handoff checks.
- 374 local unit checks passed. Separate fixtures verify handoffs; a live authenticated cross-page test remains pending. See docs/student-learning-loop-local.md.


### 2026-10-28 — Trading investigation visual learning steps
- Added Explore / Plan / Explain step cards with current and completed states, plus inventory cards using authored tradeActivity goods and quantities.
- Improved evidence journal heading, responsive layout, keyboard semantics and reduced-motion support; no new curriculum hardcodes or Firestore reads.
- Local trading browser checks cover stage transitions alongside gating, reflection, refresh and revision. No publication.


### 2026-10-28 — Actionable lesson guidance
- Story pages now offer a next-step card that scrolls and moves keyboard focus to unfinished clues, plans, explanations, or quick checks; it disappears when the scene is complete.
- Changed exchange plans clear stale success styling.
- 374 unit checks and story, trade, route mocked browser suites passed. Expanded trade checks cover guidance focus and completion. No live reads or publication.


### 2026-10-28 — Lesson-to-quiz briefing
- Added visual question count, configured passing target and first-pass XP to the existing lesson recap. Missing XP is omitted; no artifact claim or additional reads.
- Clear Start Mission Quiz action and review/retry reassurance. Briefing clears during loading and topic review.
- 374 local checks and mocked story browser suite passed. Not published.


### 2026-10-28 — Quiz answer review polish
- Pre-submission journal shows question text, chosen answer text, answered count and review flags without exposing grading.
- Review cards return keyboard focus to the selected question; unanswered items have distinct borders and wording.
- 374 local checks and expanded mocked quiz browser checks passed. No additional reads or publication.


### 2026-10-28 — Practice completion topic cards
- Practice completion uses readable topic cards and encouraging first-try/another-attempt feedback, with lesson links preserving chapter, mission, and topic.
- Practice-goal notes are limited to the current mission. No mastery or mission-completion claim is added.
- 374 local checks and the existing mocked adaptive-practice browser suite passed. No live reads or publication; visual review remains pending.


### 2026-10-28 — Configurable chronological era progression
- Added Firestore era requiredChapterIds checks to Explore, Home, My Journey and direct learning access. Locked eras remain previewable with authored explanations.
- Preserved completed chapter and individual mission review; unfinished work and locked-era drafts cannot skip prerequisites.
- Prepared guarded data/era-progression-migration.json and functions/apply-era-progression.cjs: cumulative era requirements and required prologue. Not executed; live behavior awaits configuration and code publication.
- 381 local unit checks passed; expanded Explore, Home and My Journey mocked browser suites passed. Syntax and scoped whitespace checks passed. No live Firestore access. See docs/era-progression.md.


### 2026-10-28 — Live era prerequisites activated for published eras
- Full guarded dry run stopped at missing Chapter 6. Live Eras 3 and 4 are also absent.
- Existing-era dry run passed; applied three guarded updates (Eras 1/2 and required prologue) atomically. Backup: backups/era-progression-1793173999503.json.
- Corrected empty-array REST comparison after successful commit; repeated application reported zero changes and verified all fields.
- Authenticated live era-access test passed for locked/partial/unlocked states and completed-mission review using temporary seeded progress. Temporary account and records removed.
- Added local rollout-selection and empty-array regression checks. No Hosting deployment. Remaining eras await curriculum publication.


### 2026-10-28 — Chapter 5 prerequisites and full Chapter 6 published
- Published Chapter 5 Missions 3/4 and challenge, then Chapter 6 Missions 1–4 and challenge; all guarded preflights, backups, atomic commits and readback checks passed.
- Fixed obsolete release-status text in new recaps and two older Chapter 5 scenes. Final correction backup: backups/chapter5-published-recap-1793187547143.json.
- 383 local non-emulator checks and eight chapter browser suites passed before publication.
- Live temporary-account access check passed for Chapter 5 ? 6 continuation and sequential missions; temporary account and records removed. This used seeded completion evidence, not a full grading walkthrough.
- Hosting not deployed. Chapters 7+ and Eras 3/4 remain unpublished. See docs/chapter6-publication.md.


### 2026-10-28 — Chapters 7–14 and all era locks published
- Published 44 releases in prerequisite order, each with guarded dry run, backup, atomic commit and field readback. Report: docs/validation/chapters7-14-publication-live.json.
- Added eight chapters, 36 missions, 216 scenes, 360 quiz and 360 practice questions, 36 artifacts, eight challenges and eight badges; corrected outdated recap availability wording.
- Applied remaining Era 3/4 prerequisites and final era descriptions; readback passed.
- 383 local checks, the offline publication-chain audit and all 44 chapter browser suites passed before publication.
- Live temporary-student test confirmed four eras, Chapters 1–14, era gates/unlocking and Chapter 14 order. Seeded test completion records and temporary account removed. Full gameplay and independent curriculum review remain pending.
- Hosting not deployed. See docs/chapters7-14-publication.md; use Refresh Learning Content in Live Server.


### 2026-10-28 — Provisional Grade 5 curriculum coverage audit
- Compared the local authored roadmap with the inspected August 2023 MATATAG Grade 5 section; school-specific baseline still needs confirmation. Official PDF returned 403; inspected a public copy of the DepEd-authored guide.
- 26 editorial rows: nine mapped, fourteen partial, three without a dedicated sequence. Mapped does not certify instructional adequacy.
- Main gaps: middle-class contributions, parish reform and Propaganda Movement teaching; selected GOMBURZA/La Solidaridad scenes exist but need fuller context.
- Added reproducible offline scene/question evidence index and suggested learning activities. All referenced missions/scenes/main banks resolve. No live reads or writes.
- Keep four eras; propose improving final-era depth and learner-created evidence before claiming full curriculum coverage. See docs/grade5-curriculum-coverage.md.


### 2026-10-28 — Temporary local exploration mode
- Live Server on localhost/127.0.0.1 defaults to all-published-lessons preview; bottom bar restores normal locks per tab. Hosted behavior and Firestore prerequisites are unchanged.
- Explore, mission paths, My Journey and direct activity access honor preview. Account and published-content validation remain.
- Preview mission/challenge grading does not save completion or rewards. Practice completion is excluded from history, lesson-review events are not recorded, and drafts use separate tab storage.
- Optional journal and Daily Challenge retain normal behavior. See docs/student-exploration-preview.md.
- Expanded local preview checks verify host restrictions, restore toggle, isolated drafts, access, grading without writes, result wording and unlocked paths. Normal six browser suites passed; affected suites also passed with preview scenarios.


### 2026-10-28 — MATATAG Chapter 15 first investigation published
- User confirmed MATATAG Grade 5. Added Trade, Travel and the Sharing of Ideas as a new chapter within Era 4, preserving earned Chapter 14 records.
- Six scenes and labelled diagrams; fictional museum route task requires clues, an appropriate 1870 water link and explanation. Sources separate Iloilo 1855, Suez 1869 and Madrid study 1882.
- Five quiz topics, ten main variants, ten easy/hard practice items, one mission artifact. Chapter 15 remains partial with no final challenge or badge yet.
- 392 local checks, the publication-chain audit and new story browser suite passed; publication guards, backup and field readback passed. Backup: backups/chapter15-mission1-1793190674942.json.
- Updated provisional audit: nine mapped, fifteen partial, two missing sequences. Middle-class contribution coverage remains partial.
- Preview mode remains on for the user’s testing; no learner changes or Hosting deployment. See docs/chapter15-mission1.md.


### 2026-10-28 — Chapter 15 Mission 2 and contribution exhibit
- Published the emerging-middle-class/public-participation mission: six illustrated scenes, five quiz topics, ten main variants, ten practice items and mission artifact. Existing earned records preserved; chapter remains partial.
- Added Firestore-driven exhibit matching with clue gates, wrong/right feedback, required explanation, revision and partial/confirmed draft recovery.
- 399 local checks passed. New mission browser and desktop/narrow exhibit tests passed; existing story/trade/route/Mission 1 checks passed. Desktop exhibit visually inspected.
- Publication dry run, guards, atomic commit and all-field readback passed. Backup: backups/chapter15-mission2-1793191675812.json. No learner writes or Hosting deployment.
- Preview mode remains active for personal exploration. See docs/chapter15-mission2.md.


### 2026-10-28 — Chapter 15 Mission 3 parish-reform case published
- Added six illustrated scenes on parish roles, clergy terms, Pedro Pelaez and reform requests; dated advocacy is kept separate from later 1872 events.
- Reused the exhibit mechanic as a role/concern/request board with authored labels. Added ten main variants, ten practice items and mission artifact; no chapter badge or learner changes.
- 403 local checks, the publication audit, mission browser and desktop/narrow board checks passed. Desktop board visually inspected.
- Publication guards, backup, atomic commit and all-field readback passed. Backup: backups/chapter15-mission3-1793192276817.json. Hosting not deployed; preview remains active.
- Provisional coverage review now has ten mapped, fifteen partial and one missing dedicated sequence. Mapping does not certify learning effectiveness. See docs/chapter15-mission3.md.


### 2026-10-28 - Chapter 15 Mission 4 Cavite/GOMBURZA published
- Six illustrated scenes separate the January event, the three priests, accusations, February execution and later remembrance. An event/claim/response case board requires clues, matching and explanation; it resumes after refresh.
- Added ten main variants, ten easy/hard practice items and mission artifact. Chapter remains partial, with no challenge or badge. Preview remains active.
- 407 local checks, publication-chain audit, mission browser and desktop/narrow case-board checks passed. Desktop board visually inspected.
- Guarded atomic publication and every-field readback passed. Backup: backups/chapter15-mission4-1793192942243.json. No learner writes or Hosting deployment.
- Q4.5 remains partial pending fuller comparison of causes/accounts; teacher and Grade 5 review pending. See docs/chapter15-mission4.md.

### 2026-10-28 - Dedicated era overview and chapter trail
- Explore era cards now link to era.html?era=ID, with a large banner, Firestore description, optional period/goals/artwork, field guide, chapter progress and next/review chapter action.
- Preserved era/chapter prerequisites, completed review and temporary exploration preview. Chapter Back link returns to its era using loaded Firestore data.
- Existing instructional cache and scoped queries retained; initial chapter progress reused. No new curriculum documents, learner writes or migration required.
- 407 local checks and existing chapter/mission browser checks passed. New era browser passed desktop and 390px layouts, including direct links, safe copy, locks, preview, retry and sign-out. Visual review and narrow sizing fix completed.
- No Hosting deployment; live account acceptance testing remains pending. See docs/era-overview.md.

### 2026-10-28 - Cavite causes/accounts enrichment published
- Updated Chapter 15 Mission 4 scenes 1, 3 and 6, with a source-comparison board and two new diagrams. Named Plauchut/Izquierdo summaries distinguish grievance, extent, planning and proof.
- Revised two main variants and two practice questions under the existing topic; quiz count, progression, rewards and learner records preserved.
- 411 local checks and six-scene/browser board checks passed, including desktop/narrow layout and refresh recovery. Desktop board visually inspected.
- Eight guarded updates committed and every field read back. Backup: backups/cavite-accounts-1793194091853.json. Original creation plan retained; audit overlays the revision.
- Q4.5 provisionally mapped: eleven mapped, fourteen partial, one missing sequence. Historical/teacher/Grade 5 review pending; Chapter 15 challenge/badge still pending. Preview remains active. See docs/cavite-accounts.md.

### 2026-10-28 - Chapter 15 Mission 5 reform voices published
- Six illustrated scenes teach reform goals, La Solidaridad, contributor roles and La Liga Filipina; an interactive field guide distinguishes publication, association and evidence of results.
- Ten main variants, ten easy/hard practice items and one mission artifact added. Normal access requires owned prior completions; preview remains active. Chapter challenge and badge still pending.
- 415 local checks, publication audit, mission browser and desktop/narrow field-guide checks passed. Desktop visually inspected.
- Guarded atomic publication and all-field readback passed for 31 curriculum documents. Backup: backups/chapter15-mission5-1793194771675.json. No learner writes or Hosting deployment.
- Q4.6/Q4.7 provisionally mapped; thirteen mapped, thirteen partial, no wholly missing sequences. Historical/teacher/Grade 5 comprehension review remains pending. See docs/chapter15-mission5.md.

### 2026-10-28 - Chapter 15 evidence challenge and badge published
- Added Connections and Reform Evidence Challenge: five two-part clue/conclusion activities and five matching tasks, covering all five missions. Pass is 7/10.
- Existing own-mission gating, draft recovery, retry and review retained. History Connections Investigator badge is awarded once; chapter XP is zero. Preview remains active for testing.
- 418 local checks and publication audit passed. Authored challenge browser verified mission gate, evidence grading, saved drafts, 60% fail/70% pass, once-only badge and honest next-content fallback.
- Fourteen curriculum changes committed atomically after eighteen prerequisite guards; every planned field read back. Backup: backups/chapter15-challenge-1793195078214.json. No learner writes or Hosting deployment.
- Chapter 15 now has five missions, final challenge and badge. Independent historical/teacher/Grade 5 review and live learner acceptance testing remain pending. See docs/chapter15-challenge.md.

### 2026-10-28 - Post-challenge continuation and read reduction
- After a saved challenge pass, continuation queries only current-era chapter metadata and the next candidate's active missions. No next candidate means no mission navigation lookup. Owned progress remains scoped to the current user.
- Final chapter and lookup failures offer Return to Era; legacy missing-era data falls back to Explore Chapters. Saved completion/rewards remain unchanged.
- 419 local checks passed. New continuation browser plus authored Chapter 15, legacy challenge and era overview browser checks passed, including query scopes, failure fallback, replay and session recovery.
- Frontend-only change: no database migration or Hosting deployment. Exploration preview remains active. See docs/chapter-completion-navigation.md.

### 2026-10-28 - Completed journey learning hub
- Home and My Journey now show owned completed chapter/mission counts and a recently completed chapter after all available chapters are finished.
- A saved review topic opens its story lesson first; otherwise the primary action revisits the latest era. Collection and chapter browsing remain available.
- Uses already loaded catalog and owned progress, with no extra Firestore reads or writes. Temporary exploration preview remains active.
- 421 local checks plus dashboard and My Journey browser checks passed. Hosting and live student acceptance testing remain pending. See docs/completed-journey.md.
- My Journey now expands the latest completed chapter when the path is finished and links each era heading to its overview. Completed-state browser checks passed; no new database reads or writes.
- Review cards now guide students from lesson scenes to targeted practice using saved review state, with lesson and quiz retry links still available. Adaptive practice browser and My Journey checks passed; no new Firestore reads or writes.
- My Journey review recommendations now query practice questions only for missions with owned quiz/practice history, instead of downloading the full bank. Browser scope check and 421 local checks passed; no migration or Hosting deployment.
- Home and My Journey now require the existing saved lesson-review event read before showing a review stage. If it fails, review guidance is unavailable with refresh while mission navigation remains usable. 422 local checks and My Journey browser checks passed; no new Firestore reads or writes.
- Home now shares one authenticated data load between its next-action card and review panel, avoiding duplicate initial catalog/history/question reads. Refresh Review reloads both panels; sign-out and stale-load guards remain. 423 local checks and dashboard/review browser checks passed. No migration or Hosting deployment.
- Home completed-mission count and journey now share their initial owner-scoped mission-progress snapshot. Count retry remains independent. 424 local checks and dashboard browser checks passed; no schema or rules change.
- Back/forward cache restoration now reloads the authenticated Home dashboard, keeping XP, level, mission/badge counts and review guidance in sync after a learning activity. 425 local checks and dashboard browser check passed.
- Home completed-mission total now counts distinct owned completed mission IDs, so duplicate progress records cannot inflate the counter. 426 local checks passed; no learner data changed.
- Home badge total now counts distinct owned badge IDs, consistent with Achievements ownership counts. 427 local checks passed; no learner data changed.
- Achievements refreshes badges and artifacts on browser back/forward cache return while retaining the open collection. Browser check verified both ownership reads, selection and stale-request protection; 427 local checks passed.
- Explore Chapters and era overview refresh saved chapter progress on browser back/forward cache return. Explore retains its selected era and reloads its trail; browser checks verified updated lock/unlock labels and existing era behavior. 427 local checks passed.
- Home Daily Challenge now queries only active Firestore challenge documents before applying its existing Philippine-date rotation. Inactive drafts no longer consume reads; the challenge and reward flow is unchanged. Daily Challenge browser and 427 local checks passed.
- Home hides the Daily Challenge reward row until an active question loads, including empty and error states. The empty state still offers a check/retry path. Browser checks cover empty catalog, recovery and reward visibility.
- Bounded read-only check of the original Firebase project confirmed Chapter 15, five missions, final challenge and badge remain active. The offline publication chain passed with 61 plans and no errors. This does not replace full live readback or student acceptance; see docs/validation/chapter15-bounded-live-2026-10-28.md.
- Authenticated temporary-student walkthrough opened all 15 numbered chapter entries plus the prologue and each first lesson in local preview. Chapter 15 quiz submission saved no learner rewards in preview. A normal-mode first mission pass saved authored XP/completion once; replay awarded no extra XP. All temporary accounts and owned test records were removed. See docs/validation/student-live-preview-and-progression-2026-10-28.md.
- The authenticated preview sweep also opened all 16 active chapter challenges and confirmed their start actions are available. The sweep created no completion, attempt, badge or XP reward; its temporary account and owned records were removed.
- A separate authenticated Chapter 15 preview run answered all ten clue/conclusion and matching activities, displayed the result, and confirmed no chapter completion, badge or XP write. Temporary account and owned records were removed; normal-mode rewards for other chapter challenges remain to be accepted live.
- A normal-mode temporary student completed all four prologue missions, then passed the ten-activity chapter challenge. XP matched authored mission rewards; the challenge saved one chapter completion and badge with no extra XP. The result action opened unlocked Chapter 1. Mission and challenge replays produced no duplicate XP, completion or badge. The temporary account and owned records were removed.
- Revalidated the complete prologue fail-to-recovery path on the original project with preview disabled only in the test tab: mapped scene review, saved targeted practice, five fresh quiz retry questions, all four lessons/missions and artifacts, full-score challenge, badge, Chapter 1 continuation, and replay reward protection passed. The temporary student and owned records were removed. See docs/validation/student-live-preview-and-progression-2026-10-28.md.
- Chapter 5 normal-mode live check passed all four lessons, mission quizzes, one-time XP/artifacts, ten chapter activities, one-time badge and replay protection. An additional fail-to-review-to-practice-to-fresh-retry check passed Mission 1, then Firestore HTTP 429 interrupted Mission 2 replay. Its temporary Auth account was removed; owned Firestore records still require guarded cleanup after quota recovery. Actual Chapter 6 result navigation and the interrupted recovery run remain pending. See docs/validation/chapter5-normal-progression-2026-10-29.md.
- Bayani AI New Chat now clears its conversation locally when connected, saving a Firestore settings read and keeping the chat available. An in-flight old reply cannot reappear after reset. Mocked browser check passed; real Gemini replies still require the provider and App Check setup in docs/bayani-ai-setup.md.
- While Firestore returns 429, live tests and cleanup remain paused. The Chapter 5 acceptance script now avoids full chapter/era/quiz catalog reads and reuses its authored question banks across replays. Local syntax passed; run its guarded cleanup first when quota recovers, then repeat the interrupted walkthrough.
- Home and My Journey now use the existing two-minute, tab-local instructional cache for chapters, eras, missions and chapter challenges. Owned progress, attempts, drafts, practice and review history remain freshly queried. Eight focused mocked checks passed, including owner scope and cached-catalog selection. No Firestore writes or Hosting deployment.
- Lesson access now reads the selected chapter document and only its era's chapters for ordering, while retaining fresh owned progress checks and the legacy missing-era fallback. Daily reward submission queries only active challenge documents, matching Home's existing selection. Twenty-six local access/reward checks passed; live Firestore remains paused at HTTP 429.
- My Journey and student My Class now share the existing short-lived tab cache for teaching catalogs. Membership, published assignments, owned completion, attempts and drafts are still read fresh. Both mocked browser flows passed, including prerequisites, review/resume actions, assignment access and stale-session handling. No live Firestore reads or writes were made.
- Reference-inspired navy/gold theme connected to 20 website pages, including student learning, account and public pages. Home has a four-chapter progress list derived from already loaded data; Daily Challenge and Bayani remain. Seven themed browser flows and 19 focused local checks passed. Desktop previews reviewed and narrow Home overflow corrected. No Firebase access or Hosting deployment; see docs/navy-gold-design.md.
