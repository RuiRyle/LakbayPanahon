# Priority 2: Adaptive quiz audit

Reviewed 7 November 2026. Audit only: no application fixes, Firestore writes, student-record changes, scoring changes, or work on Priority 3.

## How the existing system works

### Scored mission quiz

`js/mission-assessment-client.js` loads the mission policy, active question bank, previous quiz attempts, and available practice/review evidence. `js/mission-assessment.js` issues the configured question count and topic quotas. It prefers easier questions for topics needing review and harder questions for demonstrated practice goals, with available-bank fallbacks. Previously seen questions remain eligible when needed.

`js/quiz.js` adapts the remaining sequence after each answer. Correct answers raise the target one available difficulty level; incorrect answers lower it. Topic weights increase for mistakes. Selection retains the configured number of questions and topic quotas. Changing an earlier answer requires confirmation and clears subsequent answers so the later sequence can be reconsidered.

The main quiz alone determines the mission score and passing threshold. The actual browser submission path is `js/student-rewards-client.js`: it grades the selected main questions against the catalog, saves the attempt and mission result transactionally, retains the best score, and avoids awarding completion XP twice. The separate trusted-assessment module is not the current browser submission path.

### Follow-up adaptive checks

Before submission, the quiz offers up to three checks drawn from the existing mission practice bank. These checks run even after a perfect main quiz when a suitable bank exists. Missed main-quiz topics receive extra selection weight. Each follow-up answer adjusts topic weights and the next difficulty. Feedback identifies the supported answer. These checks do not alter the main score or XP; their mistakes can contribute to review recommendations.

### Separate targeted practice

`js/practice.js` has its own selector. It prioritizes review topics, balances topic attempts within the session, then chooses an available difficulty near the target. Existing policies use a five-question limit, promotion at 80% first-try accuracy, demotion at 40%, and easy review questions; starting difficulty varies by mission policy.

An incorrect answer keeps the same question available with its existing hint/feedback until answered correctly. Eventual success after a mistake does not count as first-try success, and lowers the next target. First-try success raises it. Requesting a hint is tracked separately and does not itself change the existing first-try scoring rule. Practice does not complete missions or award mission XP.

`js/mission-review.js` combines dated quiz diagnoses, practice, and lesson-review evidence. A lesson visit alone does not establish mastery. Practice goals require the policy's distinct-question, clean-session, and difficulty evidence. Later mistakes can require review again; ambiguous or invalid dates are treated conservatively in the main review evidence model.

## Retries, restoration, and completed records

- A retry receives a new attempt ID. Previously completed attempts remain separate records; a completed attempt is not resumed as an unfinished attempt.
- Quiz drafts retain the issued question IDs, answers, sequence, follow-up state, and content/policy version. Invalid or incompatible drafts are rejected. Practice drafts retain wrong-attempt counts, hint evidence, current question, and remaining questions, preventing an ordinary refresh from converting a retry into a first-try answer.
- Practice save recovery uses the same session record and checks an acknowledged server record when a write response is uncertain, avoiding a duplicate practice session.
- Drafts are stored separately from completions and rewards. Sequential cross-device restoration is supported through the shared cloud draft when reads and saves succeed. Concurrent use has the defect described below.
- Within-instance queued draft writes are serialized and obsolete queued states are skipped. This does not provide concurrency control between separate tabs/devices.

## Confirmed defects

### 1. Global novelty preference can override reinforcement and difficulty

**Files:** `js/mission-assessment.js:153`, used by main-quiz reselection and follow-up selection in `js/quiz.js`. Separate practice uses its own selector.

**Cause:** `selectAdaptiveQuestion` removes every previously seen candidate whenever any unseen candidate exists, before ranking topic need and target difficulty.

**Reproductions using the actual selector:**

1. With a previously seen easy question and an unseen hard question for the same topic, an easy target selects the hard question.
2. Using the repository's chapter10-mission1 practice bank, both questions for the weak `housing-change-care` topic were marked seen and given weight 4. Other topics remained unseen. Three successive selections chose `housing-climate` easy, `housing-climate` hard, and `housing-daily-use` easy. No question from the weak topic was selected, despite available review items.

