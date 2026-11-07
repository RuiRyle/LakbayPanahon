# Detective activity Firestore migration — 5 November 2026

Completed the next scoped data-boundary task after the mission companion migration.

## Published content

Preserved the three existing cases in the offline authoring input `data/discovery-cases.json` and published each as `missions/{missionId}.discoveryCase`:

- `missions/mission-1`: Community Clues.
- `missions/mission-2`: Trade Clues.
- `missions/chapter3-mission1`: Boat Clues.

No new collection or rule is needed. Publication used the original project `lakbaypanahon-1797e`. The publisher inspected exactly these three documents, refused conflicting existing case content, saved a backup, committed only the `discoveryCase` field with document-update-time preconditions, and read back all three cases. Other mission fields matched the pre-publication data. No learner records, quiz grading, rewards, rules or billing changed.

Evidence: [publication record](discovery-cases-publication-2026-11-05.json). Backup: `backups/discovery-cases-1793876859706.json`.

## Runtime behavior

- `js/discovery-cases.js` now contains validation and behavioral helpers only; no authored case catalog remains in the runtime module.
- Mission and Story reuse their already-loaded Firestore mission through the same mission-data handoff as the learning companion. The panel stays hidden for absent/invalid cases and during loading or session changes. Opening a case retains the existing access recheck. There is no additional case-content request on these pages.
- Version, identity, clue/claim/comparison structures, answer indices and source URLs are validated. External sources require HTTPS without embedded credentials. Text uses the existing safe plain-text renderer.
- The museum no longer imports the hardcoded catalog. If the artifact lacks its own historical-use explanation, selecting **Its Meaning** lazily reads its one mission document. It makes no case lookup when merely opening the gallery or exhibit. The result is reused for subsequent tab changes in the same exhibit; closing/reopening may make another read. Missing content uses the existing honest description; request failures offer **Retry Explanation**.
- Account/session changes, panel close and page exit invalidate pending activity work. A delayed museum result cannot replace a newer exhibit or another selected tab.

## Verification

- 13 local tests passed: case validation/content coverage, safe sources, scoped museum loading, missing/invalid data, retry/session isolation, guarded publication and public-package boundaries.
- The discovery browser fixture passed at 1440px and 390px, including all three complete cases, comparisons, authored Bayani feedback, museum loading/retry, delayed results, page restoration and account isolation.
- The achievements layout fixture passed four gallery/exhibit viewport scenarios. The collection toggle/recovery fixture also passed.
- Runtime JavaScript syntax checks and scoped whitespace checks passed.
- Refreshed public inventory: 32 pages, 571 files, zero missing/rejected references. The authoring JSON is not a public dependency.

These browser checks use mocked Firebase, not real student playthroughs. The database content is published and verified, but the frontend code has not been deployed to Hosting. Live Server uses the local code; **Refresh Learning Content** on the mission page clears the existing instructional cache when checking the new case immediately. A new hosted package must be built and deployed for hosted users to receive the runtime changes.

## Scope remaining

This closes the three-case hardcoded runtime finding. It does not create detective activities for every mission or change the separate community illustrations. The remaining AI, trusted-grading, release, privacy and independent learner/content review findings in the overall assessment remain open.
