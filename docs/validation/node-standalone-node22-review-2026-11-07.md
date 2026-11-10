# Standalone package and Node 22 validation

7 November 2026, Asia/Manila. **PASS for local standalone/target-runtime validation. Hosted pilot and production remain NO-GO.** No external account, real credential, production request, billing, IAM/Rules change or deployment. The held Workers experiment was not resumed.

## Package and installation

Created `build/node-backend-standalone-zolfYL` from 12 exact accepted service files plus the experimental bridge, demo-only entry and existing adapter package/lock. Both production dependency installs completed using Node **22.23.4**, `npm ci --omit=dev --ignore-scripts --no-audit --no-fund`, with no version upgrades. The initial offline attempt stopped because `qs-6.17.1.tgz` was not cached; its failed report/log are retained. A new isolated directory then fetched dependencies selected by the existing lockfiles. No accepted lockfile or dependency policy was modified.

The bridge resolves Express from the service package's dependency tree rather than requiring a workspace-level module. Local preparation/validation scripts record the package inventory and installation exits. The Node 22 ZIP SHA-256 was rechecked as `cbc74b5e0982c9dbb41525fd8fb5dcd32fbee237863f7829072f4639a1ce5f20`, matching the existing local official-manifest verification record; no global runtime was changed.

## Verification

- [Package preparation](node-standalone-package-2026-11-07.json): both locked installs exited zero; all copied service hashes match accepted artifacts.
- [Standalone validation](node-standalone-validation-2026-11-07.json): Node 22 loads 745 files with **zero outside-package modules** and `NODE_PATH` unset. Four boundary tests and 12 adapter/security/meter tests passed. A non-demo project is refused. The graph check concerns module initialization, not a trace of every later dynamic import.
- [Full standalone proof](node-standalone-full-proof-2026-11-07.json): all 18 security/recovery groups passed using Node 22 and the isolated package's SDK, with `NODE_PATH` unset. Both fresh-process recovery and fixture SDK imports use that same dependency install. No core logic was rewritten for packaging.
- Mission cohorts: 1, 5, 10, 30 and another 30 saves completed; each cohort had zero failed saves. Same-ID receipts, no duplicate rewards, mixed rewards, failed commit, acknowledgement loss, legacy values, expiry and access/security denials remain covered.
- Source integrity: 242 Stage 0 artifacts, 23 recorded sources and all 12 copied service files verified, zero drift. Manifest remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. Prepared package source inventory also had zero drift after install.

`node-standalone-full-proof-2026-11-07.log` captures the exact full-proof child output. The separate loopback Auth emulator on 9199 was stopped after testing; the existing classroom emulator/preview session was not restarted. Firestore fixtures remain synthetic in `demo-lakbaypanahon`, separate from `demo-lakbay-local`.

## What this does not prove

This is a standalone dependency directory on Windows, not a provider-generated deployment ZIP or Linux build. Production Auth certificates/revocation, real App Check, supported runtime credentials and secret isolation are not demonstrated by emulator tokens and signed test trust. Existing dependency findings remain; no new audit exception or forced upgrade was applied. Existing logs can contain expected metadata-discovery timeout warnings; no real credential was supplied.

Full-app Firestore quotas, provider capacity/cold starts, real HTTPS/CORS/gateway behavior, production backup/recovery and rollout remain unaccepted. Local concurrency success is not a hosted service guarantee, and it does not change the Workers failure or demonstrate a cost-free system.

## Next bounded work

Review a provider-specific local deployment artifact and runtime-identity design, including credential-free build/preview boundaries and the outstanding dependency disposition. Do not create accounts, export keys, configure IAM, deploy, run hosted tests or activate billing without separate authorization. Admin scope remains user/teacher verification and platform oversight, not content management.
