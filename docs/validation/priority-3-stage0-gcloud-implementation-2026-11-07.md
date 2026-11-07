# Stage 0 — local gcloud pilot candidate

7 November 2026. **Prepared and tested locally; awaiting review. Production remains NO-GO.** No billing, API, IAM, service-account, App Check, production configuration, deployment, live test or student-data operation was performed. No Priority 4 work occurred.

## Candidate and scope

New candidate: `build/priority3-stage0-release/`. The accepted Option A candidate remains intact at `build/priority3-release/`, manifest SHA-256 `126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f`. Every one of its 15 source and 235 artifact hashes still matches. There is no assessment/grading/reward, dependency, security-rule, Hosting-content or CSP change.

The new package retains 229 artifact hashes, changes six configuration/documentation artifacts, adds seven artifacts, removes none, and inventories 242 artifacts. Eight new local preparation/test files are recorded separately from the retained accepted sources. The comparison below lists every hash difference. Tests and operator tooling are not in the Functions upload.

| Configuration | Accepted Option A | New pilot candidate |
|---|---|---|
| Maximum instances | 10 per callable | 2 per callable |
| Concurrency | Implicit | Explicit 8 |
| Minimum instances | Implicit | Explicit 0 |
| CPU / memory / timeout | SDK defaults | Explicit 1 / 256 MiB / 60 seconds, matching planned defaults |
| Attempt expiry | 7200 seconds | 7200 seconds |
| New starts per UID | 10/minute, 200/day proposal | 3/minute, 60/day proposal |
| Protocol | Disabled inert proposal | Disabled inert proposal |
| Runtime account | Dedicated account | Same explicit account in SDK and gcloud intent |
| Build account | Not bound by Firebase workflow | Explicit dedicated account in every gcloud operation |

Both release and deny-only rollback bind runtime `assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com` and build `projects/lakbaypanahon-1797e/serviceAccounts/assessment-build@lakbaypanahon-1797e.iam.gserviceaccount.com`. These are proposed identities, not newly created accounts or granted roles. Existing inert permission proposals remain unchanged; no permission acceptance is implied.

All four original Node 22 `asia-southeast1` `onCall` exports remain: `startStudentAssessment`, `advanceStudentAssessment`, `resumeStudentAssessment`, `submitStudentActivity`. Option A handlers, token revocation checks, active-student checks, private evidence and all reward writes are byte-identical. The only index transformation is the reviewed runtime-options literal. Same-request recovery remains before new-start quota checks. The policy JSON is not published, and no production enablement occurs.

## Verified local tooling and workflow

