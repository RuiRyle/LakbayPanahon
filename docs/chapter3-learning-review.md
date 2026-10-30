# Chapter 3 offline learning review

Reviewed 29 October 2026 using the dated curriculum snapshot and local balangay, trade-network, goods-exchange and maritime-center revisions. No Firestore or new historical-source lookup. This pass compares instructional content and question reasoning; independent factual review and Grade 5 comprehension remain open.

## Lesson-to-quiz comparison

The candidate lessons explain the 20 main-quiz topics across four missions:

| Mission | Topics and lesson support |
| --- | --- |
| Seafaring and the Balangay | Water routes: scene 1; Butuan boat evidence: scene 2; joining skills: scene 3; changing travel conditions: scene 4; protecting fragile remains: scene 5. |
| Asian Trade Networks | Indirect exchange: scene 1; comparing ceramic origins/context: scene 2; obtaining useful goods: scene 3; route uncertainty: scene 4; contact without identical cultures: scene 5. |
| Goods and Cultural Exchange | Object use in context: scene 1; tool versus technique: scene 2; sharing ideas: scene 3; local adaptation: scene 4; limited claims from evidence: scene 5. |
| Maritime Communities | Location and supporting work: scene 1; comparing evidence at Butuan: scene 2; different contributions: scene 3; dated evidence of change: scene 4; heritage care: scene 5. |

The revised lessons explicitly distinguish original finds from teaching diagrams, fictional routes from documented voyages, and contact from proof that everyone adopted the same practices. Do not simplify those distinctions away. The named-source and technical boatbuilding passages still need reviewer/learner checks; matching topic tags does not prove understanding.

## Clear issue corrected in draft

Three existing decisions use obviously irrelevant choices: boat color, a prettier source, or whether a story sounds exciting. These make elimination possible without applying the lesson. `data/chapter3-decision-quality-migration.json` replaces them with plausible misconceptions and more specific feedback:

- Mission 1 scene 1: checking only the river, distance or previous use versus checking the whole journey.
- Mission 2 scene 4: automatically trusting one source or hiding disagreement versus comparing context and uncertainty.
- Mission 3 scene 3: inferring everyone's response from one object, map or opinion versus investigating use across places and time.

Only decision question wording, incorrect choices and explanatory feedback change. Original correct-answer strings, situations, main quiz banks, difficulty, rewards and progression rules are preserved. The scenarios remain fictional classroom investigations. Improved distractors are editorial candidates, not measured difficulty or proof of educational effectiveness.

## Local verification

- Three guarded revisions have distinct choices and retain their original correct answers.
- Combined pending-queue compatibility passes with no overlapping fields.
- Candidate content audit reports no missing local images, structural topic gaps or duplicate/missing-correct scene choices.
- The existing 40-scene Chapter 3/4 roadmap browser fixture now includes these three drafts; rendering, clue exploration, correct decisions, authored help and recovery passed with the navy theme loaded.

The migration runner is dry-run by default and requires exact expected situation, question, choices, answer and explanation. No publication was attempted. No artwork was newly inspected or approved during this pass. Next offline review can cover Chapter 4 using the same focused approach.
