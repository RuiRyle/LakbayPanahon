# Chapter 2 family knowledge learning review

Status: **local editorial draft, not published to Firestore** (30 October 2026). This is a focused Task 3 learning-quality improvement for Chapter 2 Mission 1. It does not change mission order, access, XP, correct-answer letters, the five-question quiz policy, or the practice mastery policy.

## Why this sequence was selected

The existing family-traditions scene taught kinship through a fictional grandmother. The retry item repeated the main quiz's answer choices with a lightly changed stem. The item marked `hard` in practice asked essentially the same recall question as the easy item. These made the practice progression less useful to a student who struggled with the topic.

The draft now gives the student a short sequence:

| Step | Student action | Learning purpose |
| --- | --- | --- |
| Scene 3 | Explore Amihan's fictional grandmother and aunt, then inspect a separately sourced Ifugao example | Learn that relatives can share knowledge and help across homes; recognize women as knowledge keepers without treating one community as all communities |
| Scene 6 | Compare a fictional case with a named source and state the limit of each | Connect family ties to the broader mission's source and social-position work |
| Main quiz | Explain why family ties matter | Check the basic concept |
| Retry quiz | Apply the same concept to a new aunt-and-younger-relative situation with different options | Test transfer without recycling the original answer set |
| Easy practice | Identify what an ancestor story can pass on | Rebuild the starting idea with choice-specific hints |
| Hard practice | Combine the grandmother's story with the aunt's help across homes | Infer how kinship supports both learning and practical care |

The existing `family-traditions` topic, main/retry `medium` difficulty, practice `easy`/`hard` difficulty, correct answer `C`, and practice evidence policy stay in place. The hard item now measures the tagged family concept; the source comparison is taught in the scenes and help panel rather than substituting for topic mastery.

## Source and teaching limits

The [UNESCO/Japan Funds-in-Trust 2005 brochure, printed page 22](https://www.unesco.emb-japan.go.jp/pdf/brochure-intangible2005.pdf), describes the Hudhud chants of the Ifugao and says the main narrator is often an elderly woman, with other singers responding. The lesson paraphrases only that narrow example. Amihan and her family are explicitly fictional. The brochure's publication date does not date the beginning of the chants, prove an unbroken practice from a particular precolonial year, or describe all early Philippine women.

This is a useful named example of women's knowledge sharing, but **Q1.7 (early women's contributions) remains partial** in the MATATAG Grade 5 editorial coverage review. The broader historical target needs further sourced teaching and assessment. A teacher and Grade 5 learners have not independently reviewed this wording or tried the activity.

## Files and safeguards

- `data/chapter2-family-learning-polish.content.json` holds the authored educational text. Runtime pages still read content from Firestore; no lesson text was added to the browser code.
- `functions/build-chapter2-family-learning-polish.cjs` turns the authored text into a guarded migration using the dated 27 October local snapshot and four explicit Chapter 2 overlays.
- `data/chapter2-family-learning-polish-migration.json` updates exactly seven existing content records. Every changed field has an old-value guard or an explicit absent-field guard.
- `functions/apply-chapter2-family-learning-polish.cjs` defaults to an offline check. Its future live modes require explicit flags and verify current documents before any update. This draft has **not** run either live mode.
- `tests/chapter2-family-learning-polish.test.cjs` checks scope, old-value and absent-field drift, evidence and reward invariants, Firestore encoding, idempotence, and offline-only default behavior.

Local checks:

```powershell
node functions/build-chapter2-family-learning-polish.cjs
node functions/apply-chapter2-family-learning-polish.cjs
node tests/chapter2-family-learning-polish.test.cjs
```

The dated snapshot and overlay check is not a live Firestore read. The draft should receive teacher/history and Grade 5 comprehension review before any publication. If published later, students with unfinished lesson or quiz drafts may need to restart the affected content under the existing version policy; earned completions and rewards remain unchanged.
