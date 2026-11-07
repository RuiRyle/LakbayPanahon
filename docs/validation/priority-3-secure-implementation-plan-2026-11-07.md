# Priority 3 secure reward implementation plan — local implementation approved

The user approved all six decisions for local implementation and Auth/Functions/Firestore emulator testing only. Production deployment, rule publication, billing/service activation, live writes, and Priority 4 remain unapproved. The planning text below records the approved design; implementation evidence is documented separately.

Planning only, 7 November 2026. No fixes, production changes, deployments, or Priority 4 work are authorized by this document. The next approval would authorize local implementation and emulator verification only; production activation would remain a separate reviewed step.

## Proposed architecture

Use the existing Firebase Functions codebase and Firestore transactions, with one shared server assessment service behind callable endpoints. Keep the normal student interface, educational catalog, XP amounts, thresholds, five-question mission count, topic quotas, difficulty steps, chapter challenges, and collectible rules.

The browser becomes a renderer and answer collector. It cannot authorize scores, completion, XP, ownership, question identities, or prerequisite satisfaction. Firebase Auth identifies the user; the service checks the active student profile. Enforce App Check after verifying the existing production web integration supports these calls. App Check supplements authentication and authorization; it is not evidence of a correct answer.

Preferred hosting is the existing Firebase Functions region `asia-southeast1`. Confirm billing/runtime/service-account readiness read-only before proposing activation. No billing upgrade, paid infrastructure activation, or new provider is included in local implementation approval. If the required environment is unavailable, report the blocker rather than falling back to browser rewards. A separately operated backend would require a revised approval, not an automatic substitution.

Do not blindly activate `server/assessment/core.mjs`: it already contains useful trusted issuance/transaction logic, but currently issues a static set, has separate policy/key/version dependencies, and can replace a legacy best score on verification. Those behaviors need adaptation to the present application. Extract/reuse compatible pure validation and grading rather than create two competing authorities.

## Current authority and required moves

| Operation | Current authority | Proposed authority |
|---|---|---|
| Selected questions, adaptive next question | Browser/catalog/history | Server-issued attempt and server-computed sequence |
| Correctness, score, pass/fail | Browser | Server using catalog answers, never submitted score |
| Mission/chapter/era access | Browser checks | Server rechecks at issue and submit |
| Chapter mission prerequisites | Browser | Transactional reads of saved canonical progress |
| XP, level, daily streak, completion | Browser transaction constrained by rules | Server transaction only |
| Artifact/badge eligibility and creation | Browser transaction | Same server transaction as completion |
| Progress and ownership display | Browser reads | Retain owner/approved-teacher reads |
| Drafts and non-reward practice | Browser-owned state | Retain existing rules and draft protections; never use them as trusted reward evidence |

Include daily reward creation in the authority boundary because it shares profile XP and canonical progress writes. Preserve its current rotation, one-per-Philippines-date rule, answer, reward, and streak policy. Leaving a parallel client XP writer would retain an alternate canonical reward authority. This is boundary consolidation, not a new daily feature.

## Server-issued attempts and adaptive compatibility

Proposed callable contract names below are implementation targets, not existing deployed endpoints:

1. `startStudentAssessment`: accept only activity identity and a client-generated idempotency request UUID. Derive UID from Auth. Validate student, active era/chapter/mission/quiz identity, prerequisites, policy, catalog shape and answer keys. Select the initial five-question set through the existing selection rules. Persist an owner-bound server attempt with selected IDs, current sequence, content digest, expiry/version metadata, and the server grading evidence. Repeated issuance requests return the same attempt rather than generating endless alternate sets.
2. `advanceStudentAssessment`: accept attempt ID, expected revision, and a selected answer or existing backtrack/reset action. Verify that the question belongs to that attempt and is currently answerable. Grade on the server, update weakness/difficulty evidence, and perform the same existing quota-preserving next-question swap. Changing an earlier answer clears later answers and follow-ups as it does today. Idempotent request IDs and revision checks prevent delayed answers from rewriting newer attempt state.
3. `submitStudentActivity`: accept attempt ID and expected revision, not client score/XP/completed flags or an arbitrary question list. Validate the final sequence and complete answers, recheck student/prerequisites/catalog revision, grade on the server, and atomically persist result and rewards. Repeated same submissions return the committed receipt with current profile totals; conflicting reuse is rejected.
4. Resume/read attempt capability: validate ownership and return only the student-safe attempt state. This may be a `resumeStudentAssessment` callable or an allowlisted action on the start endpoint; choose the smaller testable contract during implementation and document the final names.

