# Student avatar catalog

Implemented 26 October 2026 in the original `lakbaypanahon-1797e` database on the free plan.

## Data contract

Each `avatars/{avatarId}` document owns:

| Field | Meaning |
| --- | --- |
| name | Display name |
| kind | `initials` or `emoji`; code renders the corresponding behavior |
| icon | Emoji text for an emoji entry; null for initials |
| status | `active` or `inactive` |
| order | Display ordering |
| isDefault | Whether this is the preferred initial choice for profiles without a saved avatar |

The document ID is stored as `users.avatarId`. No runtime list of allowed IDs remains in the browser or rules. New valid active catalog documents appear after reloading the page. Symbols and names are rendered as text, not HTML.

## Availability and failure behavior

The picker loads the catalog from Firestore. Loading failures show a retry control; name editing remains available. An empty catalog does not block name changes.

An inactive entry cannot be newly selected. Students already using it may keep it while editing their names. If the document has been removed or is invalid, the saved ID is preserved and the interface displays the student's initial. Profile saving omits unchanged avatar IDs, so a catalog outage does not clear a student's selection.

The existing profile document listener continues to refresh saved names and avatars. Open form drafts are preserved. Catalog changes are loaded on page reload or the catalog retry action.

## Initialization and rules

`data/avatar-catalog.json` is bootstrap/migration data extracted from the previous nine choices. Runtime pages do not import it. `functions/setup-avatars.cjs` is read-only by default; `--apply` creates missing catalog entries with existence preconditions and a backup. It preserves existing catalog documents and does not migrate student profiles.

Students can read the catalog. Client catalog writes are denied. Profile rules validate new selections against the active catalog and permit unchanged existing selections. Protected account/reward fields retain their existing restrictions.

Nine catalog documents were initialized and rules were compiled and deployed. Existing student profiles and XP were unchanged.

## Validation

37 unit tests passed, including new catalog-driven selection and inactive selection preservation coverage. The Chrome profile test passed initial catalog failure, name-only saving, recovery, new choices, retired choices, preview, cancel and pending-save behavior.

A temporary live student verified active selections, denied unknown/inactive selections, unchanged unavailable selections, protected fields and persistence after a fresh Firebase sign-in. The temporary account, profile and catalog entry were removed afterward.

The frontend remains a local workspace change; Firebase Hosting was not deployed. Phone visual acceptance remains on the main workflow checklist.
