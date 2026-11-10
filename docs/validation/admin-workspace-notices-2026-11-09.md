# Workspace Notices consistency refinement

9 November 2026. Local UI-only refinement of `js/admin-workspace.js`, `css/admin-workspace.css` and `tests/admin-workspace-browser.cjs`.

Workspace Notices now uses a gold announcement SVG, the same header/divider pattern and header height as Decision Activity, and a compact blue information box with a decorative information symbol, gold label and readable role-boundary explanation. Monitoring limitations remain visible below the box. No service-health indicators or new actions were invented.

All 156 local real-module Chrome/mock-Firestore assertions passed, including new notice structure and actual role/monitoring-boundary text checks. Synthetic previews at 1380/900/390px have no horizontal overflow. Desktop screenshot was visually inspected for adjacent-panel alignment. The final header-height alignment is included in the captures. These are local fixtures, not production data or a new emulator workflow run.

- [Desktop](admin-workspace-notices/overview-1380.png)
- [Tablet](admin-workspace-notices/overview-900.png)
- [Mobile](admin-workspace-notices/overview-390.png)

Accepted Stage 0 validation and scoped whitespace checks passed. No permission, backend, record, educational-content, reward, grading, billing, production, deployment or Git push change.
