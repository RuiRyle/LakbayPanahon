# Smooth classroom motion — 2026-11-05

The classroom accordion opens with a 340 ms height/fade ease-out and closes in 220 ms. Height is measured from actual content; there is no fixed max-height that truncates large classrooms. Temporary animation styles are removed after completion. Rapid repeated card clicks are ignored during the transition, avoiding overlapping animations. System and application reduced-motion settings skip motion and cancel running panel animations. Page cleanup cancels the active animation.

Existing card hover remains stationary. Cards no longer run CSS and JavaScript entrance animations together; classroom panel children skip the generic entrance observer to avoid compounded movement. Supporting details controls use native details-content height/opacity transitions where supported, with instant native disclosure as the fallback. Reduced motion disables these transitions.

Validation uses the existing local teacher browser regression including open/close, mobile scrolling, full-card pointer hit area and reduced motion. No database or production deployment changes.
