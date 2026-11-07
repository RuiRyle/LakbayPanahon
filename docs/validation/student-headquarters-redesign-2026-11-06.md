# Student Headquarters redesign — 6 November 2026

Implemented within the existing HTML/CSS/vanilla JavaScript application. No frontend framework, grading change, XP calculation change, achievement condition change, access-rule change, database migration or deployment was introduced.

## Design and behavior

- Personalized Filipino welcome banner uses the existing maritime lesson artwork and retains the saved explorer level, XP progress and reward link.
- Current lesson is the primary card, with its existing chapter/era metadata, mission progress, historical illustration and gold action. Normal ongoing lessons say Continue Learning; quiz/practice resumption, targeted review, chapter challenges and error recovery keep their explicit existing labels and routes.
- Four compact statistics show XP, distinct completed missions, earned badges and explorer level. The new level statistic mirrors the existing level output, including Daily Challenge updates, rather than calculating levels separately.
- The existing bounded four-chapter preview becomes an illustrated connected trail. Original order, descriptions and access flags remain derived from `buildJourneyPath`. Completed chapters show a Revisit action; locked chapters remain noninteractive.
- Daily Challenge retains its existing modal, question selection, Philippine day boundary, reward configuration, answer feedback, completion and replay protections.
- Bayani suggestions use two allowlisted history prompts. A separate UI module prepares an editable question only after the existing chat input is ready. It never sends a message or changes the AI backend. Unknown prompt keys are ignored.
- Collection previews query current-student ownership and cached public catalogs. Each collection is independent and recoverable; stale account reads cannot repaint after sign-out. Unknown catalog details are not replaced with fabricated earned items. Legacy artifacts without a status field follow the existing collection convention. Newly earned animation requires an ownership change observed between loads; it does not trigger an award.
- Existing History Recall questions, authored explanations, next-clue callbacks and review navigation remain functional. Recall answers do not write progress or award XP.
- Scoped responsive styles include 200ms hover transitions, 600ms progress transitions and reduced-motion/high-contrast handling. Existing sidebar, header, profile dialog and persistent student shell remain in use.

The collection previews add two owner-filtered reads and two public catalog loads; the existing tab-scoped catalog cache is reused. Core dashboard counts and recommended lessons do not depend on those optional preview reads.

## Verification

- 52 local logic test entries passed across dashboard sessions/recovery, chapter trail, progression/access, recall, daily policy, shell routes and new collection/prompt tests.
- 23 populated-dashboard browser assertions passed at each of 1440, 1024, 768, 390 and 320 pixels (115 assertions), including legacy-layout interference, larger text, long Filipino chapter titles, recovery labels, ownership states and reduced motion.
- Existing dashboard navigation browser fixture passed start/continue, safe text, targeted review, chapter challenge, complete/empty and retry states.
- Existing Daily Challenge browser fixture passed loading, reward display, wrong/correct answers, completion, replay prevention and retry. Added check confirms that the new level statistic follows the existing daily level update.
- Actual application/Firebase SDK walkthrough passed 16 checks with isolated local emulator accounts, covering personalized greeting, saved statistics, catalog/progress, locked chapters, artwork loading, collection refresh, prompt navigation and actual lesson navigation through the student shell. See `student-headquarters-browser-2026-11-06.json`.
- Desktop/tablet/mobile screenshots were inspected. They are stored as `student-headquarters-*` and `student-headquarters-trail-*` PNG files in this directory. They show synthetic local accounts, not production students.
- Fresh package: `build/student-web-q1N9Hi/public`, 33 pages and 583 files, zero missing/rejected references. Local test services were stopped. Nothing was deployed.

The actual SDK screenshot run preceded the final recall-disabled-text readability adjustment and level-statistic synchronization change; those final refinements passed the current-source responsive and Daily Challenge browser fixtures. The final package includes them.

## Reference and verification limits

The attachment supplied a written design brief but no screenshots. The redesign follows that brief and the existing design system; exact matching to an unseen reference cannot be verified. Existing lesson illustrations are reused decoratively rather than presented as historical evidence.

AI-provider calls were not enabled in the local emulator. Tests verify prompt preparation and existing chat navigation, not production AI availability. Populated collection and recall cases use synthetic browser fixtures; the actual local account validates honest empty states and saved zero XP. No production publication or real-account acceptance is claimed.

## Repeatable checks

```powershell
node --test tests/dashboard-presentation.test.cjs tests/home-learning-trail.test.cjs tests/student-dashboard-session.test.cjs tests/student-dashboard-recovery.test.cjs tests/student-journey.test.cjs tests/return-to-learn.test.cjs tests/daily-policy.test.cjs tests/student-shell-route.test.cjs
node tests/student-headquarters-browser.cjs
node tests/student-dashboard-browser.cjs --visual-review
node tests/daily-challenge-browser.cjs
```

For the actual app check, start `node tools/start-local-emulator.cjs`, wait for its website-ready message, then run `node tests/student-headquarters-emulator.cjs`.
