# My Profile explorer identity refinement

Presentation-only implementation: body class and final stylesheet link in pages/my-profile.html; css/explorer-profile.css. No application JavaScript, hooks, user fields, API requests, reward policy, frame storage or pinning logic changed.

Design: compact page heading; prominent horizontal explorer identity with larger avatar and retained equipped frame; aligned name/title/account status/edit action; four consistent progress statistics; scrapbook wall with compact collection/journal links and refresh; larger collectible reward previews with equipped/unlocked/locked states; clean account detail fields and compact three-link navigation. Existing frame-specific outlines are explicitly retained. Empty wall status has a restrained dashed presentation using existing text. Mobile identity and statistics stack responsively; reduced-motion supported.

Validation:
- tests/student-profile-browser.cjs passed existing edit/setup, avatar catalog recovery, name-only save, dynamic avatar choices, preview, save confirmation, pending-save dismissal and hostile-text checks.
- tests/student-missing-features-browser.cjs my-profile.html passed frame save failure/recovery, equipped-state persistence, locked rewards and cross-account cleanup at desktop/mobile.
- tests/explorer-profile-browser.cjs passed actual page/styles/profile/reward/wall modules at 1440, 768 and 390px using simulated profile/catalog records. Checked all four stat values, full-width identity layout, title, both edit controls, three-pin limit, unpin/refresh, frame save/paint and double outline, locked button state, quick routes and horizontal overflow. No runtime errors or unhandled rejections observed during tested interactions.
- Inspected Chrome screenshots of desktop identity/statistics/wall and mobile rewards/details; fixed an inherited implicit grid column leaving unused desktop space and preserved frame outline specificity.
- Browser tests use isolated simulated data and storage; no real student records were modified. No live Firebase persistence verification or deployment performed.
- Local build build/student-web-8Vl2Ip/public: 33 pages, 599 files, zero missing/rejected references.

Previews: explorer-profile-desktop.png, explorer-profile-mobile.png, explorer-profile-rewards-mobile.png.
