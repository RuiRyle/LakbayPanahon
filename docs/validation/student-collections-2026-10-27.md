# Achievements and artifact collections

The dashboard now links to Achievements instead of reading and rendering the artifact collection.

## Page structure

1. Achievements & Collections introduction.
2. Two collection toggle buttons showing earned badge and collected artifact counts. Both panels start closed. Selecting a button opens that collection and hides the other; selecting the active button closes it. Expanded state is exposed to assistive technology.
3. Chapter Badges: icon, name, catalog rarity/description and earned date.
4. Historical Artifacts: icon, name, description and collected date.

Each section has independent loading, empty, partial/missing-detail and retry states. A read failure in one collection does not clear the other. Counts use deduplicated ownership; missing catalog details do not discard ownership. All names/descriptions/icons render as text, and responses from old requests/sessions are ignored.

## Firestore structure

| Collection | Purpose |
| --- | --- |
| badges | Existing badge catalog |
| studentBadges | Student badge ownership, queried by userId and joined by badgeId |
| artifacts | Existing artifact catalog |
| studentArtifacts | Student artifact ownership, queried by userId and joined by artifactId |

Dates come from ownership earnedAt, with legacy collectedAt support. Names, descriptions, icons and order come from catalog documents. No runtime collectible list was added to code. No data migration, manual Firestore input or Hosting deployment is part of this change.

## Verification

59 unit tests passed. Focused badge, artifact and combined desktop collection browser suites passed, covering safe text, partial/missing/error/empty states, independent retries, ownership deduplication, stale sessions/requests, summary anchors, dates, computed hidden states and horizontal layout.

[Desktop layout preview using test fixtures](student-collections-preview-2026-10-27.png). The preview is fixture data; it is not evidence of live database contents.

The actual-page walkthrough also passed against original Firestore after this move: earned badges and artifacts displayed together on Achievements, replay did not duplicate ownership/rewards, and profile/progress/collections persisted after fresh login. The temporary account and its owned records were removed. [Live results](student-collections-live-results-2026-10-27.json).

Toggle follow-up: focused badge, artifact and combined collection Chrome suites passed after the visibility change. Background reads/retries do not open a closed panel; session changes close both. The preview shows the artifact toggle selected.

Animation follow-up: collection panels expand/fade/slide in and collapse before switching. Cards enter with a short stagger, and selection buttons animate their visual state. Transitions cancel safely on rapid toggles; session resets close panels immediately. Reduced-motion preference disables panel/card animation. The combined Chrome check verifies animated open/switch/close, latest-click behavior and immediate reduced-motion changes.
