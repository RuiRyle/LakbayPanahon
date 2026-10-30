# Chapter 1 Mission 1: learning clarity

29 October 2026. The six scenes and ten questions are now published and read back in the original Firestore project. Backup: `backups/chapter1-mission1-learning-polish-1793276274176.json`. The runtime continues reading Firestore. The migration JSON is an authoring artifact, not a new website content source. Independent historical/teacher review and learner comprehension remain pending.

## Changes prepared

- Six scene bodies now teach one idea with a concrete story situation, then give a clear action. Body lengths fall from 89–105 words to 79–93 words. Shorter text alone does not establish Grade 5 comprehension.
- Each scene's existing Help Me Understand support now has a worked example and simple vocabulary. Social organization explains duties and choices before asking students to compare them.
- Scene 1's decision asks what Bayani should investigate about shared tasks. The Clue Hunt still asks students to connect all three clues; the second task now applies the idea to a new question.
- All ten main/retry questions have choice-specific feedback. Wrong answers explain the missed detail and, where useful, name the relevant lesson scene.
- Four retry option repairs remove awkward phrasing while preserving the answer letters, topic assignments, difficulty tags and conceptual targets.

| Quiz topic | Direct teaching and worked support | Application |
| --- | --- | --- |
| barangay-community | Scenes 1–2: people, relationships and responsibilities | Distinguish clues about buildings from clues about people helping one another. |
| community-cooperation | Scene 2: food and basket-repair needs | Match different skills to shared needs. |
| datu-leadership | Scene 3: leader's responsibilities and the two families | Explain why hearing both concerns supplies useful information. |
| social-organization | Scenes 4 and 6: duties, authority and choices | Explain why sharing work does not prove equal freedom. |
| community-customs | Scenes 5–6: a learned local practice | Ask about the practice used here; distinguish customs from written laws. |

This is an editorial alignment pass against the dated snapshot and existing authored revisions, followed by guarded live publication. All five topics have mapped scenes and two main/retry variants. It does not approve the curriculum, the images, retry equivalence or historical accuracy. The separate [beginner-practice coaching](chapter1-mission1-practice-polish.md) is also published for five easy items, including the ambiguous cooperation-choice repair.

Scene 1's Clue Hunt comparison uses the authored pilot in `data/clue-hunt-pilot-migration.json`. The dated snapshot predates that pilot. This draft preserves the `clueHunt` field and cannot establish its current live presence or wording. Inspect it during publication review. Existing discovery panels and quick checks remain outside this bounded editorial update.

The existing [DepEd Grade 5 module listing](https://lrmds.deped.gov.ph/detail/20853) was inspected for scope; it is a legacy K–12 resource listing, not independent support for every claim in these scenes or certification against MATATAG. Existing historical qualifications are retained. Made-up story examples are identified as teaching examples.

## Local review

```powershell
node functions/apply-chapter1-mission1-learning-polish.cjs --check-local
node --test --test-isolation=none tests/chapter1-mission1-learning-polish.test.cjs
```

The check reads the 27 October snapshot, validates the allowed documents/fields, compares exact baseline guards and checks topic coverage. It does not load credentials or contact Firebase. Tests exercise scope rejection, stale/partial guards, idempotent comparisons and Firestore value encoding.

Local result: the five scoped safeguard checks and two existing migration-review checks passed using Node with process isolation disabled. Queue compatibility and the candidate content audit also passed. These runs used no Firestore or emulator access; no browser or learner-comprehension result is claimed.

## Publication when Firestore is available

The owner-checked temporary test-record cleanup is now complete. When proceeding with this separate scene/quiz batch, run its scoped live dry run:

```powershell
node functions/apply-chapter1-mission1-learning-polish.cjs
```

This reads at most 16 target documents sequentially and stops at the first quota error or content conflict. Compare the results before running with `--apply`. No automatic retry, broad catalog scan or historical prerequisite migration is performed. Application uses one atomic commit with update-time guards, a backup, field masks and readback. A second application skips already-matching documents while retaining guards on unedited fields.

The publication changes six story documents and ten question documents. Existing draft version rules will reset affected unfinished lessons and quiz answers because lesson text and four choices change. Completed progress and rewards use separate records. Plan publication for an appropriate time and retain this behavior in the release notes.

Frontend deployment is not needed solely for these data fields: existing story and quiz code already reads them. Current-record comparison and post-publication readback passed. Historical review and supervised Grade 5 comprehension checks remain pending. The historical publication procedure above is retained for future intentional revisions, not an instruction to rerun older migrations.
