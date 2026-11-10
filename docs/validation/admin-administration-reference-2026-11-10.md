# Administration reference hub — 10 November 2026

Implemented the supplied visual structure using existing supported workflows: illustrated navy/gold banner, four two-column tool tiles, gold line icons and an illustrated Platform Information panel. Added a code-native decorative SVG landscape; no new service or backend capability.

System Status expands monitoring limitations; it never asserts service health. Access & Security explains existing administrator boundaries. Administrative Logs links to Decision Records. Recovery & Support expands guidance, links to Accounts and retains the original contextual recovery control/listener. Existing server authorization, account moderation and decision receipts remain unchanged.

Environment is labelled Local Firebase emulators only when the existing firebaseEnvironment module explicitly reports emulator mode. Otherwise it says Configured Firebase connection. No release candidate designation, last-build timestamp, global health or unsupported monitoring is fabricated.

Files: `js/admin-administration-view.js`, `assets/brand/administration-landscape.svg`, `css/admin-workspace.css`, presentation mount/imports in `js/admin-workspace.js`, `tests/admin-administration-reference-browser.cjs`.

Validation: focused synthetic browser fixtures passed at 1440px, 900px and 390px, checking tile structure, truthful labels, routes, disclosures, preserved recovery listener and overflow. Six decision-receipt recovery unit tests passed. Local build: 37 pages / 616 files, zero missing/rejected references. Screenshots in `admin-administration-reference/` use synthetic local browser fixtures, not production data or a new Firebase security acceptance result.

No deployment, billing, production changes, emulator reseeding or educational logic changes. Previously reported unrelated candidate integrity mismatch remains outside this design pass.
