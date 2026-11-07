# Teacher custom cursor consistency — 2026-11-05

The shared cursor stylesheet uses a gold arrow and gold hand. Later teacher styles specified native pointer cursors, overriding the shared hand on classroom button overlays and disclosure headings. A scoped teacher rule now restores the shared gold hand for enabled interactive controls, nested labels/icons and summary/button pseudo-elements. Disabled controls retain a not-allowed cursor; text-entry fields retain their text cursor. No interaction handlers or data change.

Browser coverage verifies the custom hand asset in computed cursor styles for the classroom hit layer and disclosure headings and their descendants.