The server can retain the full issued set internally to preserve the existing question navigation. Return only the display-safe content needed by the current interface; do not expose authoritative grading snapshots before answers are locked. Feedback can be returned after answering in the existing review flow. A client-provided question ID can identify an answer within the issued attempt but cannot choose a replacement, alter difficulty, or supply its correct key.

Mission follow-ups remain up to three existing practice questions, separate from the main score. The server selects them using the approved Priority 2 weakness/difficulty-first logic, tracks answers, and merges their mistakes into review topics exactly as before. Completion must not accidentally treat their score as part of the main quiz. Separate targeted practice remains unchanged and earns no XP. Its student-reported mastery may inform non-authoritative learning support, but cannot establish a passing assessment or authorize an issued question outside policy.

Chapter attempts snapshot the actual active challenge questions and existing game types: choices, matching, trade simulation, and evidence decisions. Server grading must match the existing answer schemas. Require every existing active chapter mission before chapter issue/submission. Daily attempts bind the chosen challenge and Philippines date to server time.

Transport retries reuse the same attempt/action ID. No automatic paid action or new quiz is created on an uncertain save. Resume queries recover a committed result after a lost acknowledgement.

## Grading keys and catalog scope

For the minimal secure reward correction, read existing answer keys in the trusted server and bind them to an issued attempt/content digest. Do not require a mass public-catalog key migration to make reward authority secure: the server can reject forged submissions even while the current educational catalog remains readable.

Important limit: current public questions include answer keys and feedback. Trusted grading prevents clients from declaring scores/rewards or substituting questions, but cannot prove unaided understanding when keys are public. Do not promise otherwise. Hiding all public keys would require a separately reviewed content-delivery/key migration and compatibility work for practice/feedback. This plan does not authorize deleting public fields, duplicating every key into a new collection, or claiming exam secrecy.

Server-owned attempt snapshots must be readable only through the filtered endpoint, not directly by students. Protect against content edits during an attempt with a computed catalog/policy digest; fail with a recoverable restart message if the applicable scoring content changed. This avoids requiring mass `assessmentVersion` updates to all existing catalog documents.

## Atomic completion and reward writes

In one transaction, read profile/status, applicable prerequisite records, authoritative attempt, current applicable catalog/policy evidence, canonical completion and collectible ownership before enqueueing writes. Server store adapters must buffer writes until required reads finish, respecting Firestore transaction ordering.

- Derive main score, passing status and review topics from issued questions and answers.
- Preserve the existing completion IDs, attempt/ownership IDs, catalog reward amounts and configured level formula.
- Add XP only when a passing attempt has no prior canonical completion. Failure never creates completion or collectible ownership.
- Chapter completion awards its badge and no new chapter XP.
- Existing completions suppress a second XP award. Preserve earliest completion evidence and `max(existingBestScore, newScore)`; never lower a legacy best score just to mark new evidence verified.
- Create missing eligible collectible ownership only when absent; retain existing ownership unchanged.
- Read/update the shared profile transactionally so simultaneous different completions accumulate correctly and same-activity submissions cannot pay twice.
- Save canonical attempt/result and a private idempotency receipt in the same transaction. Return a fresh current total on replay without treating an old receipt's reward amount as a new credit.
- Verify account status again inside processing. All server Admin writes require explicit authorization checks because Admin bypasses Firestore client rules.

Malformed or contradictory legacy records fail closed for that operation with a supportable error. Do not overwrite, delete, repair, or assign replacement XP automatically.

## Legacy students: preserve without a bypass

