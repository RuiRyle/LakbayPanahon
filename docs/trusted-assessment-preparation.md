# Trusted assessment preparation — inactive

30 October 2026. The user selected **local preparation with activation disabled**. This private backend is not installed, hosted, connected to student pages or enabled in Firestore. It does not replace the current Spark/browser-grading workflow. No paid service, Cloud Function or real assessment request was activated.

## Prepared implementation

`server/assessment/core.mjs` issues server-selected attempts and grades answers inside a transaction. `store.mjs` adapts Firebase Admin transactions; `http.mjs` verifies request origin, revoked ID tokens and App Check before service access. `server.mjs` provides bounded JSON transport and refuses to load credentials or open a port until explicit activation configuration is supplied.

- `POST /api/assessment/start` accepts only the activity kind and relevant chapter/mission/quiz/challenge IDs. The server checks current role/status, active content, chapter and era prerequisites, earlier missions, and the daily server-date selection. Client preview flags, chosen question IDs and claimed completion/XP values are not accepted.
- Attempts contain server-selected questions and private key snapshots. Responses expose allowlisted prompts/options/task data only. The five-question mission policy and topic quotas come from Firestore. Verified server history supplies difficulty and equivalent retry selection; public practice/quiz history is not trusted as authority.
- `POST /api/assessment/submit` accepts only the issued attempt ID and answers. Attempts are owner-bound, expire under the server policy, and bind an answer fingerprint after submission. Choice, matching, trade and two-part evidence tasks are graded privately. Reusing an acknowledged attempt returns its original result; changing its answers is rejected.
- Completion, profile XP/level/streak, artifacts/badges, private attempt results and the public mission-result mirror are transactionally written. New retries after completion award zero additional XP. Newly verified completions carry `serverVerified: true`.
- Durable daily/minute start limits are checked before expensive content reads. These are not a full denial-of-service defense: rejected or submitted requests still perform authorization reads. A host must provide ingress limits and spending controls.
- Transport bounds requests to 64 KiB and a 15-second response deadline. An in-flight database transaction may still finish after an HTTP timeout; the same attempt ID must be retried to resolve an uncertain acknowledgment. There is no automatic retry that invents a new assessment attempt.

## Proposed private data, not created

| Document/collection | Purpose |
| --- | --- |
| `learningSettings/trustedAssessment` | Reviewed operating policy; disabled proposal in `data/trusted-assessment-settings.draft.json`. |
| `assessmentAnswerKeys/{questionCollection_questionId}` | Private answer and feedback material linked by `questionCollection`, `questionId`, `activityId`, and `assessmentVersion`. Choice uses `correctAnswer`; matching uses `matches`; trade uses `requiredQuantity`; evidence also uses `correctEvidenceId`. |
| `serverAssessmentAttempts/{uid_attemptId}` | Issued context, version, question/key snapshots, expiry, submitted answers, fingerprint and authoritative result. |
| `serverAssessmentHistory/{uid_kind_activityId}` | Server-verified question freshness and topic evidence. |
| `serverAssessmentUsage/{uid_YYYY-MM-DD}` | Durable issue counters. No question or chat text. |

Current deployed rules deny browser access to the proposed private collections and policy by default. No retention, expiry deletion or account-removal policy is assumed. These records would contain learner answers and must be included in the operator's agreed lifecycle process before activation.

## Required cutover work

1. Choose and approve a private HTTPS backend host. Keep credentials outside the Live Server workspace and use managed identity/ADC where possible. The host needs Node 22+ and the private `firebase-admin` dependency. Preserve the repository paths for the pure `js/mission-assessment.js`, `js/daily-policy.js` and `js/progression-policy.js` imports; do not publish the private repository as the website root.
2. Review and migrate answer keys **out of public question documents**, including choice explanations that reveal the key, matching pairs, required quantities and correct evidence IDs. Populate the private keys and increment activity `assessmentVersion` when an issued assessment's content/key changes. Public matching data must expose independent left/right choices rather than keyed pairs. The prototype refuses legacy public key fields or missing private keys; hiding a field in an HTTP response is insufficient.
3. Integrate the quiz/challenge/daily frontend with server-issued questions, attempt IDs and authoritative submit responses. The current frontend still imports `student-rewards-client.js`; **no routing switch is implemented or implied**. Adapt drafts, answer review, feedback, adaptive question presentation and lost-acknowledgment recovery together. The preparation currently issues an equivalent full question set; the existing within-attempt browser adaptive presentation needs a reviewed server-compatible design before cutover.
4. Review legacy completion and XP provenance. Legacy browser completions are not trusted prerequisites. A later server pass can verify an existing mission without paying its XP again; forged legacy best scores must not become authoritative by copying them. Existing account XP and other baseline data need an explicit migration decision.
5. Review `functions/build-trusted-assessment-rules.cjs`. It generates a separate candidate that disables browser completion/attempt/collection writes and profile reward updates. **It does not replace or deploy `firestore.rules`.** Deploying that candidate before the frontend cutover would break the current browser reward writer. Verify rule semantics, multi-write behavior, rollbacks and app compatibility before activating it.
6. Agree operator/contact/retention, host ingress limits and rollback handling. `privateKeysReady` and `clientWritesBlocked` are operational approval flags, not proof that migrations or rule deployment happened. Keep both false and `enabled` false until actual checks are recorded.
7. After a coordinated cutover, validate real Auth/App Check rejection, locked progression, private-key read denial, score spoofing, issued-question constraints, replays, duplicate concurrent submissions, day boundaries and cleanup using bounded test accounts. Only then can trusted grading be described as active. It still cannot prevent answer sharing, account sharing or learners consulting lesson material.

## Local evidence

`node tests/trusted-assessment.test.cjs`: **15 checks pass** against injected auth/store/provider-free transport. They include real core grading and state transitions with serialized fake transactions. `node tests/trusted-assessment-rules-candidate.test.cjs`: **three checks pass** for the inactive rule generator. These checks do not evaluate a deployed Admin transaction, current private keys, client integration or hosted IAM/rate limits. No emulator, real account, Firebase write, dependency installation or backend listening port was used.

The optional older callable in `functions/student-rewards.js` remains separate historical code. This preparation does not deploy that callable or treat it as the active trusted path.
