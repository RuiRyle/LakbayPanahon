# Classroom opening performance correction — 2026-11-05

Supersedes the earlier height-based classroom motion. Panel height is no longer animated: opening uses a 140 ms opacity fade, closing 90 ms. Disclosure transitions no longer tween height. Clicking a classroom no longer forces smooth scrolling while its layout is changing.

My Classes returns after rendering its own management panel, before roster profile fetching, publication editor rendering, and dashboard rendering. Previously every expansion called loadRosterNames (including profile/report-link work) and built hidden views unrelated to classroom management. Student Progress and other teacher pages retain their existing loaders. Class membership and publication counts still come from the verified classroom detail request; this change does not cache or fabricate counts.

Validation: JavaScript syntax check plus teacher local browser regression, with an explicit check that My Classes does not create hidden dashboard reports. Local preview updated; no production deployment. Actual Firestore request latency can still affect opening time.
