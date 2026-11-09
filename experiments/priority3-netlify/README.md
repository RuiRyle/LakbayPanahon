# Local Netlify proof only

## Standalone HTTP follow-up (9 November)

`local-http.cjs` exposes the existing Lambda bridge through a loopback-only Node HTTP listener. It retains the existing demo-project/emulator guards; it is not a public-host entrypoint. It preserves duplicate credential headers for rejection by the bridge, limits request bodies and suppresses internal exception details. It keeps the existing callable paths so current transport evidence remains applicable.

Run focused tests in PowerShell using the existing local dependency install:

```powershell
$env:NODE_PATH = (Resolve-Path 'build/priority3-stage0-release/functions/node_modules').Path
& 'build/node22/node-v22.23.4-win-x64/node.exe' experiments/priority3-netlify/local-http.test.cjs
```

Five test groups pass, including actual Firebase callable denial over HTTP. This is not authenticated end-to-end or hosted acceptance. See `docs/validation/node-http-local-review-2026-11-09.md` for the credential decision and remaining gates.

Provider artifact follow-up: `package-provider.cjs` uses pinned local official tooling to generate a demo-only ZIP; `inspect-provider.ps1` inspects/unpacks a new checked output directory. See `docs/validation/node-provider-packaging-identity-review-2026-11-07.md` for exact evidence and unresolved credential/hosting gates. These helpers do not authenticate to Netlify or deploy.

## Standalone local package

`node experiments/priority3-netlify/prepare-standalone.cjs` copies only allowlisted sources into a new `build/node-backend-standalone-*` directory and runs locked production installs with scripts disabled under the existing verified Node 22 runtime. It is offline by default; `--allow-download` permits fetching lockfile-selected dependencies when the local cache is incomplete. It does not upgrade dependencies, create provider accounts or deploy.

`node experiments/priority3-netlify/validate-standalone.cjs` checks the prepared package with `NODE_PATH` unset, including its loaded-module boundary, transport tests and refusal of a non-demo project. The full proof can target that package with `LOCAL_ASSESSMENT_PACKAGE`; its fixture SDK and fresh-process recovery use the same isolated dependency install. Test harnesses remain outside the package. This is not a Netlify-generated ZIP or a Linux-hosted acceptance result.

Follow-up: see `docs/validation/node-adapter-validation-2026-11-07.md`. Credential-map ambiguity now fails closed. Demo-only entry permits explicit loopback emulator ports; use `firebase.auth-isolated.json` for a separate matching-project Auth emulator when the classroom emulator has another default project. This does not add production credential support. Current follow-up ran on Node 24; target Node 22/standalone packaging remains unverified.
No deploy/account/production configuration authorized. Service files are exact accepted copies. SDK dependencies resolve from the accepted local install through test-only NODE_PATH; only the Lambda bridge has a separate experimental install. A real Netlify dependency/bundle configuration and credential delivery are not certified by this proof.