Google Cloud CLI **592.0.0**, with bundled Python, was unpacked under `build/google-cloud-cli-592/` from the official versioned Windows archive. Its archive SHA-256 is `65002e0d679fc2ade00163b97637f45656d6fd5250d6f5962e4a1a555f2628ea`, checked before extraction and again before final verification. No global installation, PATH change, login, init, ADC configuration, component upgrade or production connection was performed. Local help/version/upload-list commands used an isolated configuration directory with credentials, update checks and usage reporting disabled. [Official archive installation](https://docs.cloud.google.com/sdk/docs/downloads-versioned-archives).

The installed help exposes both identity flags and all selected scale flags. Inspection of its Gen 2 implementation maps `build_service_account` to `BuildConfig.serviceAccount`, runtime account to `ServiceConfig.serviceAccountEmail`, and concurrency/min/max to their service fields. This is local tooling verification, not evidence that a production image has already been built under that identity. [Supported deployment flags](https://docs.cloud.google.com/sdk/gcloud/reference/functions/deploy).

`functions/stage0-gcloud-plan.cjs` has **no production execution mode**. It validates exact structured argument arrays; missing/swapped identities, changed limits/project/source/environment, extra endpoints/flags or enabled policy fail validation. Calling it with `--deploy` fails. Plans under `deployment/` are inert review material. Paths in their argv are relative to the candidate root. A future authorized operator must revalidate the candidate and use the pinned CLI; merely possessing these plans is not deployment approval.

Each operation specifies Gen 2, named entry point, both accounts, Node 22, pilot scale, callable label, explicit nonsecret Firebase environment, HTTPS, HTTP trigger and initially private invocation. Environment contains only `FIREBASE_CONFIG` (matching the retained project's ID/storage bucket) and `FUNCTION_REGION`. No emulator/debug/credential environment is included. `.gcloudignore` permits only 13 normal-source files or four rollback files, including the ignore file itself. Package/lockfile versions are unchanged. A clean Node 22 `npm ci --omit=dev --ignore-scripts` succeeded; six moderate advisories remain.

Actual CLI upload selection and its actual Functions ZIP routine were exercised locally. ZIP entries and bytes were checked, not just the file map. This caught and corrected two preparation issues: the custom ignore-file path must be source-relative, and the deny-by-default patterns must explicitly include the root path and shared-module directory for the ZIP routine. Initial test-log decoding also required handling PowerShell UTF-16. No application assertions were relaxed. Final ZIPs contain all 13/four allowlisted files and exclude tests, migrations, secrets and `node_modules`.

The new Firebase release/rollback configs have **no Functions target**, preventing that candidate from silently reverting to the unsupported Firebase build-account path. Reviewed Firestore publication and Hosting overlay remain separate. Root working-tree deployment configurations are not a replacement for this candidate.

## Final tests

| Gate | Passed | Failed |
|---|---:|---:|
| Relevant Node 22 unit/security/compatibility tests, including 24 new workflow tests | 230 | 0 |
| Packaged demo Auth/Functions/Firestore integration tests | 32 | 0 |
| Focused pilot expiry/quota/legacy checks | 7 | 0 |
| Relevant standalone browser fixtures | 11 | 0 |
| Actual CLI ZIP preparation | 2 packages | 0 |

The 32-case integration suite includes the assembled actual-browser refresh/lost-response flow; it is not an additional standalone fixture. It verifies canonical/private-record rules, forged/legacy submission denials, prerequisites, adaptive follow-ups, daily behavior, concurrent rewards, exactly-once payment, best scores and timestamps. Emulator Functions discovery reported max 2/min 0/concurrency 8, CPU 1/256 MiB/60 seconds and the intended runtime account for all four exports. Emulators do not exercise cloud IAM or enforce Cloud Run capacity.

New local HTTP checks execute the unchanged production-mode SDK wrapper: OPTIONS/CORS, callable envelopes/errors, missing/invalid Auth/App Check denials. Rollback exports were executed internally and all four deny rewards even with supplied identity/data. Browser tests preserve Bayani imports and local App Check token transport. **No real reCAPTCHA attestation is claimed.** The existing assembled-browser ViewTransition warning remains recorded.

Pilot checks issue exactly two-hour attempts; accept three new starts and reject the fourth; recover the same request at both the minute quota and a seeded daily count of 60; reject new daily issuance; reject expired unfinished work without XP/reset/deletion; and preserve legacy XP 777, best score 100 and original completion/artifact timestamps. A seeded cap is not 60 completed quizzes. Only isolated demo test policy/data was enabled/written.

Evidence: `priority-3-stage0-unit-2026-11-07.log`, `priority-3-stage0-emulator-2026-11-07.log`, `priority-3-stage0-quota-boundaries-2026-11-07.log`, policy/browser/packaging JSON, and 11 `priority-3-stage0-*-browser.cjs.log` files. The verification JSON hashes the final logs. The earlier workflow-test log retains the initial encoding-test failures; final acceptance has zero failures.

## Protected rollback and future stop conditions

Rollback intent uses `rollback/functions`, the same pinned gcloud route, exact accounts, scale, environment and callable classification. Its unchanged deny-only handlers cannot award rewards. Restrictive rules, holding frontend, committed receipts and student progress remain intact. No permissive browser-writer rollback is included.

Future production work still requires separate approval and fresh preflight/backup. Initially keep protocol absent/disabled and invocation private. After any authorized build, verify actual build records plus `buildConfig.serviceAccount`, runtime account, scale, environment, labels and entry points; stop on any default account or mismatch. Never assume an SDK option or manifest string proves actual cloud configuration. Existing public invocation grants require explicit inspection/reconciliation: `--no-allow-unauthenticated` alone is not evidence that inherited/pre-existing permissions were revoked.

Only later approved, scoped invocation access can permit Firebase web callers; Firebase ID tokens do not replace platform invocation IAM. Test Auth/App Check with disabled protocol before any approved save activation. Stop for organization-policy restrictions, unexpected privileges/defaults, packaging/configuration drift or failed legitimate attestation. Do not switch tools or weaken checks as a workaround.

During any separately approved cutover, pause assessment saves, publish only the restrictive rules and exact compatible Hosting overlay, read back hashes and keep protocol disabled until the separately approved hosted test window. Rollback first disables protocol/gates unhealthy Admin authority, then uses the reviewed deny-only delivery if needed. It may require a build; rules alone do not constrain Admin. Do not overwrite later learner work with a snapshot or remove receipts.

Production gates remain: billing/APIs; dedicated accounts and scoped deployer/build/runtime/service-agent permissions; private source-bucket/repository access; backup/recovery/monitoring; App Check field repair and real school-browser attestation; explicit time-limited advisory disposition; invocation and hosted acceptance/rollout decisions. Build/source/image storage can become billable after separately approved activation. [Build identity and storage requirements](https://docs.cloud.google.com/functions/docs/building).

**All-endpoint UID throttling remains unimplemented.** The start quotas do not cap advance/resume/submit requests or bound abuse spending. No runtime-limit increase or new throttling logic was added. Zero minimum instances allows cold starts; max 2/concurrency 8 is a configured intent, not hosted capacity proof or a hard spending cap. Previous Option A class-save results remain prior evidence; no new production-capacity claim is made.

No fresh production metadata or learner read occurred in this task. The pinned baseline version, 575 baseline paths/configuration and rules are retained unchanged locally. The previously recorded production preflight is historical evidence; repeat it before any future authorized production action. Stage 1 is not requested. Await review of this candidate.

## Exact hash comparison

The following tables are generated from the final manifest and companion `priority-3-stage0-hash-comparison-2026-11-07.json`. `new` means no file existed in the accepted inventory. All original accepted sources are unchanged.

New manifest SHA-256: **`0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`**. Accepted manifest remains **`126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f`**. Final source/artifact drift: none.

| Artifact relative to new candidate | Before | After |
|---|---|---|
| `deployment/deploy-plan.json` | new | `93c237965a32a5188e7f8627df85fdadb35bb15eafd7bb177462ed7019ef235e` |
| `deployment/identity-binding.json` | new | `7b5d49c004b0b611543c71cce9dd47bcbb1e13e4a378fdc028cfdb7992f4e094` |
| `deployment/rollback-plan.json` | new | `f5ea8b309332321e7478471a1f970c882df44b1ab0b937d5e1dbfd16f50d7a38` |
| `deployment/runtime-env.json` | new | `959f6afc42118e496e6d47dc34fd83a54a0b948f3c02901bfd4f2f6cee35b807` |
| `firebase.release.json` | `1f4ce0df9bdcb730a9abb4c435e41608158a13731588fd54e0efe0c6fbe06381` | `6a2172ba77323d5a0c25bb40944286574fcdcb7f7b8aec3aa2a777f6c71c7bbe` |
| `functions/.gcloudignore` | new | `a501c613eea4bc2808a816d5d0b3de9c8ecccfbdb4e5cecb64d25c569d9ed750` |
| `functions/index.js` | `2988845a120b1b6c6862eec3dfbffac43ee749b17482ba6c82e2a68aea9ee898` | `adadd2375da370b0dadacd2f0fed27a654c39e2e19630a97bf4f35ceb46272cb` |
| `policy/disabled-proposal.json` | `2326787a18a75eb4837b97b652f52e7b0f61670a4ed5044ce4735cd625ea90c1` | `67c2aa4cbfddef790e566eaa50c79217ab90fd1ae0c78edbfa99c73398c11c42` |
| `preparation.json` | new | `3976167c3435cf57634e42855623911f853cb58391c48d9b5e815fe9125b2eeb` |
| `README.txt` | `cb416137018086bd16d314f29ecf77d7b199640d88af6341ce276251aea1079a` | `72117895256d567f2d894eaa19939ad0b6cfd0b4270cd01711f021f81ceaf3d6` |
| `rollback/firebase.json` | `3b762a131eb4b4898e3bf42810efc017043e5d90061ad329cadf6f93d5c71a20` | `e87125f3ec6439a59ba44d80a6dcc46378a27a0644b0cda30abeafd2efb67e20` |
| `rollback/functions/.gcloudignore` | new | `11937f9436b7d6d123bfdd316625b959d3d140ac34316147b219f5e8f39a985b` |
| `rollback/functions/index.js` | `4277773278a7d8a46bc79cf10a38e656227f243cc5bc03f74be0ace461fb501d` | `7060ac595a8b987152dce53b2b20db23137e41146c8ea6bc4f310460e6b05d34` |

No artifacts removed.

| New local source/test file | SHA-256 |
|---|---|
| `functions/stage0-gcloud-plan.cjs` | `1a5511cea133ca0680cd64ead239085f7fb460a3399a5a7209cf3ad8ee7b6e32` |
| `functions/prepare-priority3-stage0.cjs` | `b5850ef45cd46f2a06d311dd6f3752c8cc521cf747bdd9081463430b8730b79d` |
| `tests/stage0-workflow.test.cjs` | `09deb8f8e4d350b75753e18efb3bb2f0ab0a115bb1f080a4207580e4190b0bf6` |
| `tests/stage0-gcloud-packaging.py` | `0eb136a74d4c296575639fdeb249531f35765d6b37c5d09bdfa213d1417df373` |
| `tests/stage0-assessment-emulator.cjs` | `9d9b82b51fc667e3268e0665b55d3b40cea9e402f9cef4b4a2ceff2ca1340c3f` |
| `tests/stage0-browser-emulator.cjs` | `e04318f7da3f0203578e8b02ba26bf1b35328b143f80fac95cab4e30739fb866` |
| `tests/stage0-pilot-checks.cjs` | `94c0528244728f1cbd412c2e27ff9589d8c79974cdc70b9f940c425fb87df5e0` |
| `firebase.stage0-emulator.json` | `3e3af87af5944c4b9c44d208bd68b24fcb72d29ba7ffc35856d8855994bd4bb8` |
