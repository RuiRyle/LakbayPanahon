# Music navigation fix — 31 October 2026

The auth guard removes the departing document's authenticated class during pagehide. The page-transition music observer interpreted that lock as sign-out and stopped the persistent shell player. The old audio fixture omitted this guard behavior, so it did not reproduce the interruption.

The fixture now removes the class on actual child pagehide. It reproduced the failure at the first Settings-to-Home transition. The fix flags departure and defers interpreting class removal until pagehide dispatch completes, since mutation callbacks may run between listeners. Real auth loss still stops playback; navigation preserves the same AudioContext and master music graph.

`node tests/student-shell-audio-browser.cjs` now passes all continuity, reading/focus, volume, music-off persistence and auth-loss checks. See the updated JSON report. This uses real Web Audio with simulated child authentication, not Firebase or physical speaker listening. Reading attenuation and optional Focus audio muting remain intentional. Home-to-login navigation and full outer-page reloads replace the document and cannot preserve the shell's AudioContext.

No deployment or settings changes were performed.
