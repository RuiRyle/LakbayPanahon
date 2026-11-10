# Motion, sound and dashboard polish

9 November 2026. Local package `build/student-web-7t9Dhh` contains finite 260ms admin/teacher content entrances, stable navigation, shared control feedback and visible keyboard focus. Existing reduced-motion preferences suppress the added animations. No perpetual dashboard animation or autoplay game effect was introduced.

Fixed a browser-history restoration bug by resetting pending navigation on `pageshow`. Navigation still preserves modified clicks and the existing brief transition timing. Added ended-node cleanup for local UI tones and suppressed effects in hidden documents. Lesson success uses a softer three-note rising chime; retry uses a shorter quiet pair. Existing mute, volume and narration interruption behavior remains in place.

Validation: four navigation tests, six narration/effects tests, shared student-shell/Web Audio browser acceptance and 86 admin responsive assertions passed. Build has 33 pages, 603 files and zero missing/rejected references. Audio browser evidence checks playback/control behavior, not subjective speaker quality. User listening and visual acceptance remain open. No grading, permissions, deployment or billing changes were made.
