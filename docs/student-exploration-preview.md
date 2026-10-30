# Temporary student exploration

For the user's personal testing, local Live Server pages now default to preview
mode. Open the site through `localhost` or `127.0.0.1`, sign in as an active
student, and refresh the page. The bottom testing bar confirms the mode.

- Explore Chapters opens every published, active, ready chapter and mission.
- Chapter challenges can open before mission completion.
- My Journey's path also exposes the published lessons.
- Quiz answers are graded normally for feedback, but scores, completion, XP,
  artifacts and badges are not written by preview submissions.
- Practice completion does not write a practice-history record.
- Learning drafts use separate tab storage and do not replace normal cloud drafts.

Click **Restore normal locks** in the bottom bar to test real progression and
reward saving. The page reloads. The setting persists for that tab. Click
**Open all lessons for testing** to enable preview again. A new tab defaults
to preview on local development hosts.

Hosted domains and LAN IP addresses do not automatically enable preview. This
does not change Firestore era prerequisites, completion documents or rules.
Preview is a developer convenience, not a security boundary. Existing browser
grading limitations of the free-plan architecture remain.

Daily Challenge and optional evidence-journal actions retain their existing
behavior; use a dedicated test account when testing those actions.

Implementation entry: `js/exploration-preview.js`, initialized by the Firebase
configuration module. Remove that initialization when the temporary local
exploration feature is no longer wanted. The normal default in all other
modules remains locked progression when the preview flag is absent.
