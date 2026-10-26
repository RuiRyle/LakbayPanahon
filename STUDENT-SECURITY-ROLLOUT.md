# Student data protection - free Firebase plan

The student reward workflow now uses Firestore directly. It does not call or require a deployed Cloud Function. No billing upgrade is required for this implementation; normal Firebase free-plan quotas still apply.

## Protections

- Registration permits active students or pending teachers only. It cannot initialize administrator accounts, XP, levels, or streaks.
- Account updates cannot change roles, status or email. Name edits remain available under bounded field rules. Avatar IDs are limited to nine predefined choices (initials plus eight icons).
- Progress, artifacts, badges and practice records are private to their owner; list queries require a userId filter.
- Mission and daily completion use a Firestore transaction that pairs the completion record with the profile XP update. Rules check the configured reward amount, exact XP increase and resulting level.
- Deterministic, non-deletable completion records prevent a second reward. Replays can improve best scores without awarding XP again.
- Artifact and badge ownership require a matching completed mission/chapter and active catalog entry. Ownership cannot be edited or deleted by students.
- Daily rewards are limited to one completion per Philippines calendar date, checked against Firestore server time. Rules also validate the daily answer and streak update.
- Existing completed progress and XP are preserved. Replaying an older completed mission cannot award its XP again; a missing artifact can still be added.
- Practice remains an append-only, student-submitted record and does not award XP or unlock missions.

## Limits of this version

Full quiz grading, mission order and chapter prerequisites run in the browser. Rules validate record shapes, catalog relationships, passing-score ranges and reward amounts, but cannot recalculate an arbitrary multi-question quiz or check all prior missions from a query. A modified client can still submit a claimed passing score. Daily rules permit one active daily question per date; the normal rotation is selected in the browser. This is limited reward protection, not server-verified assessment.

The optional Cloud Functions implementation is retained for a future Blaze upgrade or local experiments. It is not used by the student frontend. Existing AI scaffolding remains disabled; this change does not enable Bayani AI or introduce any paid services. Existing data created under older rules is not audited or repaired.

## Test locally

From the project root, with Node and Java installed:

```powershell
firebase.cmd emulators:exec --config firebase.security-tests.json --only firestore --project demo-lakbaypanahon "node --test tests/student-security.test.cjs tests/student-journey.test.cjs tests/student-profile.test.cjs"
```

All 26 tests passed. The security suite evaluates actual rules in a local demo project, including the real free-plan browser reward module through an authenticated REST adapter with atomic commits and optimistic document-version checks. It covers simultaneous submissions, replay, legacy artifact backfill, chapter badges, daily rewards, XP inflation, role escalation, registration and record privacy. The production browser uses the Firebase SDK's runTransaction. The separate emulator configuration uses port 8180. Tests also retain coverage for the optional future backend implementation.

## Activate on live Firebase

No live Firebase changes were made during implementation.

1. From C:\LakbayPanahon, deploy ONLY the revised Firestore rules:

   ```powershell
   firebase.cmd deploy --only firestore:rules --project lakbaypanahon-1797e
   ```

2. Use the updated frontend files. With Live Server, they are already in this workspace; press Ctrl+F5 to reload. If the frontend is hosted elsewhere, upload the changed JavaScript files together first.
3. Test passing/failing a mission quiz, practice saving, replay without extra XP, artifacts, chapter badges, daily rewards, achievements, and logout/login.
4. If saving fails, record the browser Console error. Do not deploy the previous function-only rule version or attempt a Cloud Functions deployment for this free-plan setup.

Rules and frontend must match. Old cached frontend versions that write rewards without the paired fields may receive permission errors after the revised rules are activated.

Reference: Firebase documents paired-write validation with getAfter() in its [transaction rules guidance](https://firebase.google.com/docs/firestore/manage-data/transactions).
