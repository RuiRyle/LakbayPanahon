# Classroom card hover stability — 2026-11-05

Classroom collection cards retain a full-card button hit area. Hover no longer translates the card or its button/pseudo-element; border and shadow provide hover feedback instead. The card and full-card overlay consistently use the pointer cursor, with a wait cursor only while the button is disabled. Keyboard selection behavior is preserved. Local preview CSS updated.

Browser regression includes an actual mouse move near a selected card edge and verifies that its top position stays stable and its click overlay uses the pointer cursor.
