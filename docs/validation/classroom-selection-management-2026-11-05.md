# Classroom selection and management refinement — 2026-11-05

My Classes initially displays the classroom collection. The selected classroom workspace and invitation section are hidden until a class is selected. A class URL retains its selection; creating a classroom selects the new classroom. During a different classroom load the previous management controls are hidden.

Edit class details uses clear labels, an optional description, grouped save/cancel actions, and a short explanation of what changes. Cancel restores the saved name and description without a database write. Archive/restore remains separate, with an explanation of joining, publishing, preserved progress, and restoration. Existing membership and archive policies are unchanged.

Validation: JavaScript syntax check and local teacher browser coverage, including no-selection visibility, cancel restoration, invitation controls, scrolling, mobile width, and reduced motion. No production deployment or online Firebase changes.

Follow-up: opening My Classes now ignores a carried class query parameter until the teacher clicks a classroom card. Refreshing within an already opened classroom retains its working context. Clicking a card focuses and scrolls to that classroom's details. The browser checks now explicitly verify that a class URL alone does not reveal the panel.
