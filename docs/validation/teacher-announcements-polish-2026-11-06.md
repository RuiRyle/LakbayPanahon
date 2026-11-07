# Announcement noticeboard polish - November 6, 2026

Refined visual hierarchy with a warmer green/navy header, message context icon, layered composer and post surfaces, gold accents, readable spacing, rounded filter controls with live saved counts, and a visible editing highlight. Replaced the visible status dropdown with All posts / Published / Drafts buttons; the underlying select remains the shared filter state. Counts derive from loaded posts and trigger no extra database reads.

Added a one-time entrance for classroom context, preview content reveals, and a composer entrance when editing begins. Newly filtered posts use the existing staggered entrance. Hover effects retain stable target positions. System and saved reduced-motion settings cancel motion; listeners are cleaned up on pagehide.

Validation: 42 mocked announcement checks passed across 390px/1280px, including real browser preview/edit animations, motion cancellation, filter counts, draft safety, class context, and pagination. Student Progress (78) and Dashboard (22) regressions passed. Screenshot inspected. Clean build JxoZlq: 32 pages/571 files, zero missing/rejected references. Updated localhost:56738 preview files and verified served code. No live Firebase record changes or hosting deployment.
