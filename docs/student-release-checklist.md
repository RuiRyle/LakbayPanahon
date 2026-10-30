# Student release checklist

Desktop Story follow-up: [Chapter 2–4 review](validation/chapters234-desktop-review-2026-10-30.md) fixed heading/trail/card alignment and website reduced-motion scrolling. The latest local package is `build/student-web-wGGfja/public` (429 files), not deployed. Fifty-eight candidate scenes, 13 focused tests and five browser scenarios pass within the recorded scope; live/human gates remain open.

Chapters 2–4 offline review: [55-topic candidate trace and four new worked-help drafts](chapters234-learning-review-current.md). The local packet is ready for adult review; 34 checks and core/40-scene Story fixtures pass. The new help is unpublished and has no network publication mode. Include it in future guarded publication planning alongside the two pending Chapter 2 batches; no Firebase requests occurred during this review.

Latest live status: [one bounded security/save retry](validation/student-live-security-retry-2026-10-30.md) again returned HTTP 429 before quiz submission. Cleanup succeeded; no further database attempts or publication followed. Live acceptance and the two Chapter 2 publications remain pending. The earlier administrator-only availability success does not establish learner availability.

Latest local follow-up: [shell/audio continuity and populated Home rows](validation/student-shell-audio-acceptance-2026-10-30.md). Twenty-five checks use real Web Audio and the actual shell with simulated child authentication; ten related unit checks pass. Actual listening and hosted/Auth acceptance remain open. No production code or Firebase changes.

Learning-flow follow-up: [clearer instructions and bounded local content trace](validation/student-learning-clarity-2026-10-30.md). Fifty-seven focused checks and three mocked browser fixtures pass for the current lesson/quiz/practice wording. Scoring and educational content are unchanged; earlier combined reports are prior regression evidence. Human learning review and live release gates remain open.

Settings keyboard/reload follow-up: [13 checks passed using native Chrome input and actual reloads](validation/student-settings-keyboard-reload-2026-10-30.md). Local Settings keyboard/reload acceptance is closed; real audio listening and signed-in playback continuity remain open. No Firebase or production code changes.

Desktop follow-up: [three fixes and bounded visual evidence](validation/student-desktop-acceptance-2026-10-30.md). Settings handles unavailable storage honestly, focus completion clears stale music status, and the Journey hero button has readable contrast. The latest [local report](validation/student-acceptance-local.json) records 281 passing unit checks and 12 browser fixtures with an explicit Story retry. Real listening, populated/hosted acceptance and the live/human gates remain pending.

**Acceptance baseline:** [fixed student pass/fail criteria](student-acceptance-checklist.md). That document defines implementation freeze, public release and later classroom integration separately. Use it to close existing work; the historical entries below do not create new feature requirements.

Latest acceptance audit: [281 passing local checks across 43 suites and 11 passing mocked Chrome fixtures](validation/student-acceptance-local.json), 30 October. One stale memory-review test was updated for the existing grouped action layout. Remaining desktop settings/audio, visual, live-data and human-review gates are explicit in the baseline. No Firebase access occurred during this audit.

Latest finish preparation (30 October): the user chose to keep local exploration preview and leave trusted grading and paid Bayani activation disabled. See the [current finish report](student-finish-preparation-2026-10-30.md). The combined suite passes 201 checks. Stronger grading is privately prepared but is not connected or active; student acceptance and two Chapter 2 drafts remain pending after HTTP 429. The local Bayani client now rejects Gemini/unknown/unapproved providers before SDK setup; hosted code and live settings were not changed. Operator/contact/retention/guardian decisions remain open.

Updated 30 October 2026. This is the current student completion tracker. Older dated implementation notes remain evidence, not additional requirements or current status. Teacher workflow stays outside this scope.

Latest local regression: [440 passing checks and nine core browser fixtures](validation/student-offline-regression-2026-10-29.md), with release/content inventories refreshed. No Firebase or emulator access.

Current Task 2 follow-up: the user selected **local Bayani preparation with paid activation disabled**. The optional backend/bridge is prepared; [57 focused checks and the mocked chat browser check passed](validation/bayani-backend-preparation-2026-10-29.md). This does not close provider eligibility or live response acceptance.

Current Task 3 follow-up: [family learning](chapter2-family-learning-review.md) and [a dated women-role case](chapter2-women-role-learning.md) have separate guarded local drafts. Both remain unpublished; the learning-adequacy and Grade 5 review items below stay open.

