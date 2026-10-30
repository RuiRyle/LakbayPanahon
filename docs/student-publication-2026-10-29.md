# Student content publication — 29 October 2026

The reviewed remaining Firestore queue was published to `lakbaypanahon-1797e`. Twelve scoped batches made 57 document writes across 53 distinct documents. Every batch had a backup, creation/update-time preconditions and successful final-field readback. The distinct count is lower because some story scenes received both teaching and image updates in separate batches.

| Published batch | Documents |
| --- | ---: |
| Mission 1: six scenes and ten main/retry quiz feedback items | 16 |
| Bayani Grade 5 teaching instructions | 1 |
| Chapter 2 shorter scene bodies | 3 |
| Chapter 2 main/retry feedback | 6 |
| Chapter 2 duplicate-choice repair | 1 |
| Chapter 2 beginner-practice questions | 3 |
| Remaining Mission 2 easy-practice questions | 2 |
| Chapter 3 scene decisions | 3 |
| Chapter 4 learning improvements | 3 |
| Chapter 6 worked help | 2 |
| Earlier story-image metadata repairs | 15 |
| Chapter 5 continuation wording | 2 |

The five Mission 1 beginner-practice records published immediately before these batches are recorded separately in [beginner-practice coaching](chapter1-mission1-practice-polish.md).

## Reconciliation and small corrections

Chapter 5 initially failed its old full-content guard. A bounded comparison found both live endings matched the already-reviewed `chapter5-published-recap-migration.json`. The earlier paragraphs were identical; the previous ending already removed build-status claims. The continuation draft's guard was rebased to that known reviewed source, without removing any guard. A new live dry run then passed, and the two intended final paragraphs were published and read back.

Twelve malformed apostrophes were repaired in desired Chapter 2–4 fields before publication; original expected values were retained. Choice-specific `answerHints` were added to the five new Chapter 2/Mission 2 easy-practice records because that is the field used after a wrong practice answer. Existing difficulty and review-evidence policies were preserved.

The old six-item easy-review creation plan was not rerun. Its two Mission 2 entries were published through a separate two-document plan; its four Mission 1 entries had already been superseded by the earlier coaching update.

## Evidence and practical effects

Exact batch and backup references are in [the publication record](validation/student-publication-live-2026-10-29.json). Sixteen focused local tests passed, and the local candidate-content and queue-compatibility checks passed. No learner accounts were created during this publication.

Reload the website to fetch current content. Reload Bayani and start a new conversation so its connection uses the published instructions. Existing draft versioning can reset unfinished lessons, quizzes or practice when relevant content/question banks change; completed progress and rewards remain in separate records.

Image URLs now reference the fifteen local teaching diagrams. They are available through the workspace's web server; public Hosting/assets deployment was not performed. This task did not modify Firebase rules or deploy Cloud Functions.

Publication/readback does not establish historical accuracy, Grade 5 comprehension or reliable Gemini boundaries. The actual Bayani response review, independent teaching review, interrupted recovery checks, normal-lock acceptance and public release remain separate work. No old migration outside this reviewed queue was replayed.
