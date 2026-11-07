# Class management and controlled membership removal

Implemented locally. Revised membership-delete permissions and website are not deployed.

My Classes shows a class overview and Manage Students action. Each active roster row includes Class membership → Remove from Class. Confirmation explains lost classroom access, preserved personal progress and possible rejoining with an active code. Unsaved report guidance/notes require their existing discard confirmation first.

The transaction reads and deletes only the exact active membership. Firestore permits the approved owning teacher to delete it only for an active class; other teachers and archived classes are denied. No broad membership update permission was added. Student-owner leave behavior is retained. Personal records remain untouched, while server-side membership checks revoke class feedback and teacher report/private-note access. Retained classroom records can be accessed again after a permitted rejoin.

Validation:

- Teacher browser tests pass at 390px and 1280px: cancellation preserves membership; confirmation removes it, refreshes the roster, clears the report and preserves personal records.
- Separate teacher page navigation passes at 390px and 1280px.
- 122 local Firestore permission/integration checks pass, including foreign-owner denial, archived-class denial, report/feedback revocation, retained progress and active-code rejoining.
- Page generation and data dictionary audit pass. No new collection or attributes are introduced.

Browser tests use mocked records; emulator tests use synthetic local identities. No actual student's membership or progress was modified.
