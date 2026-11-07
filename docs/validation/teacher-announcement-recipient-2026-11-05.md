# Announcement composition and receiving class

Teachers can compose announcements before class creation or selection. Receiving class is required at save/publication time and is limited to active owned classes. Changing it preserves message text and updates the preview. Missing-recipient attempts retain text. Existing announcement edits lock their original recipient; class archival refreshes recipient choices. Successful saves switch to the receiving class context and refresh saved messages.

The current-page composer uses existing unsaved-edit protection; it is not a server-stored account-wide draft before a class is chosen. No new database schema or permission expansion is introduced. Existing publication ownership/status rules apply.

Local browser tests cover pre-class editor availability, missing-recipient preservation, audience-preview changes, cross-class saving, editing/publication and archived recipient exclusion at desktop/mobile widths. Separate teacher-page navigation remains tested. Website changes are local and unpublished.
