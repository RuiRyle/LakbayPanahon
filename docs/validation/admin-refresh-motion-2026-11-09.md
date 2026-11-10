# Compact refresh and dashboard motion

9 November 2026. Removed the separate Refresh snapshot button row from the Overview. A compact circular SVG refresh button now sits alongside the last-successful-update time in the topbar; mobile retains an accessible 44px refresh target. The successful-status text remains available to assistive technology without taking visual space. Loading and stale-snapshot/error feedback remain visible when relevant.

Added brief 280ms entrance effects, light summary-card staggering, restrained hover transitions and refresh-icon rotation while loading. These do not delay navigation, queries or controls. OS reduced-motion preferences and the existing application reduced-motion class suppress effects. No perpetual decorative motion was added.

Final checks additionally verify refresh failure is visible, retry remains available, loading marks aria-busy and disables duplicate clicks, success stops the loading state, and reduced-motion disables entry effects. Header timestamp clears when the workspace resets; refresh is disabled during another workspace operation or without a signed-in user.

Changed `pages/admin-dashboard.html`, `js/admin-workspace.js`, `css/admin-workspace.css`, `tests/admin-workspace-browser.cjs`. All **172 local browser-fixture checks passed** at 390/1280px; accepted Stage 0 validation and scoped whitespace checks passed. Synthetic screenshots at 1380/900/390px have no horizontal overflow; desktop was visually inspected. Captures precede only the final refresh-busy/reset-state hardening, which does not alter the settled layout.

- [Desktop](admin-refresh-motion/overview-1380.png)
- [Tablet](admin-refresh-motion/overview-900.png)
- [Mobile](admin-refresh-motion/overview-390.png)

This uses mocked local browser records, not live Firebase. No new query, listener, permission, real account, grading, reward, progress, billing, deployment, accepted candidate or Git push change.
