# Signed Node HTTP workflow validation

9 November 2026. **PASS: six local scenario groups, zero failures in the final run. Public deployment remains NO-GO pending host/credential acceptance.**

The new `experiments/priority3-netlify/local-http-workflow.cjs` exercises the standalone HTTP entrypoint through actual loopback network requests and the existing callable wrappers. It uses the dedicated `demo-lakbaypanahon` Firestore namespace on localhost:8180 and separate Auth emulator at localhost:9199. It does not seed or reset the owner's `demo-lakbay-local` classroom project or contact production Firebase.

| Check | Final result |
|---|---|
| Real emulator Auth with invalid App Check | PASS: denied |
| Signed start, identical issuance replay, resume | PASS: same attempt |
| All five issued answers and adaptive follow-up | PASS |
| Four simultaneous duplicate submissions | PASS: all passing, exact 45 mission XP, completed progress and artifact present |
| Discard acknowledged result, then resume and resubmit | PASS: result recovered and XP unchanged |
| Account disabled after token issuance | PASS: denied |

See [machine-readable result](node-http-workflow-2026-11-09.json). The preliminary run also passed; final assertions were strengthened to verify the exact mission reward and persisted progress/artifact, then the entire scenario was rerun successfully. Accepted Stage 0 validation also passed.

This is a bounded local regression, not a repeatable capacity bound or certification of all concurrency histories. Discarding an already acknowledged result models caller recovery; it does not simulate an ambiguous Firestore commit, process crash or actual network response loss. App Check uses the existing generated signing fixture and SDK key-fetch override, not production attestation. No hosted TLS, cloud IAM, production Rules, cold starts or free-provider quota enforcement was tested.

The script resets the dedicated experimental Firestore namespace before seeding its pinned catalog; do not run it against a namespace containing work to preserve. Synthetic results remain there for inspection. The separately started Auth emulator was stopped after testing; the existing classroom emulator session was left running.

Reproduce under the prepared Node 22 runtime with the existing accepted dependency install in test-only NODE_PATH. Set GCLOUD_PROJECT=demo-lakbaypanahon, FIRESTORE_EMULATOR_HOST=127.0.0.1:8180 and FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9199. Start only the isolated Auth config supplied in this experiment; the Firestore emulator must already be available. No real credential is required.

Next external gate remains the [host-and-identity review](external-node-credential-review-2026-11-09.md). No application UI, grading, reward policy, accepted candidate or production configuration changed in this follow-up. No billing or deployment occurred. These new files are local follow-up work after the earlier main-branch checkpoint; they have not been pushed.
