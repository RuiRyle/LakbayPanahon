# Chronological era progression

Implemented on 2026-10-28. Era prerequisites are now applied and readback-verified
for all four live eras and the required prologue. Chapters 1–14 are published.
The initial rollout deferred Eras 3–4; the remaining two updates were applied
after Chapters 7–14 were published.

Backup: `backups/era-progression-1793173999503.json`.
Remaining-era backup: `backups/era-progression-1793188536315.json`.

Each `eras/{id}` document can define `requiredChapterIds`, an array of chapter
IDs. Every listed chapter must have a completed `studentChapterProgress` record
owned by the signed-in student before new work in that era opens. Chapter
completion is recorded by passing its challenge after completing its missions.
Optional practice, perfect scores, daily challenges and collections are not
additional requirements.

`unlockMessage` supplies the explanation shown in locked-era previews. The code
does not hardcode era names, chapter counts or chronology. Missing requirements
preserve legacy behavior until the configuration is published; malformed values
block new work instead of silently allowing access.

## Prepared configuration

`data/era-progression-migration.json` updates four eras and the prologue chapter:

| Entry | Requirements |
| --- | --- |
| First era | Available; prologue becomes required before Chapter 1 |
| Second era | Prologue and Chapters 1–4 complete |
| Third era | Prologue and Chapters 1–8 complete |
| Fourth era | Prologue and Chapters 1–11 complete |

The requirements are cumulative so previously completed later chapters cannot
skip missing early chapters. Completed active chapters stay reviewable. Individual
completed active missions also remain accessible from My Journey even if their
chapter has become locked; unfinished missions remain locked.

Home ignores unfinished drafts in locked eras and recommends earlier work.
Explore retains locked-era previews and explains the requirement. My Journey and
direct activity links use the same completion criteria. These are browser
navigation checks within the existing free-plan architecture, not new server
security enforcement.

## Publication

Publish the relevant curriculum first, then deploy the updated JavaScript/CSS
with this configuration. Do not run older prologue plans afterward without
checking their `requiredForProgression` setting.

`functions/apply-era-progression.cjs` follows the existing guarded migration
workflow. It verifies chapter/era identity and existing fields, writes a backup,
and commits the five document updates atomically only with `--apply`.

```powershell
# These commands access the original Firestore project, including the dry run.
node functions/apply-era-progression.cjs
node functions/apply-era-progression.cjs --apply
```

The full dry run stopped at missing Chapter 6. The scoped rollout was then run
with `--existing-eras --apply`, after its own dry run confirmed three updates.
This option skips missing eras and checks the prerequisites needed by the
selected existing eras. It never creates empty era documents. A repeated run
reported zero changes and verified every planned field.

If a guard fails, inspect the live content before changing it. No learner
progress is modified by this migration.
Use **Refresh Learning Content** after publication to clear the instructional
catalog cache.

## Local verification

Tests cover complete versus partial prerequisites, another student's records,
locked-era drafts, malformed configuration, chapter challenge completion,
preserved completed-lesson review, and locked preview → unlocked chapter UI.
`tests/live-era-progression.cjs` passed against the actual database using a
temporary student account and seeded completion records. It verified empty and
partial prerequisites stay locked, all prerequisites unlock Chapter 5, and an
already completed mission stays reviewable after relocking. The temporary
account and all its records were removed. This verifies access behavior, not a
full student quiz-and-challenge walkthrough. A subsequent
`tests/roadmap-access-live.cjs` run verified all four eras and Chapters 1–14,
including every later-era lock, unlocking with owned prerequisites, and
Chapter 14 chapter ordering. Its temporary account and records were removed.
Hosting was not deployed; Live Server uses the updated local code.
