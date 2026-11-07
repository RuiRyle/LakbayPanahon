# Local compatibility investigation only

These files are deliberately unsafe to deploy. `worker.mjs` includes a caller-supplied App Check **test** public key, emulator administrative REST access and unauthenticated probe routes. They establish isolated runtime compatibility, not a production security boundary. No real credentials belong here.

`full-sdk-attempt.mjs` preserves the unsuccessful full Firebase SDK import attempt. `worker.mjs` isolates Auth, App Check, a minimal REST transaction and SQLite generation coordination. The existing assessment implementation is imported without modification; only its marking helper is exercised in workerd. The complete grading, rewards and publication workflow has not been ported.

The pinned Wrangler toolchain and lockfile are separate from application dependencies. Installation reported skipped package scripts; no install-script approval was bypassed. All runtime state, npm cache and dependencies are ignored here.

Evidence and design: [review](../../docs/validation/priority-3-workers-restricted-authority-review-2026-11-07.md), [probe results](../../docs/validation/priority-3-workers-restricted-probes-2026-11-07.json).

Reproduction requires the existing local accepted Firebase dependencies, Node 22, Java and Firebase CLI. Run Wrangler with `dev --local --config wrangler.jsonc --ip 127.0.0.1 --port 8797 --inspector-port 9237 --persist-to .local-state/runtime` from this directory, with metrics disabled and no Cloudflare credentials. From the workspace root use the existing `experiments/priority3-netlify/firebase.emulator.json` with `firebase emulators:exec --only auth,firestore --project demo-lakbaypanahon` and command `node experiments/priority3-workers-restricted/probe.cjs`. The probe requires demo project / localhost emulator environment variables supplied by emulators:exec. Stop Wrangler afterwards. Follow tool approval requirements; do not substitute hosted services. No deployment command is provided.
