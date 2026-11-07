# Teacher layout and color grading — 5 November 2026

Refined Dashboard and My Classes using deeper ink/navy surfaces, softer blue-gray body text, warm gold emphasis, and restrained sage status accents. Hero, summary, follow-up and class-management surfaces now have distinct tones and border treatments. Metric icons use restrained per-category accents without changing metric meaning. Invitation codes have a warm-toned high-contrast panel.

On wide screens with a selected class, My Classes uses a two-column workspace: a sticky, independently scrollable classroom collection beside class details, invitation tools, editing and status panels. It falls back to the existing single-column layout below 1150px. Without a selected class the collection retains the full available width. Existing motion and reduced-motion handling are retained.

Validation: the actual local browser check verifies the two columns align side by side, invitation controls remain available, selection state is preserved, mobile layout has no horizontal page overflow, and reduced-motion behavior remains correct. Desktop/mobile screenshots are captured after short entrance animations settle. Temporary fixtures are cleaned up; no user-created classes or invitation records are changed. No new database reads, schema changes, permissions or production deployment were introduced by this color/layout pass.
