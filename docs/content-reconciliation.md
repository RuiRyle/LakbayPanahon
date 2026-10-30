# Supplementary content reconciliation

Offline analysis on 2026-10-28, against the 2026-10-27 curriculum snapshot. No Firebase authentication, requests, dry runs, writes or deployment occurred.

The field-history report maps 2,305 overlapping fields across the supplementary inputs. Of these, 1,792 have a unique reachable field terminal in the selected local history, 292 have guarded revisions disconnected from this saved baseline, and 221 have a differing desired value without a guard for that particular field. These categories are review findings, not proof of live conflicts. A write may have other document guards or apply-script safeguards even when a particular field is marked unguarded.

A unique field terminal is also not a selected canonical document. Independent field choices could mix a new lesson with an old decision or explanation. Whole-document coherence and real publication state must be reviewed before preparing an executable migration. No deployment values or flattened apply plan were produced.

Run node functions/reconcile-content-local.cjs to regenerate docs/validation/content-reconciliation-local.json. The tool canonicalizes nested values, traces expected-to-desired field transitions independently of filenames and identifies branches, cycles, unguarded changes and disconnected history. Unguarded desired fields already matching the snapshot need no transition in this comparison. Tests exercise ordered transitions, competing branches, cycles and disconnected or unguarded inputs. All 359 non-emulator local checks passed.

## Inputs requiring further reconciliation

| Input | Flagged fields | Affected documents |
| --- | ---: | ---: |
| archaeology-pilot-migration.json | 275 | 26 |
| grade5-quiz-wording.json | 127 | 20 |
| mission-quiz-flow-migration.json | 116 | 19 |
| roadmap-chapter34-migration.json | 79 | 16 |
| barangay-scenario-quiz.json | 64 | 10 |
| livelihood-scenario-quiz.json | 63 | 10 |
| question-feedback-migration.json | 60 | 30 |
| evidence-challenge-pilot.json | 6 | 1 |
| seafaring-route-investigation.json | 5 | 1 |
| livelihood-learning-migration.json | 3 | 1 |
| lesson-recap-migration.json | 1 | 1 |

Counts can overlap across inputs; do not add this table to get a distinct-field count. The JSON report lists each document path, field, input files, baseline hash, reachable terminal hashes and review reasons. It deliberately contains no credentials or learner data. Value hashes identify equality, not historical authority or content quality.

## Review procedure

1. For a disconnected revision, inspect the expected and desired values alongside the saved snapshot and any applicable local backup. Establish whether the expected text belongs to an intermediate authored revision, an older baseline or a genuine divergent edit. Never rewrite the expected guard merely to make it pass.
2. For differing unguarded fields, inspect the actual apply script and later replacement. Existing create plans often supply the earlier value and must not be replayed over a newer document. A missing field-level guard alone does not establish a runtime security defect.
3. Review each scene as a coherent unit: content, review topics, clues, decision, explanation, help and image metadata. Review quiz wording, answers and feedback together. Preserve unrelated fields and learner records.
4. Prepare explicit per-document dependencies only after that review. Keep the separate Chapters 5-14 sequence intact; this supplementary report is not an alphabetical publication order.
5. Once Firestore is available, use bounded authenticated preflight to compare the intended documents with actual state. Current live differences remain unknown until then.

The image-repair migration remains separately guarded against the saved scene content and image URL. It is not automatically ordered after every lesson rewrite: if another migration changes those fields, its image choice and the repair must be reconciled together.

Pending: resolve flagged whole-document histories, teacher/curriculum review, current database verification, publication and deployment. The next concrete task is the prologue lesson revisions (especially archaeology) and older quiz/feedback updates, which account for substantial disconnected and unguarded history. Preserve authoring files and backups while reviewing them.
