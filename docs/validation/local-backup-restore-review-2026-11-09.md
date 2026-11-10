# Local backup and restore

9 November 2026. Snapshot creation and restore passed for the synthetic secured local session. `tools/backup-local-emulator.cjs` created `build/local-backups/2026-11-09T03-46-09-462Z` with Firebase Auth and Firestore exports and a local project marker. Older snapshots are not overwritten.

Restarted the test-owned emulator session with `node tools/start-local-emulator.cjs --secured --restore=2026-11-09T03-46-09-462Z`. Imports restored the student login and XP 40. All four callable authentication probes passed before the website opened; restore skipped the synthetic seeder. Stage 0 integrity validation passed.

The first restore check exposed an endpoint discovery race. The launcher now waits through HTTP 404/503 until each endpoint returns the expected 401/UNAUTHENTICATED response, with bounded startup attempts. Other authentication failures stop startup.

This is explicit snapshot persistence, not automatic saving to disk: back up before shutdown. Pause user activity during export; Auth and Firestore exports are not an atomic cross-service transaction. Backup restore is local only, not disaster recovery for a public service. Keep the export directory local; it contains account and learning records. No production credentials, deployment or billing activation was used.

After the later classroom/progression checks, a second snapshot was created at `build/local-backups/2026-11-09T03-50-37-108Z`. The first snapshot remains available. The second snapshot's creation passed; its restore was not separately repeated.