Freeze the accepted legacy record population at cutover by blocking further client canonical writes. Existing canonical completions and ownership remain readable and usable as prerequisites under the existing rules; first-completion logic treats them as already rewarded. They are retained historical records, not retroactively certified assessment evidence.

New server attempts are separately attributable to server-owned issuance/result records. If a server-verification marker is used, it refers to the new attempt evidence, never retroactively proves an old best score. Prefer keeping evidence in the private attempt rather than adding mandatory fields to every old completion.

This necessarily grandfathers any pre-cutover false claims that cannot be distinguished without a separate record review. That is the consequence of preserving records and not revoking rewards. It does not permit new legacy-shaped writes: neither the presence nor absence of a verification flag enables a client write rule. Any historical reconciliation or mass certification requires separate approval.

The stored `users.xp`, existing badges/artifacts and completed progress are not recalculated or reset. No learner-wide migration is proposed.

## Firestore rules and data model

Retain all existing owner/approved-teacher read rules. Explicitly deny student create/update/delete for:

- `studentProgress`, `studentChapterProgress`, `studentDailyChallenges`;
- `studentArtifacts`, `studentBadges`, `studentQuizAttempts`;
- Profile XP/level/streak/reward metadata through `rewardUpdate` or any equivalent alternate write path.

Preserve unrelated bounded profile editing, cosmetics requirements, teacher workflows, drafts, append-only non-reward practice and review evidence. Check overlapping wildcard matches: a denial in one match does not neutralize an allowance elsewhere.

Add explicit client read/write denials for private `serverAssessmentAttempts`, `serverAssessmentHistory`, `serverAssessmentUsage` and request-idempotency records (collection names may be consolidated to avoid a needless extra collection). These are new server-owned structures for new attempts, not rewrites of existing students. Usage controls must be reviewed as service abuse protection and must not silently change educational passing/reward rules. Any TTL/rate-limit thresholds are approval decisions before activation.

One minimal read-only rollout policy may be needed in `learningSettings` to identify secured mode and protocol version. It is not a client-controlled bypass; trusted endpoints enforce their own readiness and rules always deny canonical client writes after cutover. Policy creation is a future production configuration change requiring the deployment approval, not part of plan preparation.

Rules must be based on the freshly read active production source, then scoped changes applied. The working-tree rules contain unrelated teacher edits and must not be deployed wholesale.

## Exact implementation targets

| File/function | Planned work |
|---|---|
| `functions/student-rewards.js` / `createStudentRewards`, `grade` | Replace raw-bank submission authority with a shared issued-attempt service; preserve validated game grading, atomic rewards, and record compatibility. No arbitrary five-ID submission grading. |
| `functions/student-assessment.js` (new) | Issuance, advancement/backtracking, follow-up selection, resumption, digests, authorization and request idempotency. |
| `functions/index.js` | Export authenticated/App-Check-enforced callable adapters and route the old `submitStudentActivity` name exclusively through secured attempt submission. Reject legacy raw score/question requests. |
| `functions/package.json` | Only dependencies/runtime packaging required for shared selection/grading; no unrelated upgrade. |
| Shared assessment policy/selection adapter under `functions/` | Reuse existing `js/mission-assessment.js` behavior through a testable server-compatible module or generated/import adapter; prove parity rather than hand-maintaining divergent algorithms. Final file name documented in implementation. |
| `server/assessment/core.mjs`, `store.mjs` | Reuse/extract compatible pure logic; if the standalone entry remains, gate it or route it to the same authoritative service. No second active grading/reward implementation. |
| `server/assessment/server.mjs` | Keep inactive standalone activation blocked unless explicitly selected; no separate backend deployment in this proposal. |
| `js/student-assessment-client.js` (new) | Callable transport, protocol validation, idempotent actions, resume and safe errors. No reward writes. |
| `js/student-rewards-client.js` | Keep current public submission result shape as a compatibility facade; remove production browser grading and canonical transactions. Local mock/exploration preview stays isolated and cannot call reward writers. |
| `js/mission-assessment-client.js` | Obtain/resume issued sets through service rather than self-issue authoritative sets. |
| `js/quiz.js` | Advance/adapt/submit through issued attempts, preserve backtracking confirmation, follow-up separation and restored state; render server feedback. |
| `js/chapter-challenge.js`, `js/daily-challenge.js` | Start/resume server attempt and submit answers while preserving existing interface and feedback timing. |
| `js/learning-draft.js` | No planned concurrency rewrite. Only a directly necessary integration change if tests demonstrate one. |
| `js/firebase-config.js` | Add/reuse the Functions instance/App Check integration only if not already sufficient; no project/provider switch. |
| `firestore.rules`; `functions/build-trusted-assessment-rules.cjs` | Prepare reviewed deny-client-write candidate against active baseline, add private-record protection and preserve unrelated reads/writes. No publication during implementation. |
| `tests/student-security.test.cjs` | Repair current-contract dependencies, UUIDs, policies, catalog fixtures and new endpoint expectations; retain valid denials. |
| `tests/mission-flow.test.cjs`, `tests/trusted-assessment.test.cjs`, `tests/trusted-assessment-rules-candidate.test.cjs` | Extend issuance/transaction/legacy/read compatibility assertions; remove assumptions that browser claims authorize rewards. |
| New `tests/student-assessment-emulator.cjs` and browser integration fixtures | Exercise real rules + Functions/Firestore emulators, adaptive/resume/old-session flows and attack cases. |
| Existing quiz/chapter/daily/collection/Bayani/narration tests | Update only outdated dependency fixtures where necessary; assert unchanged learning/reward behavior. |
| `docs/validation/` release/compatibility reports | Evidence, exact final files, hashes, emulator results and proposed activation/rollback manifest. |

