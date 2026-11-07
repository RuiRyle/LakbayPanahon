# Classroom accordion — 2026-11-05

My Classes classroom cards now expand their selected classroom details directly below the card, with a single shared in-flow panel for teaching tools, editing, archiving, and the separate invitation section. A second click on the open card collapses its panel and removes the class URL parameter. Opening another classroom moves the shared panel and closes the previous one. Buttons expose aria-expanded and aria-controls, and hints use Open/Close classroom with directional chevrons. Existing unsaved-change guards run before closing or switching.

Before collection refresh, live controls are moved safely out of the old list so refresh cannot delete their event handlers. No new database schema or production deployment.
