# Concurrent submission and retry ? 11 November 2026

Four local integration checks PASS against actual demo Auth/Firestore/Functions: three simultaneous submissions return the same saved result (excluding the explicit replayed transport marker), completion succeeds, later receipt replay leaves XP unchanged, and exactly one public quiz-attempt record is stored. Temporary fixture cleanup completed.

Nine secured client tests PASS, including a new lost-submission-acknowledgement scenario: the same attempt and revision remain available and are reused on retry. The fake transport now supports a lost response for submit as well as issuance/answer requests.

Run: node tests/classroom-edge-local.cjs --receipt-only. Existing default mode retains revision/removal/rejoin/closure checks and naturally waits for the configured rate-limit window. No production or shared policy changes.

Limitations: local integration uses programmatic answers and owner-seeded temporary classroom records. The client loss test injects a transport exception; a real disconnected-browser recovery interaction is not yet certified. The deployed local Functions package predates some recent frontend/source edits. Final matched packaging and learner walkthrough remain open.
