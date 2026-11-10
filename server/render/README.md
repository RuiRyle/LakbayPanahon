# Render assessment transport

Run from repository root: `node server/render/server.cjs` after installing locked dependencies with `npm ci --prefix functions --omit=dev --ignore-scripts`.

Defaults to disabled grading and exposes `/healthz` without credential loading. Production activation requires explicit configuration, Render's secret-file path, Firebase Auth and App Check. Uses current shared assessment handlers, not retired `server/assessment` or experimental copies.

Follow `docs/render-free-setup.md`. Hosted operation and credential/IAM setup remain unverified. No Render service has been created by this code change.
