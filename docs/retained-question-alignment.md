# Retained question alignment

Offline review on 2026-10-28 against the dated 2026-10-27 curriculum snapshot. No Firestore calls, migrations or deployment.

All 30 retained questions across three missions map to 15 blueprint topics. Every topic has at least one active scene, two main-question variants and at least two separate active practice items. No practice prompt duplicates a main prompt after basic case/whitespace normalization. No structural errors were found. This does not establish semantic equivalence or prove that a lesson adequately teaches every answer.

| Mission | Topic | Mapped scenes | Practice items | Requested review level |
| --- | --- | --- | ---: | --- |
| chapter2-mission3 | trade-cultural-exchange | chap2-mission3-scene1, chap2-mission3-scene6 | 4 | Available |
| chapter2-mission3 | spread-of-islam | chap2-mission3-scene1, chap2-mission3-scene2 | 4 | Available |
| chapter2-mission3 | islam-teachings | chap2-mission3-scene3 | 4 | Available |
| chapter2-mission3 | muslim-community-development | chap2-mission3-scene4 | 4 | Available |
| chapter2-mission3 | sultanate-of-sulu | chap2-mission3-scene5 | 4 | Available |
| mission-1 | datu-leadership | mission1-scene3, mission1-scene5 | 2 | Available |
| mission-1 | barangay-community | mission1-scene1, mission1-scene2 | 2 | Missing easy |
| mission-1 | community-cooperation | mission1-scene2, mission1-scene5 | 2 | Missing easy |
| mission-1 | social-organization | mission1-scene4, mission1-scene6 | 2 | Missing easy |
| mission-1 | community-customs | mission1-scene5, mission1-scene6 | 2 | Missing easy |
| mission-2 | farming | mission2-scene1, mission2-scene2, mission2-scene6 | 2 | Available |
| mission-2 | fishing | mission2-scene1, mission2-scene2, mission2-scene6 | 2 | Available |
| mission-2 | craftsmanship | mission2-scene5 | 2 | Missing easy |
| mission-2 | barter-exchange | mission2-scene3, mission2-scene4 | 2 | Missing easy |
| mission-2 | intercommunity-trade | mission2-scene3, mission2-scene4 | 2 | Available |

Six topics lack the requested easy difficulty in this baseline. This is a catalog gap, not proof that practice cannot load: the practice selector ranks available items by difficulty distance. A beginner review should nevertheless have appropriately authored easy material rather than rely on harder questions. Do not simply relabel existing medium questions without checking the wording and cognitive demand.

Runtime code review: story.js filters review scenes by the requested reviewTopic within the mission, and its review continuation uses the mission/topic practice link. Existing local tests exercise review and progression behavior. This new audit checks the data mapping, not a new authenticated browser walkthrough. All 367 non-emulator local checks passed, including deliberately broken scene mappings and duplicated practice prompts.

Run node functions/audit-retained-question-alignment.cjs to regenerate docs/validation/retained-question-alignment-local.json. It includes scene excerpts and practice prompts for a teacher to compare. Later lesson migrations can change the baseline, so rerun alignment against the intended coherent final catalog before publication.

Next: author or identify suitable easy review questions for the six listed gaps, preserving distinct prompts and existing evidence policies; then check semantic teaching adequacy. Current live state, teacher review, authenticated end-to-end verification and publication remain pending.
