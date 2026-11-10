# Administrator transitions and loading — 10 November 2026

All five administrator HTML pages now include the existing shared Student/Teacher loading-shell stylesheet, an accessible synthetic startup shell and an independent local `js/admin-loading.js` startup handler. The shell remains until both authorization and initial workspace task completion, including failures where the authenticated workspace can show its actual error. Slow startup exposes a reload action after ten seconds without authorizing content or changing account data. Existing guard-recovery dialogs and authorization remain unchanged.

The administrator sidebar previously prevented the shared transition listener from seeing its clicks and navigated directly with `location.assign`. It now routes through `navigateAdmin` after the same asynchronous leave/unsaved checks. That helper uses the existing same-origin anchor/compass transition. Modified clicks retain native behavior; reduced-motion uses the shared handler's native-navigation path. Existing beforeunload and save-reconciliation protections are unchanged.

Changed: five administrator pages, `js/admin-workspace.js`, `js/admin-loading.js`, `css/admin-workspace.css`; updated navigation fixture and added `tests/admin-transition-loading-browser.cjs`.

Passed: 39 local HTTP browser lifecycle/navigation checks across desktop/mobile (five routes, hidden protected shell during startup, authenticated-but-data-loading state, clearing loading, canceled navigation, compass creation, arrival cleanup, reduced motion and ten-second fallback); 15 sidebar fixtures across five pages and three widths; six decision-receipt recovery unit tests. The browser lifecycle test uses synthetic authorization/readiness and the actual extracted navigation and loading code, not Firebase security acceptance. Local build passed: 37 pages / 614 files, zero missing/rejected references.

Screenshots: `admin-transition-loading/startup-1380.png`, `startup-390.png`, `compass-1380.png`, `compass-390.png`. No production access, deployment, billing, data seeding or educational changes. The previously reported unrelated accepted-candidate hash mismatch is not cleared by this UI work.
