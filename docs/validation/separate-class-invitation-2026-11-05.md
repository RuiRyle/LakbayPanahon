# Separate classroom and invitation sections — 5 November 2026

Teacher My Classes now separates the selected active classroom workspace from its invitation panel. The classroom section contains identity, saved counts, teaching actions and secondary edit/archive rows. Invitations form an independent section below it; it is not nested within or beside the classroom summary. Both use normal page flow and retain the scroll-overlap fix.

The invitation section has a clear heading and introduction, a class-labelled code panel with expiry information, generation/copy actions, a three-step joining guide and a separate expandable access-management section. Empty and ready-code states have distinct styles. Copy and revocation are disabled without an active unexpired invitation; generation remains available for the selected active class. Code replacement, seven-day expiry and existing membership behavior are unchanged.

Verification: `tests/teacher-overview-browser.cjs` passes 39 actual local-browser checks. New checks generate a real temporary local invitation, verify the 12-character code, sharing/access state and class identity, and verify structural separation. Existing desktop scroll, mobile, reduced-motion, creation, dashboard and direct follow-up navigation checks remain passing. Separate invitation screenshots are captured at desktop and mobile widths. Temporary classes and codes are removed; user-created records are preserved.

No schema, rules, production writes or deployment were introduced. The current local preview is updated in place without restarting the emulator.
