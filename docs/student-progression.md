# Student level progression

Implemented on 26 October 2026 against the original `lakbaypanahon-1797e` database and existing free plan.

## Source of truth

Firestore document: `learningSettings/progression`.

| Field | Current value | Validation |
| --- | --- | --- |
| xpPerLevel | 100 | Positive safe integer |
| version | 1 | Positive safe integer |

The initial 100 preserves the existing learning pace. It is bootstrap data in `data/progression-settings.json`, not a runtime fallback. Student code reads the document. Students can read the settings; client writes are denied.

The code calculates level as `floor(total XP / configured XP per level) + 1`. Level progress, remaining XP and percentages use the same calculation. Percentage arithmetic still uses 100 because it represents a percentage.

## Behavior

- Dashboard and quiz headers derive the current level from saved XP and current Firestore configuration rather than trusting a potentially stale `users.level` cache.
- The dashboard and daily-challenge progress bars use the shared progression calculation.
- Reward transactions read the policy within the transaction, so configuration changes participate in transaction consistency. Firestore rules independently read the same document to validate the written level.
- Saved submission replays display the current level and XP without awarding another reward.
- Missing/invalid settings do not substitute a built-in XP threshold. Dashboard learning content remains available with an unavailable level label; reward saves requiring the policy report an error and can be retried.
- The undeployed Cloud Function code also uses configurable progression. It remains unused by the accepted free-plan student flow.

## Migration and future changes

The live audit found two existing student accounts. Both had valid XP and correct cached levels, so no student XP or level fields were changed. The settings document was created, and the updated rules were deployed.

`node functions/setup-progression.cjs` audits the original database without writing. `node functions/setup-progression.cjs --apply` initializes a missing policy and reconciles only incorrect cached levels. It backs up affected progression fields, preserves XP, and uses update-time preconditions to avoid overwriting concurrent changes. An existing valid policy is respected rather than reset to the bootstrap value. Invalid student XP aborts the migration for review.

For an intentional future progression change, update `xpPerLevel` and increment `version` in Firestore using a trusted administrative account. Run the audit/reconciliation command afterward. Open pages show the current policy on reload; reward transactions always fetch it again. Previous quiz attempts retain historical response metadata, while replay displays derive the current level.

## Verification

- 36 unit tests passed, including multiple XP spacings, exact boundaries, malformed settings, browser/backend parity, progress-bar rendering, configuration changes during replay and failed saves with no reward mutation.
- Quiz and practice Chrome regression tests passed.
- Firebase compiled and deployed the updated rules successfully.
- A temporary student passed a live Firestore smoke test for saved failures, a fresh retry, a 3/5 pass and duplicate-reward protection under the new rules. Its account and learning records were removed.
- Frontend changes are local workspace files. Firebase Hosting was not deployed.
