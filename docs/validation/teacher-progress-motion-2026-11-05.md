# Teacher progress motion and visual consistency - November 5, 2026

Completed the interrupted finishing pass. Extended one-time viewport motion to Student Progress and Announcements. Profiles, classroom cards, summaries, mission evidence and student rows enter briefly; completion rings fill from zero and score bars grow when their evidence becomes visible. Controls keep stable hit areas. System reduced-motion and the saved reduced-motion class cancel active animations, and pagehide disconnects observers. Ring values remain at their real final value when motion is cancelled.

Brought the classroom directory, selected-class toolbar, roster heading, metrics and support panels into the learning report's green/navy/gold palette. Disclosure controls have consistent plus/close indicators and visible focus states. No automatic reads, score or permission changes.

Validation: 74 mocked browser checks passed across 390px and 1280px, including animations actually starting in the viewport and cancellation by reduced-motion. Dashboard and Announcements regressions passed, 22 checks each. Corrected the test harness to place both frames in view for IntersectionObserver checks. Clean package: 32 pages, 571 files, no missing/rejected references. Updated localhost:56738; no live records changed or hosting deployment.

The previous local server had stopped. Restarted the clean vfuZCi build at the original localhost:56738 address and verified HTTP 200. Motion cancellation also verifies visible final content and the actual completion value.

## More visible progress interactions

Lengthened profile and card entrances to 480ms, the completion ring to 1100ms, and score-bar growth to 700ms. Added the student initials badge entrance, stable-row avatar hover, and filter-button feedback. Attempt bars now replay on each panel opening; report and support disclosures briefly reveal their contents. Toggle listeners are removed on pagehide and all scripted motion remains under reduced-motion cancellation. Verified 76 mocked browser checks, including attempt-chart replay. Clean package dlEsDl passed reference validation; updated the running vfuZCi preview files and verified served code.
