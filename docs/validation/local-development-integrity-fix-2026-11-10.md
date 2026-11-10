# Local development / frozen archive correction — 10 November 2026

## Confirmed defects fixed

1. `firestore.assessment.rules` placed submissionVersion predicates inside the hasOnly argument. Corrected the parentheses so allowed-field validation receives a list and version checks execute as predicates. Version validation and role protections remain enforced.
2. The secured local launcher coupled current classroom-aware browser code to the frozen assessment backend, and refused local development when working sources differed. Local setup now validates the frozen archive independently and stages current assessment modules and current local rules in a separate ignored `build/local-assessment-dev-*` folder. A development manifest records the copied hashes, client hash and known source drift. The archived entrypoint retains its four authenticated callable exports. No accepted archive file was rewritten.
3. The emulator CLI inherited cached operator credentials. Launcher now passes an explicit synthetic nonfunctional credential fixture and removes inherited access-token variables. Test requests target only the loopback demo project; Firebase login is not needed.

## Integrity semantics

`validateCandidateArchive()` proves the retained frozen artifacts/configuration and reports working-source drift separately. The existing strict `validateCandidate()` / `--validate` continues to reject changed working sources. This is an intentional release gate, not a newly accepted release. Drift is explicitly reported for `js/student-assessment-client.js`, `functions/student-assessment.js` and `firestore.assessment.rules`. No baseline hashes were changed. Updated archive tests assert frozen integrity and assert strict drift rejection instead of incorrectly requiring development source to remain identical forever.

## Validation

- 32 archive/configuration/security/local-staging tests passed, including strict source-drift rejection, deployment-flag rejection, archived callable wrapper authentication, separate current-code staging and unchanged archive hashes.
- 28 classroom/trusted-assessment/client unit tests passed: server grading, atomic/replay-safe rewards, authorization, classroom membership/version binding and isolated attempt caching.
- 8 real local Auth/Firestore Rules/Functions checks passed: teacher publication, version increment, student denial, closing semantics, linked assessment issuance and invalidation.
- Seeded catalog smoke passed: five questions, answer persistence/resume, follow-up, server score 100 and receipt replay; total XP 40.
- 7 actual student browser checks passed: lesson loading/reload, answering through controls, graded result/reload and preservation of one 40 XP award.
- 23 connected administrator browser/SDK/Rules checks passed against corrected current rules; synthetic fixtures cleaned up without errors.
- Guided recovery browser checks passed at desktop/mobile; 19 additional focused audit/recovery/assignment tests passed (overlap exists with the suites above; do not add these into a unique total).

## Files

`firestore.assessment.rules`, `functions/stage0-gcloud-plan.cjs`, `tools/start-local-emulator.cjs`, `tools/setup-local-development.cjs`, new `tools/prepare-local-assessment.cjs`, `README.md`; updated tests `admin-review-rules`, `local-development-setup`, `stage0-workflow`; new tests `local-assessment-staging` and `classroom-version-emulator`.

## Outcome and limits

Local development is operational at http://127.0.0.1:4173/pages/login.html. Task-started emulators are left running for manual testing; use the documented local backup before stopping if retaining test data. No deployment, billing, IAM or production data changes. No grading/reward algorithm was changed in this fix. The frozen Priority 3 archive remains intact; the current development version requires its own explicit release acceptance before deployment. A fresh clone installation was not repeated in this pass; existing dependency cache was used. Live email delivery, hosted limits and all possible crash/network failures are not established by these tests.
