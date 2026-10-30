# Student Evidence Journal

Students open clues in a lesson and choose **Save Opened Clues** below the exploration section. Each opened clue is saved once in `studentEvidenceJournal`. Saving is optional, costs nothing, awards no XP and makes no claim of mastery. The action works in ordinary lessons and topic review. Students can continue learning if a save fails; retry safely skips already saved references.

**My Journey → My Evidence Journal** lists saved discoveries, supports a mission filter, links back to relevant lesson review and allows bookmark removal. There is no new sidebar destination. The journal loads independently of journey recommendations and offers its own refresh/retry. Auth changes clear entries and reject stale responses. A missing or retired source becomes an unavailable bookmark that the student can remove.

## Data

Each document uses ID `{userId}_{sceneId}_{clueIndex}` and fields `userId`, `chapterId`, `missionId`, `sceneId`, `clueIndex`, and server `savedAt`. A transaction checks existence before creation, preserving the first saved date on repeat saves. Multiple clue saves may partly succeed offline; retry does not duplicate them. No free-form personal text, copied lesson content, answer keys or reward fields are stored.

Firestore `storyScenes.exploreItems` remains the source of authored title/discovery text. The journal displays the current wording at that reference, not a historical copy of the original discovery. Editors should avoid changing the meaning/order of existing clue positions without considering saved bookmarks. Topic links use the scene's first review topic and may include both its teaching scene and recap. They do not bypass story prerequisite checks or unlock lessons.

The prologue chapter challenge now includes one guided evidence-and-conclusion task and marks matching journal clues; see evidence-challenge-pilot.md. Saving clues remains optional because the task supplies the same lesson evidence to everyone. Personal annotations and automatic comprehension claims from bookmarks are not implemented.

## Permissions and deployment

The journal-only Firestore rules update was compared with the deployed baseline, compiled on the server, backed up, published and read back on the original `lakbaypanahon-1797e` project. Active students can query/read their own entries, create valid references to active scene/mission/chapter relationships and delete their own entries. Entries cannot be rewritten. Invalid clue indexes and reward fields are rejected. The collection appears automatically after the first save; no manual Firestore document setup is needed.

`functions/deploy-evidence-journal-rules.cjs` defaults to comparison/compilation only. `--apply` refuses unrelated rules differences and publishes only the reviewed rules source. Website source/assets were not deployed to Hosting; use Live Server or include them in the normal website deployment.

## Verification

101 local non-emulator unit tests passed. Focused Chrome checks exercised actual scene save controls, unopened-clue handling, repeated saves, failed save/retry, journal rendering, safe authored text, lesson links and removal. Story and geography browser checks passed. Original-project permission tests verified ownership, scoped queries, invalid references, forbidden rewrites, reward-field rejection and owner deletion. Both temporary student accounts and all test records were removed.

Grade 5 comprehension review and use of saved evidence in a full authenticated chapter walkthrough remain separate acceptance work. No existing learner records or reward settings were migrated.
