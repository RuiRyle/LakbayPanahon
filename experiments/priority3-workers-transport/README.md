# Bounded local REST transport proof

Do not deploy this experiment. It accepts only synthetic demo-emulator traffic, uses an emulator administrative REST header, substitutes a fixed generated test public key for App Check JWKS acquisition, and exposes local metrics. None is a production credential or authorization design.

The unchanged assessment core and shared educational modules are imported from the earlier isolated service copy. There is no Firestore Admin SDK, Google gax, gRPC or Firebase Functions import in the Worker graph. Isolated Admin Auth and App Check modules use their existing verification APIs; a fixed local trust fixture supplies the App Check public key, never a request parameter. Production key discovery/OAuth remain untested.

`rest-store.mjs` implements the core's transaction interface with beginTransaction, batchGet, runQuery, commit and rollback. Writes wait until reads complete; create/update preconditions and server timestamps remain server-side. Only ABORTED reruns the whole callback, at most five attempts. An unknown commit outcome returns an error for same-request recovery, rather than blindly awarding again. Value types outside the supported assessment subset fail closed.

`proof.cjs` seeds the existing pinned educational catalog in a demo database, generates a throwaway RSA key, starts localhost Wrangler/workerd, runs the operations and security/concurrency/recovery checks, attempts inspector profiling and stops its own process tree. It does not start a classroom-scale load or implement content workflows/DO authority. Local state, fixture trust and dependencies are excluded from source control.

To reproduce, use the existing Node 22, Java, Firebase CLI, accepted Firebase dependencies and Wrangler toolchain from `../priority3-workers-restricted/toolchain`. From the workspace root, unset DEBUG and run `firebase emulators:exec --only auth,firestore --project demo-lakbaypanahon --config experiments/priority3-netlify/firebase.emulator.json "node experiments/priority3-workers-transport/proof.cjs"`. Follow tool approvals. Ports 8180, 9099, 8798 and 9238 must be available. No deployment command is provided.

Results and limits are recorded in `docs/validation/priority-3-workers-transport-review-2026-11-07.md` and its associated JSON/log/profile artifacts. Stage 0 must remain unchanged.
