# Priority 3: Reward and progress protection audit

Reviewed 7 November 2026. **Audit only. No application fixes, deployment, security-rule changes, live writes, test-account creation, or existing learner-record changes were performed. Priority 4 was not started.** New files are audit tests, logs, source/configuration copies for local emulation, and this report.

## Assessment

The normal browser reward flow protects against duplicate XP and partial saves in the tested cases. However, the active Firestore rules do not establish that mission/chapter assessment requirements were actually met. A modified client can submit internally consistent completion claims that bypass learning prerequisites and grading. This is a confirmed production-rule enforcement gap, not a demonstrated compromise of any actual student account.

There is also a confirmed compatibility defect in the alternate callable reward module: it grades the entire active question bank rather than the selected mission question set. The current browser does not call that module, so this is an alternate-path/activation issue rather than an explanation for duplicate XP in the current interface.

## How rewards currently work

### Active browser path

`js/quiz.js`, `js/chapter-challenge.js`, and `js/daily-challenge.js` import `submitStudentActivity` from `js/student-rewards-client.js`. They do not invoke the similarly named callable in `functions/student-rewards.js`.

The browser module:

1. Checks the signed-in student and activity kind. Mission/chapter access goes through `js/learning-access.js`.
2. Loads the active catalog and grades against the existing answers. Missions validate the selected set against the configured question count and topic quotas. Chapter challenges require all active chapter missions. Daily challenges use the Philippines learning date and the existing rotation.
3. Uses the configured passing threshold. Mission follow-up checks provide separate review evidence without changing the main score.
4. Reads the profile, progression policy, existing attempt, completion, and ownership in a Firestore transaction before writing.
5. On a first passing completion, creates completion and adds the configured mission/daily XP. Chapter challenge completion awards its badge without mission/daily XP. Failed mission attempts are saved without creating completion or awarding XP; failed chapter/daily answers do not create rewards.
6. Creates artifact/badge ownership only if absent. Existing completion retries can backfill a missing active collectible without paying XP again.
7. Uses stable completion IDs (`uid_missionId`, `uid_chapterId`, `uid_dateKey`), ownership IDs (`uid_catalogId`), and mission attempt IDs (`uid_attemptUUID`). These records are separate from unfinished learning drafts.

The transaction reads the profile as well as the completion. Concurrent submissions therefore contend on the shared XP/profile state and re-evaluate the completion when retried. Tests confirmed both duplicate-request protection and addition of rewards from two independent eligible missions without a lost increment.

On a mission replay, the client compares the saved attempt with the current grading result, completion, and reward evidence. It returns current total XP and calculated level without paying again. A replay may repeat the original `xpReward` receipt in its response; that field must not be interpreted as a new credit. The stored profile balance is the authority for the total.

### Levels and cosmetic rewards

`js/progression-policy.js` and `functions/progression-policy.js` use `floor(xp / xpPerLevel) + 1`. Missing/invalid settings fail rather than inventing a new rule. The live policy read during this audit is **100 XP per level, version 1**.

The dashboard derives level/progress from XP and policy. `js/level-rewards.js` listens to saved profile/cosmetic records, ignores pending writes, and uses the profile's stored level for explorer frame eligibility. Session storage controls celebration memory, not earned XP or ownership.

### Ownership and progress displays

`js/achievements.js` queries the current user's saved ownership, deduplicates catalog IDs, and loads the associated catalog details. Missing/unavailable details do not delete ownership or falsely convert the collection into an empty one. Request/session guards prevent late responses from restoring another session's display.

`js/journey-path.js`, `js/learning-access.js`, and the journey/home modules derive access from owned mission/chapter completion records, active content, chapter order, and era requirements. Drafts alone cannot unlock missions. Successfully persisted completions remain separate from draft cleanup and survive refreshes.

### Alternate server paths

`functions/index.js` exports the legacy callable built by `functions/student-rewards.js`. It grades on the server, checks ordering, and uses Admin transactions, but is not the browser's active submission path. Its deployment state was not tested by calling it against production.

The separate `server/assessment` implementation has its own trusted-assessment tests. Passing those tests does not establish that the deployed browser uses that implementation. No trusted-mode activation, private-key migration, or security rollout was performed.

