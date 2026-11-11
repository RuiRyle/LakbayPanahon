# Classroom edge acceptance ? 11 November 2026

Seven checks PASS against the running local demo Auth, Firestore and assessment Functions:
1. Revised assignment invalidates a pending quiz.
2. Removing membership prevents pending quiz advancement.
3. Rejoining does not revive the old membership's pending attempt.
4. Closing assignment prevents pending advancement.
5. Closed assignment cannot issue new attempts.
6. Replaying an identical answer request returns the same revision.
7. Fresh valid classroom attempt still completes after previous invalidations.

Temporary fixture account, class and assignment cleanup completed. No production endpoint or shared policy was changed. The first run hit the configured attempt rate limit; the successful run waited 61 seconds for the rate window to expire naturally.

Scope: mutation setup uses owner REST for temporary records, so this does not independently certify teacher mutation permissions/UI. Answers come programmatically from local demo question keys. Replay simulates a lost response but does not reproduce an actual network disconnection. Completed-receipt concurrent replay, full interrupted-network UI recovery and all-catalog interactions remain separate acceptance work.

Source: tests/classroom-edge-local.cjs. Machine-readable evidence: classroom-edge-local-2026-11-11.json. This running Functions package was staged previously; this result validates that runtime's classroom enforcement, not an automatically redeployed copy of every latest source edit.