**Impact:** Students can receive a harder question after difficulty is lowered, or unrelated follow-up topics instead of reinforcement for their missed topic. The scored quiz still retains its topic quotas; the follow-up checks have no equivalent quota guaranteeing the weak topic appears. This is a learning-selection defect, not evidence of incorrect score arithmetic.

**Recommended correction, pending approval:** Rank educational need and compatible difficulty before novelty. Prefer unseen questions within the selected topic/difficulty pool, preserving current question counts, quotas, answer keys, rewards, and difficulty-step rules. Add regressions for both reproductions.

### 2. Older sessions can erase newer unfinished drafts

**File:** `js/learning-draft.js:104`, shared draft persistence used by quiz/practice and other learning activities.

**Cause:** The draft document key is shared by user, activity kind, and mission/chapter. `clear()` unconditionally deletes that document after waiting for only its own instance's writes. It does not verify that the stored draft still belongs to the finishing session. Saves also have no cross-instance conflict check.

**Reproduction using the actual module with an in-memory Firestore adapter:** Instance A saved attempt A; instance B saved attempt B to the same activity document; A cleared its draft. Before clear the stored state was attempt B; afterward the document was absent.

**Impact:** Concurrent tabs/devices can lose newer unfinished answers and their restoration evidence. Completed attempts, mission completion records, and XP are separate and are not deleted by this operation. Normal sequential restoration tests do not cover this race.

**Recommended correction, pending approval:** Introduce guarded draft ownership/version handling so cleanup cannot delete another session's newer draft, and define handling for stale concurrent saves. Preserve the current completed-record/reward paths. Add two-instance save/clear and stale-write regressions. Review any necessary Firestore rule compatibility before choosing the implementation.

## Limits and observations, not additional confirmed defects

- Initial cross-attempt topic difficulty evidence is primarily review/practice evidence. A perfect quiz does not necessarily populate a durable strong-topic mastery state; within-attempt correct-answer progression still works. Expanding this would be a policy change requiring approval.
- Optional practice/review history reads can fall back to empty evidence if unavailable. The quiz can still run, but personalization may be weaker. A visible degraded-personalization notice is a possible future improvement.
- Current browser grading reads answer keys and calculates results client-side. Passing correctness/idempotency tests does not certify resistance to a deliberately modified client. No security architecture change is proposed in this audit.
- Structural checks verify question/feedback mapping and supported schemas. They do not independently certify historical accuracy or Grade 5 curriculum quality. No historical content or answer key was changed.
- This audit used repository catalog fixtures and mocked browser integrations, not fresh production student records. It therefore does not certify live network behavior, every device/browser, or production Firestore rules.

## Validation

Automated command:

```text
node --test tests/mission-flow.test.cjs tests/quiz-draft-policy.test.cjs tests/learning-draft.test.cjs tests/practice-save-recovery.test.cjs tests/practice-hint-evidence.test.cjs tests/adaptive-review-evidence-dates.test.cjs tests/adaptive-topic-coverage.test.cjs tests/trusted-assessment.test.cjs tests/teacher-quiz-insights.test.cjs
```

**Result: 67 passed, zero failures.** Coverage includes ordinary failure/retry/pass flows, completion/reward idempotency, draft validation, practice save recovery, hint evidence, review evidence dates, and structural topic coverage. Trusted-assessment tests validate that separate module, not deployment of it as the current submission path.

Browser commands, all passed:

```text
node tests/mission-quiz-browser.cjs
node tests/mission-quiz-storage-browser.cjs
node tests/student-review-browser.cjs
node tests/practice-hint-evidence-browser.cjs
```

These cover mocked quiz failure/retry/pass, rewards, load recovery, authentication changes, blocked storage, adaptive practice, history/restoration, content failures, hint persistence, and legacy draft handling. No live test accounts or student records were created.

Additional in-memory reproductions confirmed the two defects above. Existing passing suites do not contain those cross-topic novelty or cross-instance draft cases.

## Decision

The existing system does adapt difficulty and review evidence, and ordinary scoring/retry/restoration paths passed their current checks. It is not fully reliable for reinforcement priority or concurrent unfinished-session preservation. Recommend approving narrowly scoped corrections for the two confirmed defects, followed by regression tests. No fixes have been implemented. Priority 3 remains unstarted.