Optional deployment scripts/configuration will be prepared only after local compatibility is known and kept distinct from the live root deployment target. Final changed-file inventory and any necessary Hosting CSP changes will be reviewed before publication.

## Legacy test repair plan

The old security suite has 10 failures: four missing current browser dependencies; four callable cases missing valid attempt UUIDs/current contracts; one missing progression policy; one missing avatar-catalog fixture. Update them to current contracts, then convert client reward-writing expectations to secured endpoint expectations with direct writes denied.

Keep ownership/privacy checks, exact reward amounts, account-status restrictions, paired/atomic result integrity, concurrent idempotency and prerequisites as requirements. The new security model intentionally changes previously valid client completion writes into denials; add corresponding trusted-service success tests rather than removing legitimate completion coverage.

Repair legacy collection fixture imports without changing production UI. Existing exploit reproductions must become deny assertions against secured rules and remain named/regression tracked. Assertions must not be weakened merely to obtain a green run.

## Test matrix and release gates

Local implementation gate: Firebase Auth/Functions/Firestore emulators with only `demo-lakbaypanahon`, no production fixtures or credentials. Server-store transaction tests must include actual Firestore read ordering and retry semantics, not only in-memory mocks.

Required cases:

- First pass, failure then retry, failure after completion, completed mission replay, best-score preservation.
- Same attempt/action repeated; conflicting answers; simultaneous distinct attempts for one mission; simultaneous different eligible mission rewards; two chapter completions; artifact/badge backfill.
- Disconnect before commit; committed result with lost acknowledgement; refresh while pending; reopened saved attempt; queued/delayed old action revision.
- Forged score/XP/completion flags; arbitrary or foreign attempt IDs; swapped IDs/keys/difficulty; unissued or repeated question IDs; question count/topic quotas; malformed game answers; stale catalog; disabled/revoked identity.
- Missing mission/chapter/era prerequisites; premature badges; direct canonical write attempts; alternate legacy callable payloads; private server record reads/writes.
- Server-side adaptive swaps after correct/wrong answers, repeated mistakes, changed earlier answer, exact five-question count, nearest available difficulty, weak-topic follow-ups, exhausted pools, score-independent follow-up mistakes.
- Daily server date/rotation and midnight behavior, configured reward/streak preservation.
- Existing valid records with no new metadata remain readable and usable, no second XP, no lowered best score, no rewritten earned timestamp; malformed legacy records do not become privileged bypasses.
- Ordinary profile/avatar and cosmetics writes still work; collection reads/details, teacher reports and draft protection remain functional.
- Bayani request/session tests, narration cache/text checks and responsive browser smoke tests remain green.

