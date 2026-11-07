# Classroom disclosure repaint fix — 2026-11-05

Removed the custom native details-content height/opacity/content-visibility transitions. Classroom loading no longer closes and immediately reopens the outer classroom collection. Tab rendering no longer reparents an already correctly placed classroom picker. These changes keep the native disclosure subtree visible and stable instead of depending on a later unrelated toggle/repaint.

Regression coverage now dispatches real CDP mouse press/release events to classroom cards rather than only invoking button.click(). It repeatedly closes and reopens the same classroom three times without touching Create classroom or another disclosure, and checks actual rendered panel visibility and height. Existing tests cover invitations, keyboard-accessible button attributes, scrolling and reduced motion. Local preview updated, no production deployment.

Root-cause follow-up: the selector button inherited grid-column:2 from its title layout. Its absolute hit area was therefore confined to the title grid cell instead of the full article. A real full-size toggle button now explicitly resets grid-column/grid-row to auto, with a separate visible title and no stretched pseudo-element. This was reproduced using CDP mouse clicks at the card's upper-left padding, where elementFromPoint originally returned the article instead of the toggle button.
