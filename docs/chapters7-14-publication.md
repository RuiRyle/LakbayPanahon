# Chapters 7–14 publication

Publication date: 28 October 2026, original project `lakbaypanahon-1797e`.
The authoritative release results and backup paths are recorded in
`docs/validation/chapters7-14-publication-live.json`.
All 44 dry runs and applications completed successfully. Every release's fields
were verified by readback. Remaining era prerequisites and final era descriptions
were also applied and verified, with backups:
`backups/era-progression-1793188536315.json` and
`backups/published-era-descriptions-1793188547535.json`.

The release covers eight chapters, 36 missions, 216 scenes, 36 quizzes,
360 main questions, 360 practice questions, 36 artifacts, eight chapter
challenges with 80 activities, and eight badges. Shared era and chapter
descriptions are updated in prerequisite order.

Before publication, the offline 54-plan curriculum audit passed, all 383 local
non-emulator checks passed, and all 44 browser suites for Chapters 7–14 passed.
These browser fixtures exercise images, interactive scenes, explanations,
challenge gates, recovery and draft behavior with mocked data.

Old authoring-stage statements that later missions were still being prepared
were removed from the 36 final-scene recaps. Mission completion alone continues
to be distinguished from passing the final chapter challenge.

Each release uses the existing migration's dry run, field guards, creation and
update-time preconditions, backup, atomic commit and field readback. The
orchestrator stops on the first failure. It does not write student progress.
Backups are preserved under `backups/`.

The remaining era lock fields are applied separately with
`functions/apply-era-progression.cjs`. Final era descriptions use
`functions/apply-published-era-descriptions.cjs` so students do not see obsolete
claims that published later eras are still being prepared.

`tests/roadmap-access-live.cjs` checks published chapter availability and era
access using a temporary student account with seeded completion records. It
removes that account and its records afterward. This is access verification,
not a full quiz-and-challenge gameplay walkthrough or proof of learning
effectiveness. Independent teacher and curriculum review remains pending.
The live test passed: all four eras and Chapters 1–14 exist, later-era access
rejects missing prerequisites and opens after owned completion records exist,
and Chapter 14 cannot skip earlier chapters. Cleanup succeeded.

Hosting is not deployed by this workflow. Live Server serves the local code and
images. A hosted site still needs matching code and assets. Refresh learning
content after publication to clear the instructional catalog cache.
