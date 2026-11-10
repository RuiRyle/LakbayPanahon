# Admin account-page layout refinement

7 November 2026 (Asia/Manila). Local source changes; no deployment, permissions/rules change, new database queries or publication implementation.

- Removed the inherited 290px teacher-sidebar offset from the sidebar-free admin shell.
- Added a bounded two-column desktop directory/detail layout that stacks below 900px, with consistent navy/teal surfaces, gold selections, readable labels and 48px controls.
- Distinguished submitted teacher applications from existing-account filters and updated the result heading to reflect the active queue.
- Added an initial selection guide, selected-account heading, and separate access, qualification and recorded-decision sections. Existing IDs and decision services remain intact.
- Account selection focuses the heading and scrolls the detail panel into view on mobile. Existing unsaved-decision and save-time navigation guards remain.
- Added restrained color transitions with reduced-motion support; no decorative dashboard totals or new data fetches.

Validation: 3 account-policy unit tests and 29 browser checks at each of 390px/1280px passed (58 viewport assertions). [Browser evidence](admin-layout-refinement-2026-11-07.json). The initial direct activeElement assertion conflicted between simultaneous viewport iframes; it now records each document's actual focusin event. Desktop screenshot visually inspected at `docs/validation/admin-workspace-local.png` (synthetic fixture). No all-state color-contrast certification is claimed.

Local package `build/student-web-dSCKXW/public` contains 33 pages/602 files with zero missing or rejected references. The running emulator website may still serve its older staged package; building does not update that server automatically. Current-source browser fixtures exercised these changes. Hosted/backend readiness remains unchanged.
