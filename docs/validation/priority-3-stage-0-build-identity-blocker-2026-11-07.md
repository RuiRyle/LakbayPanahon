# Stage 0 reconciliation — stopped at the build-identity requirement

7 November 2026. **No new configuration candidate was created.** The user's explicit condition was to stop if the selected build account could not be bound through the existing deployment workflow. That condition was reproduced locally before changing any source configuration or release artifact. Production remains NO-GO; no Stage 1 action is requested or authorized.

## Evidence

The existing prepared workflow uses `firebase deploy --only functions` with installed Firebase CLI **15.33.0** and Functions SDK **7.4.0**. Inspection of the SDK option definitions, Firebase configuration schema, Functions deployment code and Gen 2 conversion path found runtime-account support but no exposed custom build-account binding in this installed path.

Offline probes invoked the CLI's actual `functionFromEndpoint` converter for all four secured endpoint names, with the proposed runtime account, minimum 0, maximum 2 and concurrency 8. No API request was made by the probe. Runtime identity and all three limits were correctly included in generated `serviceConfig`; a proposed build account supplied as `buildServiceAccount` and `buildConfig.serviceAccount` was **omitted** from generated `buildConfig` in all four cases.

The converter constructs a new build configuration containing runtime, entry point, source and environment variables. Its `serviceAccount` mapping targets **runtime** `serviceConfig.serviceAccountEmail`, not build `buildConfig.serviceAccount`. A custom entry in an inert JSON file, unsupported Firebase config property or build environment variable would not satisfy explicit identity binding. I did not patch vendor CLI code, change project defaults, upgrade tooling, grant privileges or use an alternative deployment system.

This is a finding about the **installed existing workflow**, not a claim that Google Cloud lacks custom build identities. Google's documented `gcloud functions deploy --gen2 --build-service-account=projects/PROJECT_ID/serviceAccounts/SA_EMAIL` supports an explicit build identity, but switching to that path requires a reviewed plan preserving callable metadata, Auth/App Check, invocation policy, configuration, release readback and rollback. It was not adopted or executed. [Official custom-build-account documentation](https://docs.cloud.google.com/functions/docs/building).

## Proposed settings versus preserved candidate

| Item | Accepted Option A candidate, unchanged | Approved target, not applied |
|---|---|---|
| Maximum instances | 10 per callable | 2 per callable |
| Concurrency | Not explicitly configured | 8 |
| Minimum instances | Not explicitly configured | 0 |
| Attempt TTL proposal | 7200 seconds | 7200 seconds |
| Starts/minute proposal | 10 per student | 3 per student |
| Daily starts proposal | 200 per student | 60 per student |
| Runtime account | Explicit `assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com` | Same |
| Build account | Not explicitly bound by existing workflow | `assessment-build@lakbaypanahon-1797e.iam.gserviceaccount.com` |
| Protocol | Inert proposal `enabled:false`; no live policy activation | Remain disabled |

The server already accepts policy-supplied limits and preserves same-request recovery before checking new-issuance quotas. No assessment logic change is proposed to alter those limits. Because the build-identity gate failed first, policy and runtime settings were not partially edited or packaged as if complete. All-endpoint UID throttling remains unimplemented and outside this task.

## Manifest, hashes and production baseline

- **New manifest hash: none.** The accepted manifest remains SHA-256 `126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f`.
- Changed release source hashes: **none**. Changed release artifact hashes: **none**. All 15 manifest source entries and 235 artifact entries match their stored hashes.
- Accepted candidate, all four secured endpoints, protected rollback, rules, dependencies, grading/reward code and seven Hosting payloads remain intact. No archive/move/delete of the accepted candidate was needed because it was not modified.
- Fresh read-only production verification at **14:31:50 Asia/Manila**: Hosting `b984eba31379723a`, all 575 baseline path hashes, Hosting configuration and active rules match. Active rules hash `678be315fa0aecdbb09fc3cb88294c0f69493056e8c50389a254500234ac0496`. Billing is still unlinked.
- No billing/API/IAM/account/App Check operation, deployment, live student-record write or Priority 4 work occurred.

Evidence files: `priority-3-stage-0-build-identity-probe-2026-11-07.json`, `priority-3-stage-0-reconciliation-result-2026-11-07.json`, and the refreshed read-only `priority-3-final-blocker-production-check-2026-11-07.json`. Only these audit records and this report were written locally; the previous checklist was not changed.

## Test status and next decision

Performed: four offline request-conversion checks, complete manifest source/artifact hash checks and read-only production-baseline comparison. **No new emulator, browser or policy acceptance run was performed**, because no candidate correction was made after the required stop condition. The accepted Option A's 206 unit / 32 integration / 11 browser passes remain prior evidence, not tests of new pilot configuration.

Next decision: authorize a **local-only revised deployment-workflow plan** capable of explicit custom build identity, or provide an existing approved supported workflow to inspect. That plan must demonstrate build/runtime account separation, exact limits and disabled protocol without default-account fallback, SDK/dependency upgrades, callable-security changes or production execution. It is a Stage 0 workflow decision, not a Stage 1 billing request.

Other existing gates remain: all-endpoint throttling disposition, dependency-risk decision, production App Check repair/attestation, billing/API/IAM/backup/monitoring setup and separately approved publication/hosted acceptance. **Await review; do not continue with a different workflow automatically.**