Current account-help follow-up: Settings now has **Account & Data Help**, with existing profile/journal/class actions and clear logout/reset explanations. Local browser layout, focus, disclosure and contrast checks passed. The user confirmed operator/contact/retention/school arrangements are undecided; copy/deletion requests remain unavailable. This is a help interface, not a finalized privacy policy or request-handling process. See [preparation and limits](student-access-privacy-audit.md#account--data-help-preparation--30-october-2026).

Current security follow-up: [URL access and result consistency hardening](student-security-hardening-2026-10-30.md) passed 92 local checks, six offline Chrome fixtures and 32 server Rules API cases. Three reviewed rule blocks are published and read back; frontend guard/replay changes remain local. The bounded live quiz-save check stopped at Firestore HTTP 429; its temporary account and records were removed. Complete that scoped check after quota recovery. Browser grading/answer-key/progression trust limits remain; this is not complete anti-cheating or security acceptance.

## Where we stand

Core student features are implemented. The reviewed Firestore queue is published and the specifically interrupted recovery slice now passes. The student side is not yet release-verified: privacy/account-data handling, security acceptance, Bayani provider eligibility and response review, learning/comprehension review, completion of personal exploration and public deployment remain. No defensible completion percentage is assigned.

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Lesson → quiz → review → practice → retry | Implemented; earlier walkthrough evidence plus the bounded recovery tail now passing | Do not repeat the general walkthrough without a new reason. The tail used explicitly seeded prior mission completions, not a new whole-project walkthrough. |
| Progression, XP, artifacts and badges | One-time reward and prerequisite checks recorded locally and in bounded live checks | Confirm normal locks after personal local exploration; browser grading limits still apply. |
| Home, Journey, Class, collections and profile | Implemented; local recovery/session checks | Review actual long content and dialogs as needed; teacher-side creation is outside this release scope. |
| Navy/gold UI and accessibility | Local layout, contrast, keyboard-skip, menu and profile-focus checks passed | These are fixtures, not a full accessibility certification or Grade 5 comprehension study. |
| Student privacy and access | Bounded source audit found no confirmed cross-account or role-escalation bypass. Remember me and logout cleanup fixed locally; ten focused checks and registration browser recovery pass | Finalize accessible notices, actual operator/contact/retention details and an account-data request process. No complete security or privacy signoff. See [audit](student-access-privacy-audit.md). |
| Bayani connection | User supplied an earlier reply; instructions are published. An opt-in Anthropic backend/bridge is now locally prepared and tested, with activation explicitly deferred | Existing Gemini suitability remains unresolved. The new route needs an eligible account, hosting, privacy/content safeguards and real acceptance before learner rollout. See [preparation guide](bayani-backend-preparation.md). |
| Curriculum | Four eras and content through Chapter 15 recorded published; local candidate has 66 missions, 388 scenes and 330 topic slots | Candidate image/mapping coverage is not proof of current Firestore metadata, deployment or teaching accuracy. |

## Ordered finish list

- [ ] **Close student privacy and access acceptance before release.** The [bounded audit](student-access-privacy-audit.md) fixed ignored sign-in persistence and leftover tab-local learning keys. Finalize real operator/contact/retention details, publish readable notices and provide an account-data assistance process. Current source review is not a new evaluation of deployed rules; browser assessment trust limits remain. Do not mark this complete based on local authentication tests.

- [x] **1. Resolve pending temporary test cleanup.** On 29 October the owner-checked procedure removed 19 leftover owned Firestore test documents and its recovery file. The earlier Auth deletion remains recorded. No new test account was created. See [Chapter 5 validation](validation/chapter5-normal-progression-2026-10-29.md).
- [x] **2. Compare and publish the reviewed content queue.** Twelve remaining batches were published and read back on 29 October, with per-batch backups. Chapter 5's old guard was reconciled to its known published recap before applying. See [publication evidence](student-publication-2026-10-29.md). No unrelated historical migration was replayed.
- [ ] **3. Resolve Bayani's provider suitability, then review responses.** The [backend/bridge preparation](bayani-backend-preparation.md) is locally implemented and tested. The user explicitly chose local preparation with paid activation disabled; no live provider or billing change occurred. Under-13 use, privacy, content safeguards, account/hosting and real acceptance remain unresolved. Gemini's standard terms exclude this audience; a successful connection or changed prompt does not remove that restriction. After those decisions, use the [response review](bayani-response-review.md).
- [x] **4. Resolve the interrupted acceptance gap.** A bounded authenticated tail passed Mission 2 replay, offline/reconnected/slow-save recovery, the ten-task Chapter 5 challenge and the actual Chapter 6 result action under normal locks. Full browser refresh retained Chapter 6. Prior mission completions were explicit fixture state; all temporary records were cleaned. See [implementation and evidence](student-chapter-continuation-recovery.md). The user's general walkthrough remains separate evidence.
- [ ] **5. Review learning adequacy.** The existing MATATAG evidence review labels 13 of 26 areas mapped and 13 partial. A [seven-record Chapter 2 family knowledge draft](chapter2-family-learning-review.md) now improves one lesson-to-retry sequence locally; it is unpublished and needs teacher/history and Grade 5 comprehension review. Continue checking lesson explanations, quiz reasoning and image relevance. Do not promote structural checks to curriculum approval. See [curriculum review](grade5-curriculum-coverage.md) and [current content review](student-content-review-current.md).
- [ ] **6. Check Grade 5 comprehension.** Use the prepared [supervised playtest plan](validation/grade5-student-playtest-plan.md). No child study has been conducted. Keep adult developer acceptance distinct from learner comprehension.
- [ ] **7. Finish local exploration and verify normal learning mode.** User controls when exploration testing ends. Local preview defaults on for localhost only and does not save quiz/challenge rewards. The preview bar's Restore normal locks button disables it in that tab. Hosted pages already use normal mode. Do not remove the user's preview early.
- [ ] **8. Review the prepared deployment package.** Root `firebase.json` has no Hosting target. The [local file inventory](web-release-inventory.md) covers 23 entry pages and 429 files with no missing/rejected static references. `build/student-web-wGGfja/public` is the latest recorded hash-verified package; its sibling configuration proposes Hosting headers and a destination without changing root deployment settings. Private backend files remain excluded. Actual destination and authenticated-page header compatibility need review; regenerate after frontend edits. Do not deploy Cloud Functions on this free-plan implementation.
- [ ] **9. Publish the reviewed website and perform bounded release checks.** Frontend changes are currently local. Verify authentication, one learning entry, recovery visibility and published assets against the actual hosted build; use existing acceptance evidence to avoid unnecessary live reads.

## Prepared publication queue

Offline queue compatibility review passed for the listed scoped curriculum drafts plus one Bayani instruction field, with no overlapping queued fields or changed practice-evidence policy. See `docs/validation/student-publication-queue-local.json`. Reading drafts expect the social-role, beliefs and Islam-exchange lesson revisions; these must be compared with live state before publishing. Do not republish full prerequisite plans automatically.

After quota recovery, Mission 1 beginner coaching and all twelve remaining reviewed batches were published and read back. This covers Bayani instructions, the listed lesson/feedback/practice improvements and fifteen image metadata repairs. The image files and current frontend still require normal public website deployment. See [the exact publication record](student-publication-2026-10-29.md). Do not rerun unrelated historical migrations.

| Change | State | Guarded entry point |
| --- | --- | --- |
| Mission 1 beginner-practice coaching | Published and read back: four new easy questions plus existing easy datu feedback; nine focused local checks passed; learner comprehension remains pending | `functions/apply-chapter1-mission1-practice-polish.cjs` handles only these five targets. See [publication evidence](chapter1-mission1-practice-polish.md). |
| Chapter 1 Mission 1 learning clarity | Published and read back: six scenes, ten questions and four option wording repairs | [Review and draft-reset implications](chapter1-mission1-learning-polish.md). |
| Bayani Grade 5 teaching instructions | Published and read back; provider eligibility and actual-response review pending | Resolve the [provider decision](bayani-provider-options.md) before the [response checks](bayani-response-review.md). |
| Three Chapter 2 beginner practice items | Published and read back, with selected-choice hints and corrected apostrophes | `functions/apply-chapter2-beginner-practice.cjs`. |
| Six Chapter 2 main/retry feedback improvements | Published and read back | `functions/apply-chapter2-feedback-polish.cjs`. |
| Three shorter Chapter 2 scene bodies | Published and read back | `functions/apply-chapter2-reading-polish.cjs`. |
| Harvest-ritual duplicate answer choice | Published and read back; correct answer preserved | `functions/apply-chapter2-scene-quality.cjs`. |
| Three Chapter 3 scene decisions | Published and read back; correct answers preserved | `functions/apply-chapter3-decision-quality.cjs`. |
| Three Chapter 4 scenes | Published and read back | `functions/apply-chapter4-learning-polish.cjs`. |
| Two Chapter 5 mission endings | Published and read back after exact-source guard reconciliation | `functions/apply-chapter5-continuation-wording.cjs`. |
| Two Chapter 6 worked-help updates | Published and read back | `functions/apply-chapter6-help-polish.cjs`. |
| Earlier easy-review items and 15 image repairs | The two remaining Mission 2 items and all 15 image metadata repairs are published and read back. Four Mission 1 items were superseded by published coaching | Use the scoped `apply-mission2-easy-review.cjs`; do not rerun the old six-item plan. Image assets still need public website deployment. |

The candidate audit includes the prepared practice/image revisions. Its zero structural gaps does not mean the live database has zero gaps. A publication guard failure requires reconciliation, not removal of the guard.

## Accepted implementation limits

The user selected Firestore/browser grading on the free plan. Rules provide record/reward constraints, but a modified browser can submit a claimed quiz score; this is not server-verified assessment. Preserve this limit in project reporting. See [security implementation](../STUDENT-SECURITY-ROLLOUT.md).

AI instructions guide behavior and cannot guarantee subject restriction, historical accuracy or child safety. Resolve provider audience eligibility before learner rollout, then review actual responses and retain clear limitations. Do not claim the chatbot sees saved scores or grants rewards. Local chat clearing does not imply provider-side deletion.

Bayani's latest provider-independent verification passed six unit checks and the mocked browser fixture, including deadline recovery and stale reply isolation. See [local evidence](validation/bayani-reliability-2026-10-29.md). These checks do not replace actual provider response review.

## Completion rule

Call the student side complete only when the applicable ordered items have recorded outcomes, the intended content/frontend is published, and remaining implementation limits are explicitly accepted. Do not add new mechanics to compensate for unfinished release checks. If an item is deferred, record the actual scope decision rather than marking it passed.
