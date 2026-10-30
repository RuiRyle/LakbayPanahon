# Student content review — 29 October 2026

Offline review of the dated curriculum snapshot plus explicitly listed local authoring plans. No Firestore reads or writes. This is a candidate catalog, not proof that those revisions are published or mutually compatible.

Publication follow-up: on 29 October the reviewed pending batches below were compared with current Firestore, published with backups and read back. This includes Chapter 1 learning clarity, Chapter 2 beginner practice/reading/feedback, Chapters 3–4 decisions, Chapters 5–6 guidance, the remaining Mission 2 easy items and fifteen image repairs. See [the scoped live evidence](student-publication-2026-10-29.md). The original offline findings below remain dated editorial evidence, not independent curriculum approval.

## Findings

The candidate contains 66 active missions, 388 scenes and 330 main-quiz topic slots. Every topic slot has a mapped lesson, at least two main variants per configured question slot, and practice material. Every candidate scene has a configured image present locally. These are structural checks: they do not establish that an image teaches the right detail or that a scene explains each answer adequately.

Three additional beginner-practice gaps remain after including the six previously prepared easy-review items:

| Mission | Topic | Mapped scenes | Gap |
| --- | --- | --- | --- |
| chapter2-mission1 | community-leadership | chap2-mission1-scene1, scene6 | Policy requests easy; both existing practice items are harder. |
| chapter2-mission1 | social-roles | chap2-mission1-scene2, scene6 | Policy requests easy; both existing practice items are harder. |
| chapter2-mission2 | oral-traditions | chap2-mission2-scene4, scene5, scene6 | Policy requests easy; both existing practice items are harder. |

Practice can still select available questions using its difficulty fallback. These gaps mean struggling learners may receive harder questions than requested. Author genuinely simpler questions grounded in the mapped scenes rather than relabel existing items. Preserve existing review-evidence requirements.

The separate later-chapter publication audit passes 61 plans with no structural errors. The existing curriculum evidence review still labels 13 of 26 areas partial and 13 mapped. Those editorial classifications were not reassessed here; keyword presence is not enough to change them.

## Follow-up and remaining teaching review

The table above records the 29 October offline finding. The three Chapter 2 beginner items were subsequently published and read back, and the refreshed candidate audit reported zero structural easy-practice gaps. That closes the specific missing-item issue; it does not show that children understand the items or that every explanation is accurate.

The [Chapter 2 family knowledge pilot](chapter2-family-learning-review.md) is the next focused lesson-to-assessment review. It improves a family-traditions scene, changes an equivalent retry, and makes the hard practice item ask for an inference about kinship. Its seven-record migration is a **local unpublished draft**, so current students do not see these revisions yet. Independent teacher/history and Grade 5 comprehension review remain necessary before publication.

Continue reading lesson explanations, question feedback, image relevance and difficulty progression mission by mission. The curriculum review still has 13 partial rows. Structural links and passing local checks are not evidence that a student has learned those targets.

30 October follow-up: a separate [Mission 2 dated women-role draft](chapter2-women-role-learning.md) adds a 1589 Tagalog account, a matching scene check, both main/retry variants and easy/hard recovery. Its seven records are also local and unpublished. Q1.7 remains partial; this source does not establish all earlier women's roles.

The user's completed website walkthrough is recorded as user-tested; it is separate from these content checks. No repeat of that walkthrough is required by this report.

Chapter 1 Mission 1's [learning-clarity update](chapter1-mission1-learning-polish.md) is now published and read back: six shorter story bodies, concrete worked help, a distinct first-scene decision and feedback for all ten main/retry questions. It retains the five existing quiz topics and includes four option wording repairs. This is not historical/Grade 5 approval. The separate [beginner-practice coaching pass](chapter1-mission1-practice-polish.md) is also published: four easy questions created plus existing easy datu feedback updated, with choice-specific hints and an unambiguous cooperation choice. The two remaining Mission 2 easy items and the three Chapter 2 beginner items have now also been published and read back.

Run `node functions/audit-student-content-local.cjs` to regenerate the detailed candidate report in `docs/validation/student-content-local.json`. The report lists every selected overlay and topic mapping; overlapping unselected revisions remain outside its scope.
