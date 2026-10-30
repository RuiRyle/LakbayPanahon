# Era 1 Prologue: Before Our History Journey

Published to the original project lakbaypanahon-1797e on 2026-10-27. Runtime content comes from Firestore.

Four missions introduce Philippine geography, scientific explanations of island formation, archaeological evidence, and population movements. Each has five scenes with three clues, an evidence-based decision, authored help and mapped review topics. Each quiz draws five questions from ten equivalent topic-balanced questions; passing is three correct. Each topic has easy and hard practice with the existing review-evidence policy. Four educational game tokens and an Origins Explorer badge accompany the normal one-time reward flow. The final challenge has six decisions and four matching activities.

## Progression

The chapter is era1-prologue, order 0, displayLabel Prologue, requiredForProgression false. New learners are directed here; completion within the prologue is sequential. Chapter 1 remains accessible without the prologue. Existing required-chapter completions, attempts and saved drafts keep their chapter recommendation. Required chapters still block later chapters normally. Finishing a later chapter never redirects backwards to this optional introduction.

No existing chapter documents or learner records were changed by the content migration. Optional-chapter navigation behavior is implemented in the website source and must be published with the normal website deployment.

## Content and maintenance

Authoring input: data/prologue-learning-units.json. Run node functions/build-prologue.cjs to regenerate data/prologue-migration.json. Run node functions/apply-prologue.cjs for a read-only preflight; --apply backs up and atomically commits content with collision guards and readback verification. The applied batch contained 125 documents.

Scientific explanations and traditional origin stories have distinct purposes and are treated respectfully. Language families are not racial categories; multiple sources cannot establish one simple origin for every Filipino. Human remains are evidence requiring respect, never game prizes. Scenarios are labelled fictional teaching examples. Independent teacher, curriculum and learner comprehension reviews remain pending.

Sources: [PHIVOLCS](https://www.phivolcs.dost.gov.ph/introduction-to-volcanoes/), [National Museum: Tabon](https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/tabon-cave-complex/), [Callao research](https://www.nature.com/articles/s41586-019-1067-9), [National Museum: Batanes](https://www.nationalmuseum.gov.ph/2022/02/22/batanes-neolithic-artifacts/), [population history research](https://pmc.ncbi.nlm.nih.gov/articles/PMC8020671/), [Philippine Embassy geography](https://philippineembassy-dc.org/about/).

## Validation

92 local non-emulator unit tests passed, including equivalent retries, authored answer keys, topic mapping, optional prerequisites, new-learner continuation and existing-progress preservation. Chrome fixture checks exercised the 20 scenes and 10 final activities using the actual page scripts. Firestore readback verified every planned field. These checks do not replace an authenticated end-to-end prologue walkthrough or a Grade 5 classroom review.
