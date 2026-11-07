# Teacher application layout refinement — November 5, 2026

The qualification page now uses a centered full-width onboarding layout instead of inheriting the teacher dashboard's reserved 290-pixel sidebar space. It retains the shared navy/gold visual identity, sun logo, disclosure cursor styling and reduced-motion preferences.

The page groups information into About you, Institution and role, Qualifications, and optional Supporting evidence. Account verification and application status have their own side panel on desktop and stack above the form on mobile. A three-stage indicator reflects actual email, draft/submitted and approval states. Controls retain their original IDs and existing validation, draft, revision, evidence and approval behavior. The upload area shows accepted format/size and selected filename; the privacy details remain available next to the acknowledgement. No credential requirements or access permissions changed.

Validation: 6 application policy tests passed. Actual application/client/evidence modules with mocked records passed 19 browser checks at both 1280px and 390px (38 checks), including correct progress states, full-width layout, no horizontal overflow, draft preservation, verified-email submission, private evidence dialog centering, revisions, approved access and sign-out cleanup. Desktop/mobile screenshots were visually inspected. No real applications were submitted or altered by these checks.

The existing main-Firebase local preview was updated. No hosting deployment.