Read-only source/catalog/rules verification is separate from write-based acceptance. No production test accounts or records will be created until later deployment/live-test approval.

## Controlled future deployment strategy

No activation will occur under implementation approval alone. After local tests, provide the exact package/rule/function diff, costs/readiness, and a proposed activation window for approval.

There is no atomic deploy covering Hosting, Functions and rules. Use a short explicit assessment-save cutover window rather than leave an insecure fallback available:

1. Record active Hosting version, ruleset, function inventory/config, and hashes. Prepare rollback artifacts without collecting all learner data. Retain exact catalog/contract evidence needed by issued attempts.
2. Deploy tested secured endpoints in a gated/non-public-write-ready state; inventory every reward-capable endpoint, including old versions, and make the old callable reject raw legacy submissions. Server-ready checks must show no alternate reward writer remains.
3. Publish compatible frontend and reviewed restrictive rules in the approved sequence/window. New frontend must never fall back to direct rewards if endpoint/protocol readiness fails. Old clients will receive a recoverable reload-required result instead of writing claims.
4. Enable the secured assessment protocol only after rules readback confirms direct canonical writes are blocked. Verify exact deployed module hashes and existing revalidation headers; preserve unrelated production assets.
5. Run approved isolated hosted acceptance: normal pass/fail/retry, server-issued adaptive follow-ups, badges/artifacts, lost-acknowledgement replay and two independent sessions. Remove only those disposable identities/documents. Read back active rules/functions and run direct-write denial checks against disposable identities.
6. Restore normal assessment entry after gates pass. Keep the previous version and protected-mode instructions available for incidents.

Existing unfinished local/cloud drafts are not trusted issued evidence. Preserve their stored data. Resume an owned server attempt when present; otherwise require a new secured attempt, clearly explaining that unfinished assessment work must restart while earned progress remains saved. Do not manufacture a server receipt from client answers. Existing completed students can review without paying XP again. Reading lessons, narration and non-reward practice should stay available during the cutover where current auth rules allow them.

## Rollback

Never restore the permissive reward rules as the default rollback: that reopens the confirmed defects. Keep canonical client writes blocked and pause assessment submission if the secured service is unhealthy. Roll back to a previously tested **secured-compatible** service/frontend, or a safe frontend that permits lessons/review while assessment saving is unavailable.

An Admin service rollback also needs a code/routing gate: Firestore rules do not constrain its writes. Disable/gate a faulty reward endpoint and verify no old callable remains capable of raw rewards before reopening assessment traffic.

Keep committed rewards and receipts intact. A failed/uncertain transaction is resolved by querying its server attempt/result and retrying the same idempotency key, not deleting learner records. Do not bulk undo post-cutover XP or restore a database snapshot over later student work. Any data repair or emergency acceptance of security regression requires separate explicit approval.

## Decisions for approval

Approval of local implementation should explicitly cover:

1. The shared Firebase Functions, server-issued-attempt architecture, including daily canonical rewards and server-side adaptive advancement/follow-ups.
2. New private attempt/idempotency records and denial of client canonical reward writes, while preserving existing read compatibility.
3. Grandfather existing saved completions as fixed historical prerequisites without retroactive certification, reset or revocation. New client-created legacy-shaped records are denied.
4. Retain public educational answer-key fields for this bounded correction; exam secrecy/key migration is outside scope and requires a separate plan if desired.
5. Reject/retire raw legacy callable submissions instead of leaving an alternate authority, and repair the stale security fixtures.
6. Accept that pre-cutover unfinished quizzes may need restarting and that a short controlled assessment-save window will be needed for later activation.

Still requiring separate approval after implementation: production function/rule/Hosting publication, any billing/service activation, specific attempt expiry and abuse thresholds if not already established, production configuration writes and isolated live acceptance. No mass learner migration, reward cleanup, new questions, historical edits, or Priority 4 work is proposed.