## Confirmed findings

### P3-1: Mission completion, XP, and unlocking can be claimed without assessment/prerequisite evidence

**Severity: high. Active production-rule enforcement gap.**

**Affected files:** `firestore.rules`, particularly `validMission`, `validCompletion`, `pairedReward`, `rewardUpdate`, and `validAttempt`; `js/student-rewards-client.js` and `js/learning-access.js` contain the checks that the modified client bypasses.

The rules constrain owner, document ID, active mission/chapter/quiz, claimed score range/threshold, exact configured XP, timestamp, and paired profile update. They do **not** require a graded canonical quiz attempt to create mission completion, verify answers, or establish mission/chapter/era prerequisites. The attempt rules also validate claimed score arithmetic rather than grading the answers. Merely requiring a client-written attempt would therefore not close the grading gap.

**Isolated reproduction against the exact active production rules:** a synthetic active student with 0 XP and no first-mission completion submitted a consistent claim for the second, locked mission and a paired profile increase of its configured 30 XP. The rules accepted it. There was no quiz attempt document and no prerequisite completion.

**Effect:** an owner can obtain configured XP and misleading mission completion for eligible active catalog entries without the intended learning/quiz flow. Downstream access and reports trust those completions. This is not evidence that arbitrary XP amounts, cross-user writes, or repeated payment for the same immutable completion are allowed; those are separate protections.

**Recommended correction, pending approval:** establish a trusted assessment/completion authority, preserve existing reward values and stable IDs, and deny direct student creation of canonical XP/completion results after the compatible submission path is ready. Enforce the existing prerequisites and selected-question grading at that authority and write XP/progress/attempt/ownership atomically. Reusing the existing server implementations requires resolving P3-3 and their record-contract differences first. A client-only check or an attempt-presence check is insufficient.

### P3-2: Chapter completion and badges can be claimed without completed missions or challenge answers

**Severity: high. Active production-rule enforcement gap.**

**Affected files:** `firestore.rules`, `validChapter` and `validBadge`; browser enforcement is in `js/student-rewards-client.js` and `js/chapter-challenge.js`.

`validChapter` accepts an active chapter/challenge with a claimed passing `bestScore`. It does not verify all chapter missions or grade the challenge. `validBadge` trusts the resulting chapter completion. The normal interface performs those checks, but the rules do not make them authoritative.

**Isolated reproduction:** the same synthetic student, with zero mission completion records, created a structurally valid chapter completion plus its badge in one request. The exact production rules accepted both. No challenge answer evidence was submitted.

**Effect:** an owner can claim a chapter badge and advance chapter/era prerequisites without completing the intended work. Previously earned ownership is not deleted by this issue.

**Recommended correction, pending approval:** apply the same trusted-result boundary as P3-1 to chapter completion and collectible ownership, checking the existing mission prerequisites and challenge grade. Preserve existing ownership records and badge requirements. Do not rewrite or reset learner history as part of this correction.

### P3-3: Alternate callable does not support the current selected mission question set

**Severity: medium, alternate-path compatibility defect. Not the active browser reward path.**

**Affected files:** `functions/student-rewards.js`, the mission question query near line 429 and `grade`; compare with selected-set validation in `js/student-rewards-client.js` and `js/mission-assessment.js`.

The callable loads all active questions for the quiz and requires an answer for every loaded question. It does not use the configured five-question selection/blueprint or the caller's selected IDs. Current missions can have larger retry/difficulty banks.

**Isolated reproduction:** a five-question policy with ten active bank questions received a valid five-question selected submission. The callable rejected it with `Answer every question`; no XP was written.

**Effect:** switching the current browser to this callable without adaptation would reject legitimate selected-set submissions, preventing completion/reward saves. It does not cause this failure in the current browser, which uses the client module.

**Recommended correction, pending approval:** align the alternate server contract with the existing selected-set count/topic validation and existing retry policy before considering activation. Align canonical attempt/completion fields as well: the callable currently uses an answer fingerprint and a different attempt shape, while the browser expects selected IDs/answers and mission completion XP evidence. Do not blindly change the browser import or deploy this callable as a drop-in replacement.

## Risks and limitations, not additional established production incidents

