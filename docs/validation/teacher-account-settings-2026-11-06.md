# Teacher account settings � expanded profile and comfort controls

Updated 2026-11-06. Open Teacher > Account Settings (pages/teacher-settings.html). The current teacher shell, loading screen and page transitions remain shared with the other teacher destinations.

## Features

- Preferred display name: saves to Firebase Authentication displayName using updateProfile. It changes the account greeting while keeping users.firstName/lastName and approved application legalName intact. Failed requests retain the entered text; unsaved name changes are protected on navigation/reload.
- Avatar: reads the active avatars catalog; saves the selected avatarId and server updatedAt to the signed-in user's existing profile under existing rules. Name and avatar have independent save feedback. Empty/error catalogs remain explicit.
- Security: sign-in email, email-verification state and teacher role; password-reset email action with success/error feedback and duplicate-click protection after success.
- Verification: approved revision matching, approved legal name and institution when available, application link and explanation of credential resubmission. No credentials or verification fields are edited by the account page.
- Display: reduced motion, higher contrast, three text sizes and deep/soft navy surface. Shared browser preference keys are reused; unavailable storage is reported as visit-only. Teacher reading size now applies on subsequent teacher pages. These preferences are browser-wide, not account-synced.
- Help: password recovery guidance and a separate classroom-management destination.

## Design

Identity header with saved avatar, section anchors, aligned navy/teal cards, gold accents, readable status badges, generous spacing, visible focus controls, mobile stacking and subtle motion that respects reduced-motion preferences.

## Validation

Account-settings browser checks passed at 390px and 1440px, including failed/successful profile edits, catalog avatar persistence, verification, actual shared preference handlers and extra-large text containment. Existing student settings scenarios and native keyboard/reload tests passed, as did publication recovery and dashboard checks. Release packaging verifies 33 pages and 572 files with zero missing/rejected references.

No Firestore schema change. The avatar catalog read rule now includes active approved teachers, alongside students. This narrow rules change was tested in the emulator and has not been published; live Firebase will keep avatar choices unavailable until that rule is activated. Verification details remain independent of avatar-load failures. Tests do not send real email or save production profiles. Live email delivery and production-hosted acceptance remain separate checks. Nothing was deployed.

## Focused UI polish (6 November 2026)

The account screen now uses one compact identity header, a navigation rail on desktop and horizontally scrollable tabs on mobile. Profile, Security, Appearance, Verification and Help show one panel at a time while preserving unsaved input. Arrow keys, Home and End move through tabs with focus and selected-state semantics. Existing section hashes remain addressable.

Avatar dropdowns are replaced visually with catalog tiles and selected-state outlines; when no saved catalog avatar exists, the initials choice is selected where available. Appearance offers Deep Navy / Soft Navy preview cards, a text preview and aligned preference switches. Repeated identity fields are removed visually from Security. Section changes fade briefly without moving the layout; reduced-motion preferences are respected.

Validation: 48 account-settings browser assertions at mobile/desktop widths, existing dashboard checks, and actual emulator screenshots. The current release build has 33 pages, 572 files and zero missing/rejected references. This UI pass made no further database or rules changes. The previously documented teacher-avatar read permission still awaits live publication.

## Hierarchy and form layout revision (6 November 2026)

Replaced the oversized identity banner and second navigation rail with a compact page heading, separate signed-in identity summary, and horizontal section tabs inside one settings surface. Profile now uses shared setting rows: explanatory label at left and related controls/actions at right, stacking on mobile. Security rows use the same columns. Account styles were consolidated into one section instead of retaining successive competing layout overrides.

Desktop and mobile screenshots were inspected. Account functional/layout assertions passed across 390px and 1440px, including extra-large text and keyboard navigation. No account storage or permission changes were introduced by this visual revision.
