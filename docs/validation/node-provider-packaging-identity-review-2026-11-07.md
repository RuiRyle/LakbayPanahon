# Provider packaging and runtime identity review

7 November 2026 (Asia/Manila). **PASS for local provider artifact validation; NO-GO for hosted pilot/production.** No provider account, real credential, key export, IAM/Rules change, production request, hosted test, deployment or billing activation. All work remains under isolated experiments/build output and validation documents.

## Artifact actually generated

Installed official `@netlify/zip-it-and-ship-it` **16.6.0** in a separate tooling package with install scripts disabled. Its own manifest/lock do not alter application dependencies. Netlify documents this library as the function bundling mechanism and notes dynamic requires can need explicit inclusion: [Lambda compatibility](https://docs.netlify.com/build/functions/lambda-compatibility/), [official packager](https://github.com/netlify/build/blob/main/packages/zip-it-and-ship-it/README.md).

The local Node 22 packager used zisi and explicit inclusion of the clean service/adapter dependency trees. Produced exactly one `assessment.zip` in `build/node-provider-artifact-hJF0gA`, **20,834,052 bytes**, SHA-256 **`f4b1ce05e00d24ca75fa7c24363e2a636f88ddb4b6a81867f82a221e4e9ca2a7`**. This is now a provider-tool-generated ZIP, rather than the earlier source-only staging. It still contains the demo-only refusal guard and must not be deployed as a production backend.

## Verification evidence

- [Artifact metadata](node-provider-artifact-2026-11-07.json): version/runtime/configuration and ZIP identity.
- [Inspection](node-provider-inspection-2026-11-07.json): inspected 6,252 uncompressed entries (77,370,059 bytes); no dummy environment canary matches, forbidden paths or `.node` binaries. Negative control confirmed the detector recognizes the canary. This tests the injected canary and named path rules, not every possible secret/exfiltration path. No real secret was supplied. Vendor files are included; this is not a claim that every dependency test/documentation file was pruned.
- [Extracted runtime](node-provider-runtime-2026-11-07.json): generated root `assessment.js` entry loads under Node 22.23.4 with `NODE_PATH` unset, 746 loaded files all inside extraction. All 16 adapter/security tests passed; non-demo activation refused.
- [Grading/recovery smoke](node-provider-artifact-smoke-2026-11-07.json): six checks passed through extracted code: five authoritative questions, correct marking, catalog reward, resume receipt, replay without extra XP and matching canonical XP. Synthetic loopback Auth/Firestore and signed test App Check only. It measured 667 minimum read units, 20 committed writes and zero deletes including resume/replay, not a new daily cost projection.
- Accepted Stage 0 still verifies 242 artifacts, 23 sources and 12 copied service files with zero drift. Manifest remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`.

The initial PowerShell script invocation was blocked by the local execution policy; a process-only execution setting ran the reviewed inspection script without changing system policy. Extraction used a new workspace directory, never replacement/deletion. The dedicated test Auth process was stopped; existing classroom preview was not restarted. No Linux/provider gateway or hosted cold-start assertion is made.

## Runtime identity: design only, still blocked

Firebase supports Admin SDK operation on non-Google servers, but it needs an accepted credential flow; default initialization is not proof a Netlify runtime can authenticate. [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).

1. Prefer a verified short-lived runtime federation integration if its actual issuer/audience/Google trust mapping can be demonstrated. This review did not establish a documented general Netlify Functions-to-Google runtime federation path. Build-time identity is not runtime identity. Do not describe keyless operation as ready.
2. A dedicated service-account key is a possible fallback, **not approved or implemented**. It would require an explicitly reviewed bootstrap/credential delivery change, scoped IAM, rotation/revocation, provider/operator access controls, and verification that no build, preview, frontend, archive or log receives it. The current entry intentionally refuses production and the accepted service initializer was not modified to parse a key environment variable.
3. Netlify's documentation makes granular environment-variable scopes a **Pro/Enterprise** feature; defaults apply to all scopes. Do not assume Free supplies Functions-only isolation. A key-based Free design cannot pass solely because a dummy canary was absent from this benign local artifact; trusted build code could still read its environment. The real build/preview/release boundary must be separately proven or the design rejected. [Environment scopes](https://docs.netlify.com/build/environment-variables/overview/).
4. Runtime variables must be provided through supported UI/CLI/API settings; `netlify.toml` values are not runtime function variables. Lambda compatibility also has a total environment-size constraint. Actual credential configuration would need explicit size/configuration verification, not a guessed JSON budget. [Functions environment](https://docs.netlify.com/build/functions/environment-variables/).
5. A trusted backend credential must not provide Owner/Editor, deployment, billing, content editing or user-administration privileges incidentally. Exact available IAM granularity and residual database-wide power still require review. Admin SDK access does not gain per-student isolation from client Rules; the accepted server checks remain essential.

## Readiness decision

Local packaging is no longer the blocking uncertainty. Remaining gates include real runtime identity/secret isolation, dependency-risk disposition, production Auth/App Check, no-billing backup/restore acceptance, full-app quota headroom, all-endpoint abuse controls and authorized hosted acceptance. Provider eligibility/no-payment onboarding is not established by downloading a public npm tool. No account should be created, key exported or billing enabled based on this report.

Next local work is a concrete host/identity decision proposal against these gates, not further dashboard expansion. Admin remains accounts/teacher verification/platform oversight; content management stays outside its study role.
