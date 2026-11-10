# Node-compatible transport follow-up validation

7 November 2026 (Asia/Manila). **PASS for this bounded local validation; hosted pilot and production remain NO-GO.** User authorized local validation only. No external account, real credential, IAM/configuration change, production request, deployment or billing activation. Workers transport remains on hold. Neither admin nor teacher gains content-management powers.

## Changes and findings

Changes are confined to `experiments/priority3-netlify` and local evidence. New transport-only tests reproduced three shortcomings in the Lambda bridge: duplicate case-variant credential names reached dispatch, inconsistent single/multi-value header maps reached dispatch, and a null multi-value credential caused an exception. These tests use dummy handlers to establish adapter dispatch behavior; they do **not** demonstrate an authentication bypass against the secured SDK.

The adapter now rejects duplicate credential names, conflicting representations, malformed credential values and comma/newline-joined credentials before dispatch. Matching single/multi representations remain compatible. Blank credentials continue through the unchanged SDK and receive its existing 401 behavior. The initial broader run returned 400 instead of its expected 401 for blanks; that compatibility difference was corrected without weakening Auth/App Check. Initial boundary failure output is retained in `node-adapter-boundaries-before-2026-11-07.log`.

The existing shared Auth emulator's default project was `demo-lakbay-local`; the Node prototype uses `demo-lakbaypanahon`. Initial browser login failed because the emulator's public API uses its default project independently of its API key. A dedicated Auth emulator at 127.0.0.1:9199 served the matching synthetic project; the user's 9099/4173 classroom session was not restarted. Experiment-only port guards/fixture compilation now accept explicit loopback ports while retaining the exact demo-project restriction and rejecting `FUNCTIONS_EMULATOR=true`. No production activation path was added. The dedicated Auth process was stopped after testing; synthetic assessment data remain only in the separate demo Firestore project.

## Final results

| Verification | Result |
|---|---|
| Credential-boundary tests | 4 passed |
| Existing bridge/security/meter tests | 12 passed |
| Source allowlist/package canary test | 1 passed; source staging only |
| Actual Firebase web SDK through local Lambda bridge | Started/resumed same five-question attempt; unsigned request 401 |
| Full adapter/core emulator proof | 18 security/recovery groups passed |
| Cohorts | 1/5/10/30/30 successful mission saves; zero failed cohort saves |
| Stage 0 integrity | 242 artifacts, 23 sources, 12 copied service files verified; zero drift |

The full proof includes invalid/missing/foreign/expired Auth/App Check cases, callable/CORS behavior, forged inputs, same-ID and stale-revision behavior, fresh-process receipt recovery, failed commit, physical loopback acknowledgement loss, mixed same-user rewards, daily/chapter rewards, legacy progress/timestamps, expiry/start quotas and disabled accounts. It uses signed synthetic App Check trust and emulator Auth, not real provider attestation.

Each measured cohort mission lifecycle used 660 minimum document-read units and 20 committed writes per student. Each 30-user wave used 19,800 reads and 600 writes. These are the existing shallow-history sampled workload, not whole-app/day costs or an improved quota budget. No accepted selection, grading, reward, transaction or query logic was changed. Free-plan feasibility is not established by the transport pass.

Evidence: [unit results](node-adapter-unit-2026-11-07.json), [full proof](node-adapter-full-proof-2026-11-07.json), [web SDK](node-adapter-web-sdk-2026-11-07.json), `node-adapter-full-proof-final-2026-11-07.log`. Initial shared-project browser failure and initial blank-header compatibility failure remain in their separate logs. Final child exits were captured directly rather than interpreting PowerShell's stderr handling as a test failure.

## Remaining blockers

- Runtime here was **Node v24.22.0**; the accepted package targets Node 22. A clean target-runtime check remains necessary.
- Dependencies still resolve through test-only `NODE_PATH` from an existing install. Allowlisted source staging is not an executable provider-generated bundle. No clean standalone dependency package/native tracing or actual provider build was certified.
- Production Auth revocation/JWKS, App Check attestation, supported runtime credential delivery, preview/build isolation and hosted CORS/gateway behavior remain unverified.
- No integrated compact-catalog authority, all-endpoint admission control, full-history daily cost proof or production backup/restore acceptance was added.
- Emulator timing is not a hosted latency/CPU/cold-start guarantee. Metadata discovery emitted local timeout warnings; no credential was supplied to turn them into production access.

Stage 0 manifest remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. This result supports further local standalone Node packaging/target-runtime validation, not deployment or an assertion that the service is free to operate. Stop before accounts, secrets, hosted tests, infrastructure changes or billing unless separately authorized.