- Daily rules validate the Philippines date, an active challenge, its answer, and its configured reward, but do not independently establish the intended rotation. This should be included in a future trusted-boundary review; no separate live or emulator exploit was performed for it here.
- If the progression policy changes without reconciling stored levels, dashboard-derived levels and stored-level cosmetic eligibility can diverge. No policy change was made, and current learner balances/levels were not inspected. This is a conditional consistency risk, not a confirmed current learner mismatch.
- The browser treats an existing completion document as already rewarded. An old/corrupt document with `completed:false` could block first completion rather than being repaired. Current normal rules create only completed records; no such production records were sought or found in this audit.
- Catalog reads/access checks occur before the reward transaction. A simultaneous administrator catalog/prerequisite change could cause rejection or disagreement with the earlier UI check. Immutable ordinary-student completion records reduce this race in the normal flow. No production administrative race was induced.
- Current public question reads expose answer keys to the browser. Trusted grading can establish the submitted result and reward consistency; it does not by itself prove that a student answered without consulting public keys.
- Missing/inactive catalog details can hide a collectible card while ownership remains saved. The collection UI explicitly distinguishes that from no earned records.
- The alternate callable and browser are not interchangeable just because both functions are named `submitStudentActivity`. Deployed callable availability, production concurrency load, and malformed legacy record prevalence remain unverified.

## Production source and catalog checks

Only read-only metadata/public assets and educational catalog metadata were read. No student profile, progress, ownership, attempt, or Auth account was read or changed in production.

The public production versions of `student-rewards-client.js`, `progression-policy.js`, `achievements.js`, `learning-access.js`, and `level-rewards.js` match the audited local source hashes.

Active production ruleset: `7b56c656-fb38-44a3-9b69-38942be9a8c3`, source SHA-256 `678be315fa0aecdbb09fc3cb88294c0f69493056e8c50389a254500234ac0496`.

The working tree's rules differ from production by pre-existing teacher-publication absent-document read checks. The reward sections are the same, but the security reproductions were nevertheless rerun against an exact hash-verified production rules copy in the local emulator. The original working-tree rules were not edited or published.

Live catalog-only coverage: **66 active missions, 66 artifacts, 16 active chapters, 16 badges**. Every active mission has exactly one active artifact; every active chapter has exactly one active badge. Mission XP values passed nonnegative safe-integer checks. The initially consulted dated learning snapshot omits collectible collections, so it was not used to claim missing rewards; live catalog metadata resolved that limitation.

## Test results

### Focused existing unit suite

```text
node --test tests/mission-flow.test.cjs tests/progression.test.cjs tests/level-rewards.test.cjs tests/journey-path.test.cjs tests/era-progression.test.cjs tests/daily-policy.test.cjs tests/trusted-assessment.test.cjs
```

**51 passed, zero failures.** Covers configured grading/reward boundaries, failed/successful/replayed attempts, forged replay displays, current XP/level output, daily dates, owned progress, prerequisites, cosmetics, and the separate trusted-assessment implementation. Trusted-assessment success is not treated as evidence of its production activation.

### New isolated reward/security reproductions

```text
firebase.cmd emulators:exec --only firestore --project demo-lakbaypanahon --config build/priority3-audit/firebase.json "node --test tests/priority3-reward-audit-emulator.cjs"
```

**9 passed, zero failures against an exact active-production-rules copy.** Three tests intentionally assert the confirmed defects, so their passing result means the defect is reproducible, not corrected.

Coverage:

- Claimed locked mission/XP without an attempt or prerequisite.
- Claimed chapter/badge without completed missions or challenge evidence.
- Same-attempt and distinct-attempt simultaneous submissions award one mission reward/artifact.
- Failed attempt followed by success, reopening, and replay preserves XP/completion.
- Lost acknowledgement after commit: reopening/replay does not duplicate rewards.
- Alternate callable rejects the valid selected five-question submission.
- Two independently accessible missions completed concurrently retain both rewards (25 + 40 = 65 XP).
- Disconnect before commit leaves no completion, ownership, attempt, or XP; retry awards once.
- Failure after completion does not undo saved progress; a missing artifact backfills without additional XP; concurrent chapter submissions yield one badge and no chapter XP.

