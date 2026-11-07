# Login startup timing

Cold-cache actual Chrome checks against local staged HTTP packages, with remote Firebase SDK delivery enabled. No credentials submitted, account created or student data read.

Before optional Functions SDK separation: document response 23ms; DOMContentLoaded 308ms; sampled auth-ready time 2423ms. Firebase app/auth/Firestore/Functions downloads each took approximately 2.2 seconds.

After separation: document response 16ms; DOMContentLoaded 71ms; sampled auth-ready time 2401ms. Firebase app/auth/Firestore still took approximately 2.2 seconds. Functions SDK was absent. These two runs are diagnostic samples, not a statistically established performance gain; cold auth readiness remains dominated by external module delivery.

Changes: internal navigation no longer waits 640ms; login links bypass transition overlays; login dependency preload/preconnect hints; landing page login-code preloading on pointer/focus intent; optional callable SDK moved from firebase-config.js into firebase-functions.js and its two consumers updated. Emulator region/endpoints and fresh profile checks are preserved. Preloading does not execute authentication code or send credentials.

59 local tests passed for navigation, sign-in persistence, guards, Firebase environment routing and public package boundaries. Actual Chrome startup suite passed 10 checks including blocked remote-script visibility, prevention of unready credential submission and reload recovery. Final package build/student-web-92y7Ba/public contains 586 files with zero missing/rejected references. No deployment performed.

This measures startup, not actual remote sign-in/profile latency, hosted server performance or signed-in scrolling. No claim that the entire project's lag is resolved. Desktop/device rendering and authenticated data loading remain separate profiling work. Both owned temporary HTTP servers were stopped after measurement.
