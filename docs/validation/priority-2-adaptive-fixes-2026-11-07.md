# Priority 2 implementation and verification

Completed locally on 7 November 2026 after approval of the two corrections in [the audit](priority-2-adaptive-quiz-audit-2026-11-07.md). No deployment, live Firestore reads/writes, migration, rule changes, or student-record changes were performed. Priority 3 was not started.

## Fix 1: Reinforcement selection

Original cause: `selectAdaptiveQuestion` globally removed seen questions before choosing a topic and difficulty. Any unseen question could exclude an available question for the student's weak topic, or exclude an easy question when easy review was requested.

Changed `js/mission-assessment.js` so selection now:

1. Filters inactive, unsuitable, malformed, and already-used questions exactly as before.
2. Ranks topics by existing weakness weights, session attempt counts, and existing tie-break order.
3. Selects the nearest available difficulty within that topic using the existing distance calculation.
4. Prefers unseen questions within this resulting pool, then uses the existing random tie-break.

The selector returns null when exhausted. Available harder/easier questions remain valid fallbacks for limited banks. Used IDs are still excluded, so it cannot repeat a question within the same sequence or loop indefinitely. Once weak-topic items are exhausted, other eligible topics remain available.

No quiz count, topic quota, difficulty-step rule, practice policy, question, answer key, historical content, feedback, passing threshold, scoring, reward, or unlocking code changed. Main quiz quota enforcement and separate targeted-practice selection remain in their existing modules. Follow-up checks retain their existing three-check cap and score-independent behavior.

## Fix 2: Draft version protection

Original cause: separate sessions shared one activity draft document; unconditional set/delete operations did not check whether another session had advanced it.

Changed `js/learning-draft.js` to use optimistic version checks with Firestore transactions:

- Capture the initial server document version as soon as the draft instance is created, including callers which skip `read()`.
- Compare canonical existing document fields, including `updatedAt`, against the observed version inside the transaction before saving.
- After a successful save, read back the committed state and server timestamp before accepting that version as the next baseline. A different state is treated as a conflict.
- Check the document version inside a transaction before cleanup. If another session advanced or recreated it, leave it untouched. Firestore transaction retries recheck the comparison after concurrent changes.
- Stop stale instances from saving further and use the existing status area to request reopening the activity. No layout or new controls were added.
- Preserve serialized local writes, obsolete-write skipping, unchanged-state deduplication, snapshot copying, ordinary failed-save retry, sign-out/close guards, and cleanup of a current completed session's draft.
- Preserve legacy draft payloads: no ownership property, collection, document key, nested state field, or top-level field was added. Existing `updatedAt` and state are the version evidence. The existing rules allow these same document writes/deletes; rules were inspected but not changed.
- If the initial version cannot be read, do not silently acquire a later baseline and overwrite another session. Explain that the activity must be reopened when connected. The failed initial read is handled without an unhandled promise rejection.

This is version-based concurrency protection, not an exclusive tab lock. Two sessions starting from the same version may both read it; the first successful change invalidates the other's baseline. Students can reopen to restore the latest saved draft.

## Affected files

| File | Change |
|---|---|
| `js/mission-assessment.js` | Move unseen-question preference after topic and difficulty selection. |
| `js/learning-draft.js` | Transactional version checks, guarded cleanup, committed-version confirmation, and conflict/baseline status handling. |
| `tests/adaptive-reinforcement-selection.test.cjs` | Three new selection/difficulty/limited-pool regressions. |
| `tests/learning-draft-concurrency.test.cjs` | Eight new concurrent-session, legacy, interruption, authentication, and baseline-failure regressions. |
| `tests/learning-draft.test.cjs` | Adapt existing delayed-write/failure fixtures to transactional persistence while retaining their assertions. |
| This report | Implementation details, validation, and limits. |

No Bayani AI, narration, assessment submission, rewards, navigation, historical content, database rules, or migration file was edited for these fixes.

## Regression coverage

New selector tests reproduce both original symptoms: seen weak-topic items competing with unseen unrelated items, and a seen easy item competing with an unseen hard item. They also verify equivalent unseen review is preferred, weak-topic items can be exhausted without blocking completion, and existing correct/incorrect difficulty steps remain bounded.

New draft tests cover:

- A stale save cannot overwrite another session's newer state.
- Cleanup alone from an older session cannot delete newer work.
- A delayed save transaction retries after a competing commit and rejects its stale baseline.
- Delayed cleanup retries preserve another session's newly committed draft.
- Legacy draft restoration and cleanup by a refreshed current session.
- A committed save with a lost acknowledgement remains restorable; stale retry cannot overwrite later progress.
- Closing after an already submitted write prevents subsequent cleanup. An already submitted commit is not promised to be cancellable.
- Changed-account sessions cannot initiate new saves or cleanup.
- An unavailable initial baseline cannot cause an unchecked write or offer a misleading retry that adopts newer work.

## Automated results

```text
node --test tests/adaptive-reinforcement-selection.test.cjs tests/learning-draft-concurrency.test.cjs tests/learning-draft.test.cjs tests/mission-flow.test.cjs tests/quiz-draft-policy.test.cjs tests/practice-save-recovery.test.cjs tests/practice-hint-evidence.test.cjs tests/adaptive-review-evidence-dates.test.cjs tests/adaptive-topic-coverage.test.cjs tests/trusted-assessment.test.cjs tests/teacher-quiz-insights.test.cjs
```

**78 passed; zero failures.** Includes existing correct/incorrect/retry grading, completion and XP idempotency, topic quotas, content-version restoration, practice save recovery, hint evidence, and review evidence dates. The trusted-assessment tests concern the separate trusted module; actual browser submission correctness is covered by mission-flow tests and quiz browser fixtures.

```text
node --test tests/bayani-review-question.test.cjs tests/bayani-request.test.cjs tests/bayani-debug.test.cjs tests/bayani-bridge-integration.test.cjs tests/bayani-backend.test.cjs tests/bayani-backend-client.test.cjs tests/adventure-voice.test.cjs tests/journey-path.test.cjs tests/lesson-audio.test.cjs tests/objective-narration-compatibility.test.cjs tests/narration-generator.test.cjs
```

**85 passed; zero failures.** Checks Bayani request/session handling, journey prerequisites, device/recorded narration behavior, audio generation/cache compatibility, and the 65 previously revised objectives.

**Total: 163 automated tests passed.** The initial restricted test-runner launch produced a process-spawn permission error; rerunning with the permitted local process access resolved it. No assertion failures remained.

## Browser results

All seven local mocked browser suites passed:

```text
node tests/mission-quiz-browser.cjs
node tests/mission-quiz-storage-browser.cjs
node tests/student-review-browser.cjs
node tests/practice-hint-evidence-browser.cjs
node tests/bayani-ai-browser.cjs
node tests/story-browser.cjs
node tests/chapter-challenge-browser.cjs
```

Coverage includes quiz fail/retry/pass, rewards, blocked storage, restored sessions, authentication changes, practice/history recovery, repeated-attempt and hint evidence, Bayani chat isolation, lesson navigation/completion, chapter challenge save recovery, badges, and duplicate prevention. Browser suites use fixture draft adapters; the actual draft module's concurrency behavior is verified separately by the transaction-focused module tests above. This distinction prevents presenting browser fixtures as a live Firestore concurrency test.

Whitespace validation with `git diff --check` passed for the tracked changed source/test files.

## Remaining risks and limits

- No live multi-device Firestore acceptance test or emulator rules integration test was performed. The concurrency tests emulate optimistic transaction retries and server timestamps; they do not certify deployed Firebase permissions, network timing, every browser, or device.
- The safeguards apply to the updated client. Already-open tabs running older code can still use unconditional writes/deletes. They should be refreshed when this code is eventually deployed. These client checks are not an authorization boundary against deliberately modified clients.
- Transactional saves require connectivity. Offline/failed saves retain existing unsaved-state guidance. An unavailable initial baseline requires reopening; a committed write with an uncertain acknowledgement may likewise require reopening to restore the confirmed saved state rather than rebasing unchecked local answers.
- Version confirmation introduces server reads in addition to the transaction read/write. Existing deduplication and obsolete-write skipping remain; production quota/latency impact has not been measured.
- A shared draft is not merged across simultaneous sessions. Conflicts preserve the stored version and ask the stale session to reopen; local-only divergent answers are not automatically merged.
- Completed attempts, progress, XP, badges, and rewards are separate records and were not changed. The checks establish preservation within tested paths, not a new security or historical-content certification.

Both approved corrections are implemented locally and verified to the extent above. No publication or Priority 3 work was performed.
