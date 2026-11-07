# My Classes classroom collection — 5 November 2026

Refined the classroom collection within the teacher My Classes page, separately from the dashboard's classroom summaries.

- One clear collection heading replaces repeated headings and active-class group labels.
- Create a new classroom appears before the list in an expandable, visually distinct control.
- Compact cards show the initial emblem, class name and active/archived badge. Actual descriptions remain available, limited to two display lines; repeated placeholder instructions are removed.
- The full card selects its classroom through the existing accessible button. Keyboard focus remains visible, and busy controls retain their disabled state.
- Selected cards use a warm gold border, restrained sage/navy background and an explicit check mark. Other cards use an open-classroom arrow.
- Existing wide two-column layout, mobile single-column layout, archive grouping, data protection and reduced-motion behavior remain in place.

Verification: 27 actual local browser checks in `tests/teacher-overview-browser.cjs` pass. Added checks confirm the card selection target covers the card and the create-class control precedes the list. Existing checks cover selection, invitation availability, separate editing/archiving, mobile width, reduced motion, dashboard filters and exact private-request navigation. Desktop screenshot was visually inspected. Temporary fixture data is removed and the existing reporting link restored. JavaScript syntax and the staged website build pass.

Local preview updated without resetting the emulator. No schema, rule, production data or deployment changes were performed.
