# Student shell audio and populated Home follow-up — 30 October 2026

No production code changes. Firebase, exploration preview, curriculum, deployment settings and paid activation were untouched.

## Shared audio acceptance

`node tests/student-shell-audio-browser.cjs` passed **25 checks**. [Results and source hashes](student-shell-audio-local.json).

The fixture runs the actual student shell, route helper and audio-host modules, plus each child page's actual markup/styles and preference code. Chrome uses real Web Audio with an instrumented native AudioContext, not a fake synthesizer. Playback begins through a trusted Enter key event under a user-activation-required autoplay policy. Instrumentation records context identity, music graph identity, audio time and gain-automation targets without changing the production modules.

- Home → My Journey → Story → Quiz → Practice → Chapter Challenge → Settings retains the same parent, player, music gain node and one running AudioContext. Audio time advances across the child navigations.
- Story entry sets the softer reading level. Quiz/practice/chapter-challenge entry sets the focus attenuation level. Returning to Settings restores normal gain without replacing the music graph.
- Daily Challenge focus applies/removes attenuation. Music volume updates the shared player, and disabling Focus audio preserves the chosen volume on quiz entry.
- Turning music off stops background playback and stays off after navigation. Explicitly starting music again reuses the existing AudioContext.
- Removing the child's authenticated marker stops the shared player. This is a simulated auth-loss lifecycle event, not a Firebase sign-out verification.

Auth/data scripts are removed from child pages; authenticated state is supplied by the isolated fixture. External connections are blocked. Child navigations are native frame URL changes, not a new assertion about every sidebar click/draft prompt. This closes local shell/audio continuity behavior under those conditions. It does not certify real Auth guards, hosted permissions, device output, audible balance, musical quality or a fully populated signed-in app. Focus attenuation keeps the underlying music timeline running at the existing very low gain floor; it is not a stop/restart of the timeline. Actual listening remains required.

## Populated Home review

`node tests/student-dashboard-browser.cjs --visual-review` passed. It now uses the real `home-learning-trail.js` and `journey-path.js` helpers to render completed, current and locked lesson rows alongside the next-step card. Long Filipino sample titles and extra-large reading size remain within the row boundaries. The locked row has no action URL; the current row preserves its chapter ID. The screenshot was inspected: state badges, progress tracks and next-step action remain readable and aligned.

The data are explicitly fabricated fixture examples. Top XP/profile/count sections retain their static loading/default state because their Firestore controllers are not invoked. This is acceptance of populated lesson rows and guidance, not all Home sections or real saved totals. No demo records or content were added to the application or Firestore.

Ten focused unit checks also pass for Home trail ownership/locks/current-window selection, shell route validation and exploration-preview isolation. Existing passing suites were not rerun wholesale; no new 281-check combined pass is claimed.

## Remaining gates

Actual audio listening and intended hosted/Auth behavior remain open. The local native-keyboard/reload, focus controls and shell/player continuity now have recorded evidence. Other populated/hosted UI states, bounded Firebase save/security acceptance, guarded content publication, privacy arrangements, teacher/Grade 5 review and eventual normal-lock confirmation remain the fixed checklist items. No new feature or teacher workflow is introduced.
