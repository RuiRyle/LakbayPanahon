# Chapter 2 scoped learning publication — 30 October 2026

Published to the original `lakbaypanahon-1797e` Firestore project for personal testing after the user confirmed proceeding. Each existing publisher rechecked exact old/absent field guards, wrote a local backup, committed with update-time preconditions and verified every target by readback. Both commands exited successfully, each reporting seven changed documents.

| Batch | Command | Backup |
| --- | --- | --- |
| Family knowledge | `node functions/apply-chapter2-family-learning-polish.cjs --apply` | `backups/chapter2-family-learning-polish-1793347245626.json` |
| Women's ritual roles | `node functions/apply-chapter2-women-role-learning.cjs --apply` | `backups/chapter2-women-role-learning-1793347259429.json` |

Each batch covers two scenes, one mission recap/objective document, two main/retry questions and two practice questions. Only the fields in the existing migration plans changed. No learner records, answer keys, rewards, progression settings, access rules, Hosting deployment or backend activation changed.

## Editorial/source check and limits

The [2005 UNESCO/Japan brochure, printed page 22](https://www.unesco.emb-japan.go.jp/pdf/brochure-intangible2005.pdf) supports the narrow Ifugao example of older women leading Hudhud narration with a responding choir. The lesson distinguishes this named tradition from Amihan's fictional family and does not assert an exact origin date or universal practice.

[Plasencia's translated account](https://www.gutenberg.org/files/13701/13701-h/13701-h.htm), in the 1589 Tagalog relations, supports women or men holding the catolonan role. The revision identifies the colonial writer's viewpoint and keeps its imagined babaylan gathering separate. [NCCA's CulturEd entry](https://philippineculturaleducation.com.ph/babaylan/) also describes regional terminology and women and men holding ritual roles. This bounded source check does not validate every historical statement in the wider chapter.

The source-informed revisions retain their explicit independent teacher and Grade 5 review-pending labels. Publication for user testing is not independent educational approval or public-release acceptance. Q1.7 coverage remains partial. Earlier local review files and migration publication-status fields describe preparation-time state; this record establishes the subsequent live publication.

## Validation

`node --test --test-isolation=none tests/chapter2-family-learning-polish.test.cjs tests/chapter2-women-role-learning.test.cjs`: **21 passed, zero failures**. Both live publishers completed guarded commits and exact readback. No extra full-curriculum scan or post-publication dry-run was needed.

The separate four-scene `learningHelp` draft remains unpublished; its offline preparation tool has no live publication mode. Keep it separate from these fourteen updates. Existing unfinished affected drafts may require restart under the content-version policy. Earned progress is not reset.

Next: personally inspect Chapter 2 Missions 1 and 2 in the website (including their retry/practice feedback); retain independent teacher/Grade 5 review, hosted acceptance and privacy decisions as open gates. Exploration preview remains enabled at the user's request.
