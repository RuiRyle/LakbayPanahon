LOCAL CANDIDATE ONLY - NOT DEPLOYED OR ACTIVATED

Hosting is a REST file-map overlay, not a complete directory deploy. Reuse unchanged hashes from the pinned live version, and upload only hosting/uploads payloads. Do not deploy hosting/public as a whole site. Recheck live version, rules, file map and configuration before a later approved release. No production publish command is included in the builder.

Deploy only the four reviewed endpoints from functions, with billing/APIs and the explicitly named runtime/build identities separately approved and provisioned. Use the disabled policy proposal only after approval; it is not a migration or write script.

Rollback: keep restrictive rules, disable rollout policy and gate Admin endpoints or publish the deny-only rollback/functions package. The rollback Hosting map reuses the candidate map plus its holding facade: a future uploader may need payloads from BOTH hosting/uploads and rollback/uploads. Never restore baseline/firestore.rules as incident rollback. Retain committed learner data.

See docs/validation/priority-3-local-readiness-preparation-2026-11-07.md for gates, risk decisions and verification limitations.
