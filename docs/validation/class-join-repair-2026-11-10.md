# Local classroom join repair — 10 November 2026

## Confirmed source defect

The updated `student-class-client.js` reads/writes `studentClassSlots/{uid}` together with membership. The normal `firestore.rules` included these permissions, but `firestore.assessment.rules` did not. The secured local launcher calls `prepare-local-assessment.cjs` → `admin-review-rules.cjs`, which derives its active local rules from `firestore.assessment.rules`. Therefore a current local frontend paired with those older secured rules denies its reservation operation and cannot finish joining, even for a valid code.

Copied only the reservation scope and paired membership-create guard into the secured rule source. Canonical assessment writer restrictions and the local administrator overlay remain intact. Added a regression comparing both rule contracts and verifying that the local overlay preserves them. No weaker client-only fallback was introduced.

## Verification and limits

- 18 local tests pass: join-rule parity, local admin overlay, invitation/session checks, one-class reservation behavior and local setup invariants.
- My Class mocked Chrome check passes: join/leave, published assignments, fresh classroom completion versus solo progress, feedback acknowledgement, unavailable data and session isolation.
- Actual dialog Chrome fixture passes: confirm/cancel, focus, session and page cleanup.
- Read-only connection probes found no server listening at local ports 4173, 5500 or the emulator hub at 4400 during this check. This does not identify the user's actual browser URL. The user was asked for the URL and exact failure text; no answer had arrived when recording this result.
- Additional synthetic Rules API verification was attempted but could not authenticate because the saved CLI credentials expired. No rule deployment, production document read, account creation or data reset occurred. Successful offline/browser tests are not a claim of a new live classroom round-trip.

## Apply to the local classroom website

The launcher's rule file and frontend are staged when it starts. An already running session must be restarted to pick up this fix. If its demo records matter, first run `npm.cmd run backup:local` while the session is running, note the returned snapshot identifier, stop the original launcher, then restart with `npm.cmd run start:local -- --restore=SNAPSHOT`. Without a saved session to preserve, `npm.cmd run start:local` creates the normal synthetic demo environment. Do not run a second launcher or reset records merely to repair permissions.

Open the printed local URL and use accounts/codes from that same environment. Production teacher codes and demo teacher codes belong to different databases. Static/hosted pages also require a frontend containing the reservation writer; the rules/source mismatch fixed here specifically concerns the secured local launcher.

The classroom submission separation remains a matching frontend/backend/rules change as documented in `classroom-submissions-2026-11-10.md`. It is distinct from creating membership; the fix here repairs the shared class-join contract.
