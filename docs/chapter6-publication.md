# Chapter 6 publication — 28 October 2026

Chapter 6 is now published in the original Firestore project
`lakbaypanahon-1797e`. The missing Chapter 5 prerequisites were published first.

## Releases applied in order

- Chapter 5 Missions 3 and 4, then its chapter challenge and badge.
- Chapter 6 Missions 1–4, then its chapter challenge and badge.
- Two older Chapter 5 recap corrections that remove outdated unfinished-chapter wording.

Each release passed its guarded dry run, saved a backup under `backups/`,
committed atomically and verified its fields by readback. The eight content
releases touched 201 distinct curriculum documents, including 36 scenes,
60 main questions, 60 practice questions, six missions and two chapter challenges.
The final recap correction updated two additional existing scenes.

Chapter 6 itself contains four missions, 24 scenes, four quizzes, 40 main
questions, 40 practice questions, four artifacts, ten challenge activities and
one chapter badge. Missions use five-question quizzes; three correct passes.
The challenge requires seven of ten activities. Existing reward behavior awards
mission rewards and the chapter badge once.

## Review and verification

Removed release-status wording from the six newly published mission recaps.
Their completion instructions now describe the full mission-to-challenge path.
Kept the Mactan reward explicitly connected to learning rather than harm.

All 383 local non-emulator checks passed, together with eight mocked browser
suites for the six missions and two challenges. These checks covered scenes,
images, interactive choices, authored explanations, topic mappings, challenge
gating, recovery and continuation.

`tests/chapter6-access-live.cjs` passed against actual Firestore using a temporary
student account. It verified Chapter 6 stays locked before Chapter 5 completion,
opens afterward, provides four active missions, gates Mission 2 behind Mission 1,
and is returned as the next chapter by the Chapter 5 continuation logic. The
temporary account and all its records were removed. Completion records were
seeded for this access test; it was not a full quiz-and-challenge walkthrough.

Historical source spot checks included the Intramuros Administration's account
of Manila, the Library of Congress discussion of early colonial relationships,
the NHCP Bangkusay registry and NCCA's account of Sulu diplomacy. Independent
teacher and curriculum review remains pending; automated checks do not prove
Grade 5 learning effectiveness or complete curriculum coverage.

## Current limits

Hosting was not deployed. Live Server uses the local images and code. Refresh
learning content to clear the instructional cache. The website's hosted version
needs matching assets before these lessons can be treated as visually verified
there. Chapters 7 onward and Eras 3–4 were not published in this task.

The Chapter 5 recap correction has its own guarded migration:
`data/chapter5-published-recap-migration.json`. Backup:
`backups/chapter5-published-recap-1793187547143.json`.