All emulator writes were confined to `demo-lakbaypanahon` at `127.0.0.1:8180`. The tests reject other hosts; emulator processes were stopped. Synthetic question text is test data only, not new platform educational content.

### Existing legacy security suite

```text
firebase.cmd emulators:exec --only firestore --project demo-lakbaypanahon --config firebase.security-tests.json "node --test tests/student-security.test.cjs"
```

**16 tests: 6 passed, 10 failed. This suite is not green.**

Failure causes were inspected rather than counted as new reward defects:

- Four browser-module fixtures omit newly required imports, beginning with `learningDateKey`.
- Four mission/callable cases omit the now-required valid attempt UUID; one expects a later lock error but fails earlier validation.
- One daily case omits the required progression policy.
- One profile/avatar case expects catalog-backed avatars to save without seeding the avatar catalog; the emulator denies the request. This fixture also logs rule-evaluation errors and is not useful proof that current profile updates work.

The suite's null REST encoding and old one-question quiz fixtures also need maintenance before it can serve as a reliable current release gate. Existing source/fixtures were not fixed during this audit. The new audit adapter loads current dependencies, uses a valid selected question set and UUIDs, and handles nulls, enabling the current reward paths to be tested independently.

### Browser fixtures

Passed unmodified:

```text
node tests/daily-challenge-browser.cjs
node tests/chapter-challenge-browser.cjs
node tests/mission-quiz-storage-browser.cjs
node tests/achievements-layout-browser.cjs
```

The layout fixture includes desktop/mobile collection/exhibit checks. Reward checks include saved daily completion, wrong/correct answers, chapter badge/replay, save retry without retake, restored quiz state, blocked storage, and delayed authentication responses.

Two older collection browser scripts failed unmodified with `Ownership count or detail dedup failed` because their stripped-module fixtures omit imported museum/pin/status helpers. In particular the missing `closeMuseumExhibit` interrupts the auth callback before loading ownership. They were **not silently counted as passing**.

The same assertions passed using the new audit-only dependency adapter:

```text
node tests/priority3-collection-audit.cjs student-artifacts-browser.cjs
node tests/priority3-collection-audit.cjs student-achievements-browser.cjs
```

Those runs verify ownership counts/deduplication, safe text, partial/missing details, retry, empty states, and account/request races. Museum/pin interactions are stubbed in that adapter; the newer layout fixture separately loads those dependencies. No original fixture or runtime source was modified.

## Audit artifacts

- `tests/priority3-reward-audit-emulator.cjs`: current-contract local reproductions and transaction checks.
- `tests/priority3-collection-audit.cjs`: explicit legacy browser dependency adapter.
- `docs/validation/priority-3-production-source-check-2026-11-07.json`: production asset/rule comparison.
- `docs/validation/priority-3-reward-catalog-2026-11-07.json`: read-only live catalog coverage and policy.
- `docs/validation/priority-3-production-rules-final-2026-11-07.log`: final nine-test emulator evidence.
- `docs/validation/priority-3-existing-security-suite-2026-11-07.log`: legacy suite failures.
- `build/priority3-audit/`: exact production rule copy and local-only emulator configuration, not a deployment package.

An initial audit adapter run failed because it reused the legacy REST helper's incorrect null encoding. The adapter was corrected, and all nine final reproductions passed. The initial PowerShell Firebase launcher was blocked by execution policy; using `firebase.cmd` resolved it without changing machine policy. Neither issue required an application change.

## Recommended approval scope

First review P3-1/P3-2 as one reward-authority boundary problem. Authorize a concrete compatibility/rollout design before any rules or deployment changes; do not assume adding a client guard can close it. P3-3 and canonical record compatibility must be addressed before routing current selected quizzes through the legacy callable. Maintain existing XP values, thresholds, badge requirements, document IDs, and earned records throughout any later correction.

Separately approve maintenance of stale security/browser fixtures so they can become reliable release gates. None of these corrections has been implemented.

Live multi-device mutation tests, production interruption injection, chapter-badge earning, and existing-account balance reconciliation were deliberately not performed under this read-only audit. Local emulation demonstrates the enforcement gaps and transaction behavior without risking live learner data. No claim is made that any student has exploited the gaps or that all historic records are accurate.

**Awaiting review and approval before corrections or Priority 4.**
