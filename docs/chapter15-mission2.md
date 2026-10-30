# Chapter 15 Mission 2 — The Emerging Middle Class and Public Participation

Published and field-verified on 28 October 2026 in `lakbaypanahon-1797e`.
Backup: `backups/chapter15-mission2-1793191675812.json`.

## What students learn

Six scenes connect resources and education with three named forms of public
participation: del Pilar's Tagalog translation of Amor Patrio in 1882,
de los Reyes founding El Ilocano in 1889, and the Malolos women's educational
request in 1888. The lesson does not infer that these people all had identical
class positions, opportunities or opinions. It credits each action separately
and includes local initiative rather than making overseas study a requirement
for contribution.

The Malolos case assesses the documented request and its purpose. It avoids
assessing a disputed participant count or confusing requested night-school
conditions with evidence that a school operated on those exact terms. The
women's initiative is distinguished from Rizal's later supportive letter.

Six modern SVG diagrams provide labelled teaching aids; they are not original
newspaper pages, portraits or historical quotations. The five-topic quiz bank
has ten medium questions, two variants per topic, plus ten distinct easy/hard
practice questions. The normal mission quiz selects five questions and passes
at three correct. Existing one-time reward behavior uses 50 XP and a mission
artifact. Temporary exploration mode continues to suppress completion/rewards.

## Contribution exhibit mechanic

`js/story-exhibit.js` renders the Firestore-authored `exhibitActivity` field.
Students open the scene clues, match each action with its contribution, check
their connections and then explain the differences through the scene decision.

Incorrect connections offer guidance without penalties. Confirmed matches
cannot change until **Revise My Exhibit** is selected. Revising invalidates the
scene explanation so it must be checked again. Partial and confirmed matches
are included in normal story drafts, or tab-only drafts in local preview mode.
Saved confirmation is revalidated against current authored pairs; changed
lesson content also invalidates the draft fingerprint.

The interface uses native labelled selects, visible full selected descriptions,
announced feedback, keyboard focus on the next explanation and responsive
cards. All content and correct pair IDs are authored data; the renderer contains
behavior and generic interface instructions.

## Sources

- [Intramuros economic-history exhibit](https://museum.intramuros.gov.ph/precolonial/manila-at-the-turn-of-the-century/): resources, education and public-life context.
- [NCCA CulturEd: Diariong Tagalog](https://philippineculturaleducation.com.ph/diariong-tagalog/): bilingual publication and translation roles.
- [NCCA CulturEd: Isabelo de los Reyes](https://philippineculturaleducation.com.ph/de-los-reyes-isabelo/): regional publishing example.
- [NHCP: Schoolhouse of the Women of Malolos](https://philhistoricsites.nhcp.gov.ph/registry_database/site-of-the-schoolhouse-of-the-women-of-malolos/): dated educational initiative and later support.

These sources support the selected examples, not a complete history of the
middle class. Independent teacher and learner-comprehension review is pending.

## Verification and publication

All 399 local non-emulator checks passed. The mission browser fixture verifies
six scenes, images, clue gating, wrong/correct matches, partial and confirmed
refresh recovery, revision and required explanation. The standalone exhibit
browser check passed at desktop and narrow widths, and the desktop layout was
visually inspected. Existing story, trade, route and Mission 1 fixtures passed.

Guarded publication checked the existing first mission and description values,
created 29 curriculum documents, updated only chapter/era descriptions, saved
a backup and read back all fields. Existing student records and previous
mission content were not changed. Chapter 15 remains partial without a final
challenge or chapter badge. Hosting was not deployed; refresh learning content
in Live Server to test the new mission.

## Chapter completion update, 28 October 2026

Chapter 15's final challenge and badge have now been published. Earlier statements
that the challenge was pending record the mission's original release status.
See [challenge publication and validation](chapter15-challenge.md).
