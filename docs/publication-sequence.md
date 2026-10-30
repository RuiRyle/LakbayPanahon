# Offline publication review: Chapters 5-14

Reviewed locally on 2026-10-28. No Firestore reads, authentication, migration dry runs, writes or Hosting deployment were performed.

The authored chain contains 54 plans, 44 missions, 264 scenes, 44 quizzes, 440 main questions, 440 practice questions, 10 challenges, 100 challenge activities, 44 artifacts and 10 chapter badges. Its final local catalog contains 1,409 distinct documents. These are authored content counts, not counts of live or unpublished documents.

Run node functions/audit-publication-local.cjs to regenerate docs/validation/publication-local.json. The tool reads local JSON and checks project IDs, curriculum-only paths, duplicate writes, create collisions, prerequisite fields, expected update guards, missing images, quiz blueprint supply, lesson-topic mapping, challenge activity counts, chapter badges and referenced evidence discoveries. It never imports Firebase or executes apply scripts. All 352 non-emulator local checks passed, including checks that deliberately corrupt guards or introduce learner writes.

| Chapter | Missions | Local plan order |
| --- | ---: | --- |
| 5 | 4 | mission1 ? mission2 ? mission3 ? mission4 ? challenge |
| 6 | 4 | mission1 ? mission2 ? mission3 ? mission4 ? challenge |
| 7 | 4 | mission1 ? mission2 ? mission3 ? mission4 ? challenge |
| 8 | 4 | mission1 ? mission2 ? mission3 ? mission4 ? challenge |
| 9 | 5 | mission1 ? mission2 ? mission3 ? mission4 ? mission5 ? challenge |
| 10 | 5 | mission1 ? mission2 ? mission3 ? mission4 ? mission5 ? challenge |
| 11 | 4 | mission1 ? mission2 ? mission3 ? mission4 ? challenge |
| 12 | 5 | mission1 ? mission2 ? mission3 ? mission4 ? mission5 ? challenge |
| 13 | 4 | mission1 ? mission2 ? mission3 ? mission4 ? challenge |
| 14 | 5 | mission1 ? mission2 ? mission3 ? mission4 ? mission5 ? challenge |

The JSON report lists the exact plan and matching apply-script path at every step. Within each chapter, publish mission plans numerically before the challenge. Chapters then follow numeric order. This order preserves description guards and prerequisites; do not flatten all changes into an unguarded bulk write.

Before live publication, establish the first genuinely unpublished plan from verified database state. Do not blindly rerun all 54 apply scripts: an older create plan may collide with a document already advanced by a later plan. The audit does not determine what is already published, resolve live changes or authorize overwriting them. Existing apply scripts retain atomic commits, update-time checks, backups and readback. Their default dry runs still make database reads. Keep those deferred while Firestore is unavailable, then perform a bounded preflight for the intended next batch. A guard mismatch requires inspection of the actual difference; never bypass it automatically.

Scope and remaining review:

- This audit covers the chapter-specific Mission 1 onward plans for Chapters 5-14. Chapters 1-4, the combined chapter34 migration, lesson expansion patches, other data migrations and the actual live baseline are outside this report. An empty external-baseline list means this selected authored chain resolves internally; it does not establish a complete live project.
- Structural checks do not certify historical accuracy, curriculum completeness, age-appropriate reading load or variety of learning activities. Repeated case studies intentionally serve comparison, but still need teacher review for repetition and learning value. Several questions test source limits; a reviewer should check the balance with concrete historical knowledge.
- Existing local progression and browser checks cover learner ownership, mission gates, challenge completion, draft resume, retry and one-time rewards. They use local/mock data and do not establish authenticated production behavior, Firestore rules or live reward integrity.
- Teacher/source review, bounded live preflight, ordered publication, authenticated lesson-to-quiz-to-practice-to-retry walkthrough, chapter completion checks and Hosting deployment remain pending. Do not mark these complete from this inventory.

Next implementation priority: review the combined early-chapter and supplementary migration scope against this chain, then prepare a bounded live verification checklist once the database is available.
