# Render dependency verification — 11 November 2026

Updated functions/package-lock.json with compatible npm audit fixes (no force flag or major-range edit). Installed using bundled Node 22.23.4 and npm ci --prefix functions --omit=dev --ignore-scripts, matching Render's install mode. Install reports zero known vulnerabilities, down from six moderate and one low. This is a point-in-time registry audit, not a guarantee against all vulnerabilities.

All 26 focused tests passed under Node 22.23.4: Render HTTP/authentication denial, classroom issuance/revisions/replay, pre-submit answer privacy, secured-client retry/endpoint configuration, read-only connection checker and local debug-token replacement.

No production policy activation or student writes. Latest patched deployment must reach Live before enabling the test quiz. The user confirmed the read-only authenticated Render/App Check/Firestore diagnostic passes using their replacement browser token; token values are not recorded here.
